import express, { Response } from 'express';
import { getOne, getAll } from '../../config/database';
import { authenticateTokenVulnerable, AuthRequest } from '../../middleware/auth';

const router = express.Router();

interface Order {
    id: number;
    user_id: number;
    product_id: number;
    quantity: number;
    total_amount: number;
    status: string;
    shipping_address: string;
    created_at: string;
}

// VULNERABLE: BOLA - Access any order without ownership check (API1)
router.get('/:orderId', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;

        // VULNERABLE: No check if order belongs to authenticated user
        const order = await getOne<Order>('SELECT * FROM orders WHERE id = ?', [orderId]);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Returns order data regardless of ownership
        res.json(order);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch order', details: error.message });
    }
});

// Get user's own orders
router.get('/', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const orders = await getAll<Order>('SELECT * FROM orders WHERE user_id = ?', [req.user.id]);

        res.json({ orders });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch orders', details: error.message });
    }
});

export default router;
