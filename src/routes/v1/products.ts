import express, { Request, Response } from 'express';
import { getAll, getOne } from '../../config/database';
import { optionalAuth, AuthRequest } from '../../middleware/auth';

const router = express.Router();

interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    image_url: string;
    created_at: string;
}

// VULNERABLE: No pagination limit (API4)
router.get('/', optionalAuth, async (req: Request, res: Response) => {
    try {
        const requestedLimit = parseInt(req.query.limit as string) || 20;

        // VULNERABLE: No maximum limit enforcement!
        // User can request millions of records causing DoS
        const limit = requestedLimit;
        const offset = parseInt(req.query.offset as string) || 0;

        const products = await getAll<Product>(
            'SELECT * FROM products LIMIT ? OFFSET ?',
            [limit, offset]
        );

        res.json({
            products,
            limit,
            offset,
            count: products.length,
            // Add CTF flag when excessive limit is requested
            flag: requestedLimit > 1000 ? 'GTX{p4g1n4t10n_l1m1t_byp4ss}' : undefined
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch products', details: error.message });
    }
});

// Get single product
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const product = await getOne<Product>('SELECT * FROM products WHERE id = ?', [id]);

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch product', details: error.message });
    }
});

export default router;
