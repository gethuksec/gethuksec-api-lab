import sqlite3 from 'sqlite3';
import { config } from './env';
import fs from 'fs';
import path from 'path';

// Enable verbose mode for better error messages
const sqlite = sqlite3.verbose();

let db: sqlite3.Database | null = null;

export const initDatabase = (): Promise<sqlite3.Database> => {
    return new Promise((resolve, reject) => {
        // Ensure data directory exists
        const dataDir = path.dirname(config.databasePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        db = new sqlite.Database(config.databasePath, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                reject(err);
            } else {
                console.log('✅ Connected to SQLite database');

                // Enable foreign keys
                db!.run('PRAGMA foreign_keys = ON', (err) => {
                    if (err) {
                        console.error('Error enabling foreign keys:', err);
                        reject(err);
                    } else {
                        resolve(db!);
                    }
                });
            }
        });
    });
};

export const getDatabase = (): sqlite3.Database => {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
};

export const closeDatabase = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('✅ Database connection closed');
                    db = null;
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
};

// Helper function to run queries with promises
export const runQuery = (query: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
        getDatabase().run(query, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
};

// Helper function to get a single row
export const getOne = <T>(query: string, params: any[] = []): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
        getDatabase().get(query, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row as T);
            }
        });
    });
};

// Helper function to get all rows
export const getAll = <T>(query: string, params: any[] = []): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        getDatabase().all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows as T[]);
            }
        });
    });
};
