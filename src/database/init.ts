import { initDatabase, runQuery, closeDatabase } from '../config/database';
import fs from 'fs';
import path from 'path';

export const createTables = async (): Promise<void> => {
    try {
        console.log('📦 Creating database tables...');

        // Read schema file
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        // Split by semicolon and execute each statement
        const statements = schema
            .split(';')
            .map((stmt) => stmt.trim())
            .filter((stmt) => stmt.length > 0);

        for (const statement of statements) {
            await runQuery(statement);
        }

        console.log('✅ Database tables created successfully');
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
};

// Initialize database if run directly
if (require.main === module) {
    (async () => {
        try {
            await initDatabase();
            await createTables();
            await closeDatabase();
            console.log('✅ Database initialization complete');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            process.exit(1);
        }
    })();
}
