import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOne, runQuery } from '../../config/database';
import { config } from '../../config/env';
import { noRateLimit } from '../../middleware/rateLimiter';
import { AuthRequest } from '../../middleware/auth';

const router = express.Router();

interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    is_admin: boolean;
}

// VULNERABLE: Registration without input validation
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Minimal validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await runQuery(
            `INSERT INTO users (username, email, password_hash, first_name, last_name) 
       VALUES (?, ?, ?, ?, ?)`,
            [username, email, passwordHash, firstName || null, lastName || null]
        );

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.lastID,
        });
    } catch (error: any) {
        // VULNERABLE: Exposes database errors
        res.status(500).json({
            error: 'Registration failed',
            details: error.message,
        });
    }
});

// VULNERABLE: Login without rate limiting (API2)
router.post('/login', noRateLimit, async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Get user
        const user = await getOne<User>(
            'SELECT id, username, email, password_hash, is_admin FROM users WHERE username = ?',
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // VULNERABLE: Uses weak secret for some scenarios
        const secret = config.weakJwtSecret;

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin,
            },
            secret,
            { expiresIn: config.jwtExpiresIn } as any
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is_admin: user.is_admin,
            },
            // Add CTF flag for brute force success on weak password account
            flag: username === 'weakpass' ? 'GTX{br00t_f0rc3_succ3ss}' : undefined
        });
    } catch (error: any) {
        res.status(500).json({
            error: 'Login failed',
            details: error.message,
        });
    }
});

// VULNERABLE: Weak password reset tokens (API2)
router.post('/reset-password', noRateLimit, async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        // Check if user exists
        const user = await getOne<User>('SELECT id, email FROM users WHERE email = ?', [email]);

        if (!user) {
            // VULNERABLE: Reveals if email exists
            return res.status(404).json({ error: 'User not found' });
        }

        // VULNERABLE: Generate weak 4-digit token
        const token = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

        // Store reset token
        await runQuery(
            'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
            [user.id, token, expiresAt]
        );

        res.json({
            message: 'Password reset token generated',
            // VULNERABLE: Returns token in response (normally sent via email)
            token,
            expiresAt,
        });
    } catch (error: any) {
        res.status(500).json({
            error: 'Password reset failed',
            details: error.message,
        });
    }
});

// VULNERABLE: Reset password with weak token
router.post('/verify-reset', async (req: Request, res: Response) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({ error: 'Email, token, and new password required' });
        }

        // Get user
        const user = await getOne<User>('SELECT id FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify token
        const resetToken = await getOne<any>(
            `SELECT id, expires_at, used FROM password_reset_tokens 
       WHERE user_id = ? AND token = ? AND used = 0`,
            [user.id, token]
        );

        if (!resetToken) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Check if expired
        if (new Date(resetToken.expires_at) < new Date()) {
            return res.status(401).json({ error: 'Token expired' });
        }

        // Update password
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await runQuery('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, user.id]);

        // Mark token as used
        await runQuery('UPDATE password_reset_tokens SET used = 1 WHERE id = ?', [resetToken.id]);

        res.json({ message: 'Password reset successful' });
    } catch (error: any) {
        res.status(500).json({
            error: 'Password reset verification failed',
            details: error.message,
        });
    }
});

// Token refresh endpoint
router.post('/refresh', async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }

        // VULNERABLE: Accepts tokens with weak secret
        const decoded = jwt.decode(token) as any;

        if (!decoded) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Generate new token
        const newToken = jwt.sign(
            {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
                is_admin: decoded.is_admin,
            },
            config.weakJwtSecret,
            { expiresIn: config.jwtExpiresIn } as any
        );

        res.json({ token: newToken });
    } catch (error: any) {
        res.status(500).json({
            error: 'Token refresh failed',
            details: error.message,
        });
    }
});

export default router;
