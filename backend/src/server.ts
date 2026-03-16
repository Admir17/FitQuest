import 'dotenv/config'
import app from './app'
import pool from './db/pool'

const PORT = parseInt(process.env.PORT ?? '3001', 10)

async function start() {
  // Verify database connection before accepting traffic
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    console.log('✓ Database connection established')
  } catch (err) {
    console.error('✗ Failed to connect to database:', err)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`✓ FitQuest API running at http://localhost:${PORT}`)
    console.log(`  Environment: ${process.env.NODE_ENV ?? 'development'}`)
  })
}

// Graceful shutdown — close DB pool before exiting
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully...')
  await pool.end()
  process.exit(0)
})

start()
