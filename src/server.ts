import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config/env';
import { initDatabase, getOne } from './config/database';
import { errorHandlerVulnerable, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { createTables } from './database/init';
import { seedDatabase } from './database/seed';

// Import routes
import authRoutes from './routes/v1/auth';
import usersRoutes from './routes/v1/users';
import ordersRoutes from './routes/v1/orders';
import productsRoutes from './routes/v1/products';
import adminRoutes from './routes/v1/admin';
import ticketsRoutes from './routes/v1/tickets';
import couponsRoutes from './routes/v1/coupons';
import debugRoutes from './routes/v1/debug';

const app: Application = express();

// Middleware
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// VULNERABLE: CORS configuration (API8)
app.use(
    cors({
        origin: '*', // VULNERABLE: Allows any origin
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Apply rate limiting to all routes (can be bypassed on specific routes)
if (config.nodeEnv === 'production') {
    app.use('/api/', apiLimiter);
}

// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - v1 (Vulnerable)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/orders', ordersRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/tickets', ticketsRoutes);
app.use('/api/v1/coupons', couponsRoutes);

// VULNERABLE: Deprecated API version still active (API9)
// Improper Inventory Management - Old API version exposed without auth
app.get('/api/v0/admin/users', (_req, res) => {
    res.json({
        message: 'Deprecated API v0 - Use v1 instead',
        warning: 'This endpoint is deprecated and will be removed',
        users: [
            { id: 1, username: 'admin', role: 'admin', email: 'admin@example.com' },
            { id: 2, username: 'bob', role: 'user', email: 'bob@example.com' },
            { id: 3, username: 'alice', role: 'user', email: 'alice@example.com' }
        ],
        // Add CTF flag for discovering old API version
        flag: 'GTX{0ld_v3rs10n_vuln3r4bl3}'
    });
});

// VULNERABLE: Unsafe consumption of third-party API (API10)
// Trusts data from "partner" APIs without validation
app.post('/api/v1/integrations/sync', (req, res) => {
    const { partnerUrl } = req.body;

    if (!partnerUrl) {
        return res.status(400).json({ error: 'Partner URL required' });
    }

    // Simulate fetching data from partner API
    // VULNERABLE: If partner URL is "malicious", it triggers the exploit
    if (partnerUrl.includes('evil.com') || partnerUrl.includes('attacker') || partnerUrl.includes('malicious')) {
        return res.json({
            status: 'synced',
            source: partnerUrl,
            // Add CTF flag for successful injection via third-party API
            flag: 'GTX{uns4f3_4p1_c0nsum3}',
            details: 'Executed malicious payload from trusted source'
        });
    }

    res.json({
        status: 'synced',
        message: 'Data synchronized with partner',
        source: partnerUrl
    });
});

// Debug routes (API8 - Security Misconfiguration)
app.use('/api/debug', debugRoutes);

// API documentation placeholder
app.get('/api/docs', (_req, res) => {
    res.json({
        message: 'API Documentation',
        version: '1.0.0',
        endpoints: {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            orders: '/api/v1/orders',
            products: '/api/v1/products',
            admin: '/api/v1/admin',
            tickets: '/api/v1/tickets',
            coupons: '/api/v1/coupons',
            debug: '/api/debug',
        },
    });
});

// Welcome message
app.get('/', (_req, res) => {
    res.json({
        message: 'OWASP API Security Top 10 2023 - Vulnerable Lab',
        warning: '⚠️ This API is intentionally vulnerable for educational purposes only!',
        organization: 'Gethuk Security',
        documentation: '/api/docs',
        health: '/health',
    });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (vulnerable version for educational purposes)
app.use(errorHandlerVulnerable);

// Initialize database and start server
const startServer = async () => {
    try {
        // Initialize database
        await initDatabase();
        console.log('✅ Database connected');

        // Check if tables exist, if not create and seed
        try {
            const tableCheck = await getOne("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
            if (!tableCheck) {
                console.log('📦 First run detected - creating tables...');
                await createTables();
                console.log('🌱 Seeding database with sample data...');
                await seedDatabase();
                console.log('✅ Database setup complete!');
            } else {
                console.log('✅ Database tables already exist');
            }
        } catch (err) {
            console.log('📦 Creating tables and seeding database...');
            await createTables();
            await seedDatabase();
            console.log('✅ Database setup complete!');
        }

        // Start server
        app.listen(config.port, () => {
            console.log('');
            console.log('🚀 ================================================');
            console.log('🚀  OWASP API Security Lab - Server Started');
            console.log('🚀 ================================================');
            console.log(`🌐  Server running on: http://localhost:${config.port}`);
            console.log(`📚  API Documentation: http://localhost:${config.port}/api/docs`);
            console.log(`⚡  Environment: ${config.nodeEnv}`);
            console.log('⚠️   WARNING: This server is INTENTIONALLY VULNERABLE');
            console.log('⚠️   For educational purposes only!');
            console.log('🚀 ================================================');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer();

export default app;
