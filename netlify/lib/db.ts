
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon to use WebSockets for pooling, which is required for serverless environments.
neonConfig.webSocketConstructor = ws;

let pool: Pool | null = null;

/**
 * Lazily initializes and returns the Neon database connection pool.
 * Returns null if the DATABASE_URL is not configured.
 */
export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  
  // Singleton pattern: create pool only once.
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  return pool;
}
