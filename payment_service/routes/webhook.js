import express from 'express';
import { updateUser, updatePaymentStatus } from '../utils/database.js';
import { formatSuccessResponse, formatErrorResponse } from '../middleware/errorHandler.js';

const router = express.Router();

// Handle payment webhooks from Dodo
router.post('/payment', async (req, res) => {
    try {
        const event = req.body;

        console.log('Webhook received:', event.type);

        // Handle different webhook events
        switch (event.type) {
            case 'payment.completed':
                await handlePaymentCompleted(event.data);
                break;

            case 'payment.failed':
                await handlePaymentFailed(event.data);
                break;

            case 'subscription.created':
                await handleSubscriptionCreated(event.data);
                break;

            default:
                console.log('Unhandled webhook type:', event.type);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json(
            formatErrorResponse('WEBHOOK_ERROR', 'Failed to process webhook')
        );
    }
});

// Handle successful payment
async function handlePaymentCompleted(data) {
    const { id, metadata, amount, currency } = data;

    if (metadata && metadata.username) {
        // Update user subscription
        await updateUser(metadata.username, {
            subscriptionPlan: metadata.planId || 'pro',
            subscriptionStatus: 'active',
            trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });

        // Update payment status
        await updatePaymentStatus(id, 'completed');

        console.log(`Payment completed for user: ${metadata.username}`);
    }
}

// Handle failed payment
async function handlePaymentFailed(data) {
    const { id, metadata } = data;

    if (metadata && metadata.username) {
        await updatePaymentStatus(id, 'failed');
        console.log(`Payment failed for user: ${metadata.username}`);
    }
}

// Handle subscription creation
async function handleSubscriptionCreated(data) {
    const { metadata } = data;

    if (metadata && metadata.username) {
        await updateUser(metadata.username, {
            autoPayment: true
        });

        console.log(`Subscription created for user: ${metadata.username}`);
    }
}

export default router;
