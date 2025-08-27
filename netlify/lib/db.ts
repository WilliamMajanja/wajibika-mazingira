
import { Pool } from '@neondatabase/serverless';

let pool: Pool | null = null;

/**
 * Creates and returns a singleton instance of a Neon database connection pool.
 * It reads the connection string from the DATABASE_URL environment variable.
 * @returns {Pool | null} The connection pool instance, or null if the DATABASE_URL is not set.
 */
export function getPool(): Pool | null {
  if (pool) {
    return pool;
  }
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // This log is crucial for debugging deployment issues.
    console.error("FATAL: DATABASE_URL environment variable is not set.");
    return null;
  }

  // Initialize the connection pool.
  pool = new Pool({ connectionString: databaseUrl });
  return pool;
}
