import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { standardLimiter, burstLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import checkoutRoutes from './routes/checkout.js';
import subscriptionRoutes from './routes/subscription.js';
import webhookRoutes from './routes/webhook.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: true, // Reflects the request origin, effectively allowing all
    credentials: true
}));

app.use(express.json());

// Apply rate limiters
app.use(standardLimiter);
app.use(burstLimiter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.DODO_ENVIRONMENT || 'test_mode'
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/webhook', webhookRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist'
    });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.DODO_ENVIRONMENT}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
});
