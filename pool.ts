import { Pool } from 'pg'

// Connection pool — shared across all modules
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // max simultaneous connections
  idleTimeoutMillis: 30_000,    // close idle connections after 30s
  connectionTimeoutMillis: 2_000,
})

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err)
})

/** Run a query against the pool */
export const query = <T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
) => pool.query<T>(text, params)

/** Acquire a dedicated client (use for transactions) */
export const getClient = () => pool.connect()

export default pool
