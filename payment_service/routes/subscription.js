import express from 'express';
import { getUser, updateUser } from '../utils/database.js';
import { formatErrorResponse } from '../middleware/errorHandler.js';

const router = express.Router();

// Get subscription details
router.get('/:username', async (req, res, next) => {
    try {
        const { username } = req.params;
        const user = await getUser(username);

        if (!user) {
            return res.status(404).json(
                formatErrorResponse('USER_NOT_FOUND', 'User not found')
            );
        }

        res.json({
            subscriptionPlan: user.subscriptionPlan,
            subscriptionStatus: user.subscriptionStatus,
            trialStartDate: user.trialStartDate,
            trialEndDate: user.trialEndDate,
            autoPayment: user.autoPayment
        });

    } catch (error) {
        next(error);
    }
});

// Toggle auto-payment
router.post('/update-autopay', async (req, res, next) => {
    try {
        const { username, autoPayment } = req.body;

        if (!username || typeof autoPayment !== 'boolean') {
            return res.status(400).json(
                formatErrorResponse('INVALID_REQUEST', 'Missing required parameters')
            );
        }

        const user = await getUser(username);
        if (!user) {
            return res.status(404).json(
                formatErrorResponse('USER_NOT_FOUND', 'User not found')
            );
        }

        const updatedUser = await updateUser(username, { autoPayment });

        res.json({
            success: true,
            autoPayment: updatedUser.autoPayment,
            message: `Auto-payment ${autoPayment ? 'enabled' : 'disabled'}`
        });

    } catch (error) {
        next(error);
    }
});

// Cancel subscription
router.post('/cancel', async (req, res, next) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json(
                formatErrorResponse('INVALID_REQUEST', 'Username is required')
            );
        }

        const user = await getUser(username);
        if (!user) {
            return res.status(404).json(
                formatErrorResponse('USER_NOT_FOUND', 'User not found')
            );
        }

        const updatedUser = await updateUser(username, {
            subscriptionStatus: 'cancelled',
            autoPayment: false
        });

        res.json({
            success: true,
            message: 'Subscription cancelled successfully',
            subscriptionStatus: updatedUser.subscriptionStatus
        });

    } catch (error) {
        next(error);
    }
});

export default router;
