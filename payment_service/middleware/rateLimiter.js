import rateLimit from 'express-rate-limit';
import { formatErrorResponse } from './errorHandler.js';

// Standard rate limiter: 1000 requests per minute
export const standardLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    message: formatErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests, please try again later'
    ),
    standardHeaders: true,
    legacyHeaders: false,
});

// Burst limiter: 100 requests per second
export const burstLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 100, // 100 requests per second
    message: formatErrorResponse(
        'RATE_LIMIT_EXCEEDED',
        'Too many requests in a short time'
    ),
    standardHeaders: true,
    legacyHeaders: false,
});
