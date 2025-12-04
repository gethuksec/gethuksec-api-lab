import express, { Response } from 'express';
import { getOne, getAll, runQuery } from '../../config/database';
import { authenticateTokenVulnerable, AuthRequest } from '../../middleware/auth';

const router = express.Router();

interface Coupon {
    id: number;
    code: string;
    discount_percent: number;
    max_uses: number;
    times_used: number;
}

// Get available coupons
router.get('/', async (req, res: Response) => {
    try {
        const coupons = await getAll<Coupon>(
            'SELECT id, code, discount_percent, max_uses, times_used FROM coupons WHERE times_used < max_uses'
        );
        res.json({ coupons });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch coupons', details: error.message });
    }
});

// VULNERABLE: Coupon can be applied multiple times (API6)
router.post('/apply', authenticateTokenVulnerable, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { code, orderId } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'Coupon code required' });
        }

        // Get coupon
        const coupon = await getOne<Coupon>('SELECT * FROM coupons WHERE code = ?', [code]);

        if (!coupon) {
            return res.status(404).json({ error: 'Invalid coupon code' });
        }

        // VULNERABLE: No check if user already used this coupon
        // VULNERABLE: No check if coupon was already applied to this order
        // User can apply the same coupon multiple times!

        if (coupon.times_used >= coupon.max_uses) {
            return res.status(400).json({ error: 'Coupon usage limit reached' });
        }

        // Record usage
        await runQuery(
            'INSERT INTO coupon_usage (coupon_id, user_id, order_id) VALUES (?, ?, ?)',
            [coupon.id, req.user.id, orderId || null]
        );

        // Increment usage count
        await runQuery('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?', [coupon.id]);

        res.json({
            message: 'Coupon applied successfully',
            discount: coupon.discount_percent,
            code: coupon.code,
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to apply coupon', details: error.message });
    }
});

export default router;
