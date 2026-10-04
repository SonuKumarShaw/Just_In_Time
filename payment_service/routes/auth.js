import express from 'express';
import { getUser, createUser } from '../utils/database.js';
import { formatErrorResponse } from '../middleware/errorHandler.js';

const router = express.Router();

// Register or get user
router.post('/register', async (req, res, next) => {
    try {
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json(
                formatErrorResponse('INVALID_REQUEST', 'Username and email are required')
            );
        }

        // Check if user already exists
        let user = await getUser(username);

        if (!user) {
            // Create new user
            user = await createUser({ username, email });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionStatus: user.subscriptionStatus
            }
        });

    } catch (error) {
        next(error);
    }
});

// Login user (get user info)
router.post('/login', async (req, res, next) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json(
                formatErrorResponse('INVALID_REQUEST', 'Username is required')
            );
        }

        let user = await getUser(username);

        if (!user) {
            return res.status(404).json(
                formatErrorResponse('USER_NOT_FOUND', 'User not found')
            );
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                subscriptionPlan: user.subscriptionPlan,
                subscriptionStatus: user.subscriptionStatus
            }
        });

    } catch (error) {
        next(error);
    }
});

export default router;
