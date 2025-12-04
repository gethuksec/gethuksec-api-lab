import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs, // 15 minutes
    max: config.rateLimitMaxRequests, // 100 requests per window
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiter for login endpoint (secure version)
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true, // Don't count successful logins
});

// Rate limiter for password reset
export const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: 'Too many password reset attempts, please try again later',
});

// Rate limiter for ticket purchases
export const purchaseLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 purchases per hour
    message: 'Too many purchase attempts, please try again later',
    keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return (req as any).user?.id?.toString() || req.ip || 'unknown';
    },
});

// Rate limiter for file uploads
export const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads per window
    message: 'Too many upload attempts, please try again later',
});

// VULNERABLE: No rate limiting (for vulnerable endpoints)
export const noRateLimit = (_req: any, _res: any, next: any) => {
    next();
};
