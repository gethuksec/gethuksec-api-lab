import express, { Response } from 'express';
import { getOne, getAll, runQuery } from '../../config/database';
import { authenticateTokenVulnerable, AuthRequest } from '../../middleware/auth';
import { noRateLimit } from '../../middleware/rateLimiter';

const router = express.Router();

interface Event {
    id: number;
    name: string;
    available_tickets: number;
    price: number;
    max_per_user: number;
}

// Get all events
router.get('/events', async (req, res: Response) => {
    try {
        const events = await getAll<Event>('SELECT * FROM events');
        res.json({ events });
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch events', details: error.message });
    }
});

// VULNERABLE: No bot protection, no CAPTCHA, no rate limiting (API6)
router.post('/purchase', authenticateTokenVulnerable, noRateLimit, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const { eventId, quantity } = req.body;

        if (!eventId || !quantity) {
            return res.status(400).json({ error: 'Event ID and quantity required' });
        }

        // Get event
        const event = await getOne<Event>('SELECT * FROM events WHERE id = ?', [eventId]);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // VULNERABLE: No per-user purchase limit enforcement
        // VULNERABLE: No CAPTCHA verification
        // VULNERABLE: No rate limiting
        // Allows automated ticket scalping!

        if (event.available_tickets < quantity) {
            return res.status(400).json({ error: 'Not enough tickets available' });
        }

        // Create ticket purchase
        await runQuery(
            'INSERT INTO tickets (event_id, user_id, quantity) VALUES (?, ?, ?)',
            [eventId, req.user.id, quantity]
        );

        // Update available tickets
        await runQuery(
            'UPDATE events SET available_tickets = available_tickets - ? WHERE id = ?',
            [quantity, eventId]
        );

        res.json({
            message: 'Tickets purchased successfully',
            quantity,
            eventId,
            // Add CTF flag for automated ticket purchase (business flow bypass)
            flag: quantity >= 10 ? 'GTX{t1ck3t_sc4lp1ng_d3t3ct3d}' : undefined
        });
    } catch (error: any) {
        res.status(500).json({ error: 'Purchase failed', details: error.message });
    }
});

export default router;
