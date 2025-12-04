import bcrypt from 'bcryptjs';
import { initDatabase, runQuery, closeDatabase } from '../config/database';
import { createTables } from './init';

const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, 10);
};

export const seedDatabase = async (): Promise<void> => {
    try {
        console.log('🌱 Seeding database...');

        // Seed users
        console.log('👥 Creating users...');
        const users = [
            {
                username: 'alice',
                email: 'alice@example.com',
                password: await hashPassword('alice123'),
                first_name: 'Alice',
                last_name: 'Johnson',
                phone: '555-0101',
                address: '123 Main St, City, State 12345',
                ssn: '123-45-6789',
                credit_card_last4: '4242',
                is_admin: 0,
                is_premium: 0,
                account_balance: 100.00,
                salary: 75000.00,
                credit_score: 720,
                internal_notes: 'Regular user account for testing',
            },
            {
                username: 'bob',
                email: 'bob@example.com',
                password: await hashPassword('bob123'),
                first_name: 'Bob',
                last_name: 'Smith',
                phone: '555-0102',
                address: '456 Oak Ave, City, State 12345',
                ssn: '987-65-4321',
                credit_card_last4: '5555',
                is_admin: 0,
                is_premium: 0,
                account_balance: 50.00,
                salary: 65000.00,
                credit_score: 680,
                internal_notes: 'Regular user account',
            },
            {
                username: 'charlie',
                email: 'charlie@example.com',
                password: await hashPassword('charlie123'),
                first_name: 'Charlie',
                last_name: 'Brown',
                phone: '555-0103',
                address: '789 Pine Rd, City, State 12345',
                ssn: '456-78-9012',
                credit_card_last4: '3782',
                is_admin: 0,
                is_premium: 1,
                account_balance: 500.00,
                salary: 95000.00,
                credit_score: 780,
                internal_notes: 'Premium user account',
            },
            {
                username: 'admin',
                email: 'admin@example.com',
                password: await hashPassword('admin123'),
                first_name: 'Admin',
                last_name: 'User',
                phone: '555-0100',
                address: '1 Admin Plaza, City, State 12345',
                ssn: '000-00-0000',
                credit_card_last4: '0000',
                is_admin: 1,
                is_premium: 1,
                account_balance: 1000.00,
                salary: 120000.00,
                credit_score: 850,
                internal_notes: 'Administrator account with full privileges',
            },
            {
                username: 'weakpass',
                email: 'weakpass@example.com',
                password: await hashPassword('123456'),
                first_name: 'Weak',
                last_name: 'Password',
                phone: '555-0104',
                address: '999 Insecure Ln, City, State 12345',
                ssn: '111-11-1111',
                credit_card_last4: '1111',
                is_admin: 0,
                is_premium: 0,
                account_balance: 10.00,
                salary: 45000.00,
                credit_score: 600,
                internal_notes: 'User with weak password for brute force testing',
            },
        ];

        for (const user of users) {
            await runQuery(
                `INSERT INTO users (username, email, password_hash, first_name, last_name, phone, address, 
         ssn, credit_card_last4, is_admin, is_premium, account_balance, salary, credit_score, internal_notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.username,
                    user.email,
                    user.password,
                    user.first_name,
                    user.last_name,
                    user.phone,
                    user.address,
                    user.ssn,
                    user.credit_card_last4,
                    user.is_admin,
                    user.is_premium,
                    user.account_balance,
                    user.salary,
                    user.credit_score,
                    user.internal_notes,
                ]
            );
        }
        console.log(`✅ Created ${users.length} users`);

        // Seed products
        console.log('📦 Creating products...');
        const products = [
            { name: 'Laptop Pro 15"', description: 'High-performance laptop', price: 1299.99, stock: 50, category: 'Electronics', image_url: '/images/laptop.jpg' },
            { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', price: 29.99, stock: 200, category: 'Electronics', image_url: '/images/mouse.jpg' },
            { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard', price: 89.99, stock: 100, category: 'Electronics', image_url: '/images/keyboard.jpg' },
            { name: 'USB-C Hub', description: '7-in-1 USB-C hub', price: 49.99, stock: 150, category: 'Electronics', image_url: '/images/hub.jpg' },
            { name: '4K Monitor 27"', description: 'Ultra HD monitor', price: 399.99, stock: 75, category: 'Electronics', image_url: '/images/monitor.jpg' },
            { name: 'Webcam HD', description: '1080p webcam', price: 79.99, stock: 120, category: 'Electronics', image_url: '/images/webcam.jpg' },
            { name: 'Headphones Pro', description: 'Noise-cancelling headphones', price: 249.99, stock: 80, category: 'Audio', image_url: '/images/headphones.jpg' },
            { name: 'Desk Lamp LED', description: 'Adjustable LED desk lamp', price: 39.99, stock: 180, category: 'Office', image_url: '/images/lamp.jpg' },
            { name: 'Office Chair', description: 'Ergonomic office chair', price: 299.99, stock: 40, category: 'Furniture', image_url: '/images/chair.jpg' },
            { name: 'Standing Desk', description: 'Adjustable standing desk', price: 499.99, stock: 30, category: 'Furniture', image_url: '/images/desk.jpg' },
        ];

        for (const product of products) {
            await runQuery(
                'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
                [product.name, product.description, product.price, product.stock, product.category, product.image_url]
            );
        }
        console.log(`✅ Created ${products.length} products`);

        // Seed orders
        console.log('📋 Creating orders...');
        const orders = [
            { user_id: 1, product_id: 1, quantity: 1, total_amount: 1299.99, status: 'delivered', shipping_address: '123 Main St, City, State 12345' },
            { user_id: 1, product_id: 2, quantity: 2, total_amount: 59.98, status: 'shipped', shipping_address: '123 Main St, City, State 12345' },
            { user_id: 2, product_id: 3, quantity: 1, total_amount: 89.99, status: 'pending', shipping_address: '456 Oak Ave, City, State 12345' },
            { user_id: 3, product_id: 5, quantity: 1, total_amount: 399.99, status: 'delivered', shipping_address: '789 Pine Rd, City, State 12345' },
            { user_id: 3, product_id: 7, quantity: 1, total_amount: 249.99, status: 'delivered', shipping_address: '789 Pine Rd, City, State 12345' },
        ];

        for (const order of orders) {
            await runQuery(
                'INSERT INTO orders (user_id, product_id, quantity, total_amount, status, shipping_address) VALUES (?, ?, ?, ?, ?, ?)',
                [order.user_id, order.product_id, order.quantity, order.total_amount, order.status, order.shipping_address]
            );
        }
        console.log(`✅ Created ${orders.length} orders`);

        // Seed events (for ticket scalping challenge)
        console.log('🎫 Creating events...');
        const events = [
            {
                name: 'Security Conference 2024',
                description: 'Annual cybersecurity conference',
                date: '2024-06-15 09:00:00',
                total_tickets: 100,
                available_tickets: 100,
                price: 299.99,
                max_per_user: 4,
            },
            {
                name: 'Tech Summit',
                description: 'Technology innovation summit',
                date: '2024-07-20 10:00:00',
                total_tickets: 50,
                available_tickets: 50,
                price: 199.99,
                max_per_user: 2,
            },
        ];

        for (const event of events) {
            await runQuery(
                'INSERT INTO events (name, description, date, total_tickets, available_tickets, price, max_per_user) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [event.name, event.description, event.date, event.total_tickets, event.available_tickets, event.price, event.max_per_user]
            );
        }
        console.log(`✅ Created ${events.length} events`);

        // Seed coupons
        console.log('🎟️ Creating coupons...');
        const coupons = [
            { code: 'SAVE10', discount_percent: 10, max_uses: 1, times_used: 0, expires_at: '2025-12-31 23:59:59' },
            { code: 'SAVE20', discount_percent: 20, max_uses: 1, times_used: 0, expires_at: '2025-12-31 23:59:59' },
            { code: 'WELCOME50', discount_percent: 50, max_uses: 1, times_used: 0, expires_at: '2025-12-31 23:59:59' },
        ];

        for (const coupon of coupons) {
            await runQuery(
                'INSERT INTO coupons (code, discount_percent, max_uses, times_used, expires_at) VALUES (?, ?, ?, ?, ?)',
                [coupon.code, coupon.discount_percent, coupon.max_uses, coupon.times_used, coupon.expires_at]
            );
        }
        console.log(`✅ Created ${coupons.length} coupons`);

        // Seed challenges with flags
        console.log('🚩 Creating challenges...');
        const challenges = [
            {
                id: 'api1-bola-profile',
                category: 'API1:2023 - Broken Object Level Authorization',
                title: 'User Profile Access',
                description: 'Access other users\' profiles by manipulating the user ID parameter',
                difficulty: 'easy',
                flag: 'GTX{b0la_pr0f1l3_4cc3ss}',
                points: 100,
                endpoint: 'GET /api/v1/users/:userId/profile',
                hint_1: 'Try changing the userId parameter in the URL',
                hint_2: 'The API doesn\'t check if you own the requested profile',
                hint_3: 'Use Burp Suite Intruder to enumerate user IDs',
                solution: 'Send GET request to /api/v1/users/2/profile while authenticated as user 1',
            },
            {
                id: 'api1-bola-orders',
                category: 'API1:2023 - Broken Object Level Authorization',
                title: 'Order Details Access',
                description: 'View other users\' order details',
                difficulty: 'easy',
                flag: 'GTX{0rd3r_l34k4g3_d3t3ct3d}',
                points: 100,
                endpoint: 'GET /api/v1/orders/:orderId',
                hint_1: 'Order IDs are sequential integers',
                hint_2: 'Try incrementing or decrementing the order ID',
                hint_3: 'No authorization check is performed',
                solution: 'Access /api/v1/orders/1 while authenticated as a different user',
            },
            {
                id: 'api2-broken-auth-bruteforce',
                category: 'API2:2023 - Broken Authentication',
                title: 'Brute Force Login',
                description: 'Exploit missing rate limiting on login endpoint',
                difficulty: 'easy',
                flag: 'GTX{br00t_f0rc3_succ3ss}',
                points: 150,
                endpoint: 'POST /api/v1/auth/login',
                hint_1: 'There is no rate limiting on the login endpoint',
                hint_2: 'User "weakpass" has a common password',
                hint_3: 'Try passwords like: 123456, password, qwerty',
                solution: 'Brute force login with username "weakpass" and password "123456"',
            },
            {
                id: 'api3-mass-assignment',
                category: 'API3:2023 - Broken Object Property Level Authorization',
                title: 'Mass Assignment Privilege Escalation',
                description: 'Modify restricted fields through mass assignment',
                difficulty: 'medium',
                flag: 'GTX{m4ss_4ss1gnm3nt_pwn3d}',
                points: 200,
                endpoint: 'PUT /api/v1/users/profile',
                hint_1: 'The API accepts any field in the request body',
                hint_2: 'Try adding "is_admin": true to your profile update',
                hint_3: 'Check the response to see if the field was updated',
                solution: 'Send PUT request with {"is_admin": true} in the body',
            },
            {
                id: 'api4-pagination-dos',
                category: 'API4:2023 - Unrestricted Resource Consumption',
                title: 'Pagination Limit Bypass',
                description: 'Request excessive data through unlimited pagination',
                difficulty: 'easy',
                flag: 'GTX{p4g1n4t10n_l1m1t_byp4ss}',
                points: 100,
                endpoint: 'GET /api/v1/products?limit=999999',
                hint_1: 'The limit parameter has no maximum value',
                hint_2: 'Try requesting a very large number of items',
                hint_3: 'Use limit=999999 or higher',
                solution: 'GET /api/v1/products?limit=999999',
            },
            {
                id: 'api5-admin-access',
                category: 'API5:2023 - Broken Function Level Authorization',
                title: 'Admin Panel Access',
                description: 'Access admin functions without proper authorization',
                difficulty: 'easy',
                flag: 'GTX{4dm1n_4cc3ss_gr4nt3d}',
                points: 150,
                endpoint: 'GET /api/v1/admin/users',
                hint_1: 'Admin endpoints only check for authentication, not authorization',
                hint_2: 'Try accessing /api/v1/admin/users as a regular user',
                hint_3: 'You just need a valid JWT token',
                solution: 'Access /api/v1/admin/users with any authenticated user token',
            },
            {
                id: 'api6-ticket-scalping',
                category: 'API6:2023 - Unrestricted Access to Sensitive Business Flows',
                title: 'Ticket Scalping',
                description: 'Bypass ticket purchase limits through automation',
                difficulty: 'medium',
                flag: 'GTX{t1ck3t_sc4lp1ng_d3t3ct3d}',
                points: 200,
                endpoint: 'POST /api/v1/tickets/purchase',
                hint_1: 'No CAPTCHA or bot detection is implemented',
                hint_2: 'No rate limiting on ticket purchases',
                hint_3: 'You can automate multiple purchases',
                solution: 'Automate ticket purchases to buy more than the per-user limit',
            },
            {
                id: 'api7-ssrf-avatar',
                category: 'API7:2023 - Server-Side Request Forgery',
                title: 'SSRF via Avatar Upload',
                description: 'Exploit SSRF vulnerability in avatar URL fetching',
                difficulty: 'medium',
                flag: 'GTX{ssrf_1nt3rn4l_4cc3ss}',
                points: 250,
                endpoint: 'POST /api/v1/users/avatar',
                hint_1: 'The server fetches any URL you provide',
                hint_2: 'Try accessing internal URLs like http://localhost',
                hint_3: 'Cloud metadata: http://169.254.169.254/latest/meta-data/',
                solution: 'POST with avatarUrl: "http://localhost:3000/api/debug/config"',
            },
            {
                id: 'api8-debug-endpoint',
                category: 'API8:2023 - Security Misconfiguration',
                title: 'Debug Endpoint Exposure',
                description: 'Find and exploit exposed debug endpoints',
                difficulty: 'easy',
                flag: 'GTX{d3bug_3ndp01nt_3xp0s3d}',
                points: 100,
                endpoint: 'GET /api/debug/config',
                hint_1: 'Debug endpoints are often left enabled in production',
                hint_2: 'Try common debug paths like /debug, /api/debug',
                hint_3: 'Look for /api/debug/config',
                solution: 'Access /api/debug/config to get environment variables',
            },
            {
                id: 'api9-old-version',
                category: 'API9:2023 - Improper Inventory Management',
                title: 'Old API Version Exploitation',
                description: 'Exploit vulnerabilities in deprecated API versions',
                difficulty: 'easy',
                flag: 'GTX{0ld_v3rs10n_vuln3r4bl3}',
                points: 100,
                endpoint: 'GET /api/v1/users (vs /api/v2/users)',
                hint_1: 'Old API versions may still be accessible',
                hint_2: 'Try /api/v1/ instead of /api/v2/',
                hint_3: 'v1 endpoints have fewer security controls',
                solution: 'Use v1 endpoints which have BOLA vulnerabilities',
            },
        ];

        for (const challenge of challenges) {
            await runQuery(
                `INSERT INTO challenges (id, category, title, description, difficulty, flag, points, endpoint, 
         hint_1, hint_2, hint_3, solution) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    challenge.id,
                    challenge.category,
                    challenge.title,
                    challenge.description,
                    challenge.difficulty,
                    challenge.flag,
                    challenge.points,
                    challenge.endpoint,
                    challenge.hint_1,
                    challenge.hint_2,
                    challenge.hint_3,
                    challenge.solution,
                ]
            );
        }
        console.log(`✅ Created ${challenges.length} challenges`);

        console.log('✅ Database seeding complete!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
};

// Run seeding if executed directly
if (require.main === module) {
    (async () => {
        try {
            await initDatabase();
            await createTables();
            await seedDatabase();
            await closeDatabase();
            console.log('✅ Database setup complete!');
        } catch (error) {
            console.error('❌ Database setup failed:', error);
            process.exit(1);
        }
    })();
}
