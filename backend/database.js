import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function setupDatabase() {
    const db = await open({
        filename: './db.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            wallet_address TEXT UNIQUE,
            status TEXT NOT NULL DEFAULT 'greylist',
            recommender_wallet_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            monerium_profile_id TEXT,
            monerium_access_token TEXT,
            monerium_refresh_token TEXT,
            monerium_token_expires_at DATETIME
        );
    `);

    console.log('Database setup complete.');
    return db;
}

export default setupDatabase;
