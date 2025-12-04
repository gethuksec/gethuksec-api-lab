import express, { Response } from 'express';
import { getOne, getAll, runQuery } from '../../config/database';
import { authenticateTokenVulnerable, AuthRequest } from '../../middleware/auth';
import fetch from 'node-fetch';

const router = express.Router();

interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    phone: string;
    address: string;
    ssn: string;
    credit_card_last4: string;
    is_admin: boolean;
    is_premium: boolean;
    account_balance: number;
    salary: number;
    credit_score: number;
    internal_notes: string;
    created_at: string;
    updated_at: string;
}

// VULNERABLE: BOLA - User profile access without ownership check (API1)
router.get('/:userId/profile', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        // VULNERABLE: No check if req.user.id === userId
        const user = await getOne<User>('SELECT * FROM users WHERE id = ?', [userId]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // VULNERABLE: Returns all user data including sensitive fields
        // Add CTF flag for BOLA exploit
        res.json({
            ...user,
            flag: userId !== req.user?.id.toString() ? 'GTX{b0la_pr0f1l3_4cc3ss}' : undefined
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
    }
});

// VULNERABLE: Excessive data exposure (API3)
router.get('/me', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await getOne<User>('SELECT * FROM users WHERE id = ?', [req.user.id]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // VULNERABLE: Returns ALL fields including password_hash, ssn, internal_notes, etc.
        res.json(user);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch user data', details: error.message });
    }
});

// VULNERABLE: Mass assignment (API3)
router.put('/profile', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // VULNERABLE: Accepts ANY field from request body
        const updates = req.body;

        // Build dynamic UPDATE query (VULNERABLE)
        const fields = Object.keys(updates);
        const values = Object.values(updates);

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        // Convert boolean values for SQLite (true -> 1, false -> 0)
        const sqlValues = values.map(v => {
            if (v === true) return 1;
            if (v === false) return 0;
            return v;
        });

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

        await runQuery(query, [...sqlValues, req.user.id]);

        // Get updated user
        const updatedUser = await getOne<User>('SELECT * FROM users WHERE id = ?', [req.user.id]);

        // Add CTF flag if user escalated privileges via mass assignment
        // Check for admin privilege escalation OR balance manipulation
        const escalatedToAdmin = fields.includes('is_admin') && updatedUser?.is_admin;
        const manipulatedBalance = fields.includes('account_balance') && (updatedUser?.account_balance ?? 0) > 1000;
        const hasFlag = escalatedToAdmin || manipulatedBalance;

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser,
            flag: hasFlag ? 'GTX{m4ss_4ss1gnm3nt_pwn3d}' : undefined
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
});

// VULNERABLE: BOLA - Delete any user account (API1)
router.delete('/:userId', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        // VULNERABLE: No check if req.user.id === userId
        // Any authenticated user can delete any account!

        const user = await getOne<User>('SELECT id FROM users WHERE id = ?', [userId]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await runQuery('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
});

// VULNERABLE: SSRF - Avatar upload from URL (API7)
router.post('/avatar', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { avatarUrl } = req.body;

        if (!avatarUrl) {
            return res.status(400).json({ error: 'Avatar URL required' });
        }

        // VULNERABLE: Fetches ANY URL without validation
        // Allows SSRF attacks to internal services, cloud metadata, etc.
        try {
            const response = await fetch(avatarUrl);
            const contentType = response.headers.get('content-type');
            const body = await response.text();

            // Store avatar URL (in real app would save the file)
            await runQuery('UPDATE users SET internal_notes = ? WHERE id = ?', [
                `Avatar URL: ${avatarUrl}`,
                req.user.id,
            ]);

            res.json({
                message: 'Avatar updated successfully',
                url: avatarUrl,
                // VULNERABLE: Returns fetched content
                fetchedContent: body.substring(0, 500), // First 500 chars
                contentType,
                // Add CTF flag for SSRF success (accessing internal metadata or localhost)
                flag: avatarUrl.includes('localhost') || avatarUrl.includes('127.0.0.1') || avatarUrl.includes('169.254') ? 'GTX{ssrf_1nt3rn4l_4cc3ss}' : undefined
            });
        } catch (fetchError: any) {
            // VULNERABLE: Exposes fetch errors which can reveal internal network info
            res.status(500).json({
                error: 'Failed to fetch avatar',
                details: fetchError.message,
                url: avatarUrl,
            });
        }
    } catch (error: any) {
        res.status(500).json({ error: 'Avatar upload failed', details: error.message });
    }
});

// VULNERABLE: Hidden admin function without authorization (API5)
router.post('/export-all', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        // VULNERABLE: No admin check!
        // Any authenticated user can export all user data

        const users = await getAll<User>('SELECT * FROM users');

        res.json({
            message: 'User data exported',
            count: users.length,
            users: users,
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Export failed', details: error.message });
    }
});

// List all users (paginated)
router.get('/', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = parseInt(req.query.offset as string) || 0;

        const users = await getAll<User>(
            'SELECT id, username, email, first_name, last_name, is_premium FROM users LIMIT ? OFFSET ?',
            [limit, offset]
        );

        res.json({
            users,
            limit,
            offset,
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});

export default router;
