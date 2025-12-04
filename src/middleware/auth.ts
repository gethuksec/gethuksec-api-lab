import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
        email: string;
        role: string;
        is_admin: boolean;
    };
}

// Secure authentication middleware
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// VULNERABLE: Accepts "alg: none" tokens (API2 vulnerability)
export const authenticateTokenVulnerable = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        // VULNERABLE: Doesn't specify algorithm, accepts "none"
        const decoded = jwt.decode(token) as any;

        if (!decoded) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        // VULNERABLE: Trusts the decoded token without verification
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Secure: Require admin role
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

// VULNERABLE: No role check (API5 vulnerability)
export const requireAdminVulnerable = (req: AuthRequest, res: Response, next: NextFunction) => {
    // VULNERABLE: Only checks if user is authenticated, not if they're admin
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // No role check!
    next();
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwtSecret) as any;
            req.user = decoded;
        } catch (error) {
            // Token is invalid, but we don't fail the request
        }
    }

    next();
};
