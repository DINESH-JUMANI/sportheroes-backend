import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables in case they aren't loaded yet
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('WARNING: DATABASE_URL environment variable is not defined.');
}

export const pool = new Pool({
  connectionString,
  // Optional: configure pool limits
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * Verifies the database connection by executing a simple query.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log(`[Database] Connected successfully. Server time: ${result.rows[0].now}`);
    client.release();
    return true;
  } catch (error) {
    console.error('[Database] Connection failed:', error instanceof Error ? error.message : error);
    return false;
  }
}
