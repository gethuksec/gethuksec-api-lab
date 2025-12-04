import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

// VULNERABLE: Exposes detailed error information
export const errorHandlerVulnerable = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error('Error:', err);

    // VULNERABLE: Exposes stack trace and detailed error info
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        stack: err.stack, // VULNERABLE: Exposes stack trace
        details: err.details || undefined,
        query: err.sql || undefined, // VULNERABLE: Exposes SQL queries
    });
};

// SECURE: Generic error messages
export const errorHandlerSecure = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    // Log error internally
    console.error('Error:', err);

    // Determine status code
    const statusCode = err.status || err.statusCode || 500;

    // Send generic error message
    if (config.nodeEnv === 'production') {
        res.status(statusCode).json({
            error: statusCode === 500 ? 'Internal server error' : err.message || 'An error occurred',
        });
    } else {
        // In development, show more details
        res.status(statusCode).json({
            error: err.message || 'An error occurred',
            ...(config.nodeEnv === 'development' && { stack: err.stack }),
        });
    }
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method,
    });
};
