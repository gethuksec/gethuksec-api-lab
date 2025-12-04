import { initDatabase, closeDatabase } from '../config/database';
import fs from 'fs';
import { config } from '../config/env';

export const resetDatabase = async (): Promise<void> => {
    try {
        console.log('🔄 Resetting database...');

        // Close any existing connections
        await closeDatabase();

        // Delete the database file if it exists
        if (fs.existsSync(config.databasePath)) {
            fs.unlinkSync(config.databasePath);
            console.log('✅ Deleted existing database file');
        }

        // Reinitialize database
        await initDatabase();
        console.log('✅ Database reset complete');
    } catch (error) {
        console.error('❌ Error resetting database:', error);
        throw error;
    }
};

// Run reset if executed directly
if (require.main === module) {
    (async () => {
        try {
            await resetDatabase();
            await closeDatabase();
            console.log('✅ Database reset successful. Run "npm run seed" to populate with fresh data.');
        } catch (error) {
            console.error('❌ Database reset failed:', error);
            process.exit(1);
        }
    })();
}
