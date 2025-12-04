import express, { Response } from 'express';
import { getAll, runQuery } from '../../config/database';
import { authenticateTokenVulnerable, requireAdminVulnerable, AuthRequest } from '../../middleware/auth';

const router = express.Router();

interface User {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
    created_at: string;
}

// VULNERABLE: No role check - any authenticated user can access (API5)
router.get('/users', authenticateTokenVulnerable, requireAdminVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        // VULNERABLE: requireAdminVulnerable doesn't actually check admin role
        const users = await getAll<User>('SELECT * FROM users');

        // Check if user is NOT admin (is_admin could be truthy/falsy)
        const isNotAdmin = !req.user?.is_admin;

        const response: any = {
            message: 'Admin: All users',
            count: users.length,
            users,
        };

        // Add CTF flag for unauthorized admin access (non-admin accessing admin endpoint)
        if (isNotAdmin) {
            response.flag = 'GTX{4dm1n_4cc3ss_gr4nt3d}';
            response.vulnerability = 'API5:2023 - Broken Function Level Authorization';
        }

        res.json(response);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch users', details: error.message });
    }
});

// VULNERABLE: HTTP method manipulation - DELETE without proper authorization (API5)
router.delete('/users/:id', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // VULNERABLE: No admin check!
        // Any authenticated user can delete users via DELETE method

        await runQuery('DELETE FROM users WHERE id = ?', [id]);

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to delete user', details: error.message });
    }
});

// Admin stats
router.get('/stats', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        // VULNERABLE: No admin check
        const stats = {
            totalUsers: (await getAll('SELECT COUNT(*) as count FROM users'))[0],
            totalOrders: (await getAll('SELECT COUNT(*) as count FROM orders'))[0],
            totalProducts: (await getAll('SELECT COUNT(*) as count FROM products'))[0],
        };

        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
    }
});

export default router;
