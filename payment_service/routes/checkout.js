import express from 'express';
import { createCheckoutSession, getCheckoutSession } from '../utils/dodoPayments.js';
import { getUser, updateUser, createPayment } from '../utils/database.js';
import { formatErrorResponse, formatSuccessResponse } from '../middleware/errorHandler.js';

const router = express.Router();

// Create checkout session
router.post('/create-session', async (req, res, next) => {
    try {
        const { planId, username } = req.body;

        if (!planId || !username) {
            return res.status(400).json(
                formatErrorResponse('INVALID_REQUEST', 'Missing required parameters: planId and username')
            );
        }

        // Get user
        const user = await getUser(username);
        if (!user) {
            return res.status(404).json(
                formatErrorResponse('USER_NOT_FOUND', 'User not found')
            );
        }

        // Determine product ID and plan details
        let productId, amount;
        if (planId === 'free') {
            // Free plan - no payment needed
            await updateUser(username, {
                subscriptionPlan: 'free',
                subscriptionStatus: 'active',
                trialStartDate: new Date().toISOString(),
                trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

            return res.json({
                success: true,
                plan: 'free',
                message: '1 month free trial activated'
            });
        } else if (planId === 'pro') {
            // Pro subscription - use Dodo Payments checkout
            productId = 'pdt_0NUvFLvpmwSBpHfMGqbYm'; // Your actual Dodo product ID
            amount = 199900; // ₹1,999 in paise

            console.log('Pro plan selected - attempting Dodo checkout');

            // Try to create checkout session
            const returnUrl = `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`;

            try {
                const session = await createCheckoutSession({
                    productId,
                    customerEmail: user.email,
                    customerName: user.username,
                    returnUrl,
                    metadata: {
                        userId: user.id,
                        username: user.username,
                        planId
                    }
                });

                console.log('Full Dodo Session Response:', JSON.stringify(session, null, 2));
                console.log('Dodo checkout session created:', session.checkout_session_id || session.id);

                // Create pending payment record
                await createPayment({
                    userId: user.id,
                    transactionId: session.id,
                    amount: amount / 100,
                    currency: 'INR',
                    status: 'pending',
                    planType: planId
                });

                // Update user with pending subscription
                await updateUser(username, {
                    subscriptionPlan: planId,
                    subscriptionStatus: 'pending',
                    trialStartDate: new Date().toISOString()
                });

                return res.json({
                    success: true,
                    checkoutUrl: session.checkout_url,
                    sessionId: session.id
                });
            } catch (dodoError) {
                // Fallback: If Dodo product doesn't exist, activate trial
                console.warn('Dodo checkout failed:', dodoError.message);
                console.log('Falling back to trial activation');

                await updateUser(username, {
                    subscriptionPlan: 'pro',
                    subscriptionStatus: 'trial',
                    trialStartDate: new Date().toISOString(),
                    trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    autoPayment: true
                });

                return res.json({
                    success: true,
                    plan: 'pro',
                    message: 'Pro trial activated. Create product "prod_pro_subscription" in Dodo dashboard for payments.',
                    redirectToDashboard: true
                });
            }
        } else {
            return res.status(400).json(
                formatErrorResponse('INVALID_REQUEST', 'Invalid plan ID')
            );
        }

    } catch (error) {
        console.error('Checkout error:', error);
        console.error('Error details:', error.message);
        next(error);
    }
});

// Verify session (for manual/frontend verification)
router.post('/verify-session', async (req, res, next) => {
    try {
        const { sessionId, username } = req.body;

        if (!sessionId || !username) {
            return res.status(400).json(
                formatErrorResponse('INVALID_REQUEST', 'Missing required parameters')
            );
        }

        console.log(`Verifying session ${sessionId} for user ${username}`);

        // Get session details from Dodo
        const session = await getCheckoutSession(sessionId);
        console.log('Session status from Dodo:', session.status);

        if (session.status === 'completed' || session.status === 'paid') {
            // Update user subscription
            await updateUser(username, {
                subscriptionPlan: session.metadata?.planId || 'pro',
                subscriptionStatus: 'active',
                trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

            return res.json({
                success: true,
                status: 'active',
                message: 'Payment verified and subscription activated'
            });
        } else {
            return res.json({
                success: false,
                status: 'pending',
                message: `Payment status is ${session.status}`
            });
        }

    } catch (error) {
        console.error('Verification error:', error);
        next(error);
    }
});

export default router;
