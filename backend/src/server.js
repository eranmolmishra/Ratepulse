const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function ensureTables() {
  try {
    // Check if users table exists
    const res = await db.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );
    if (!res.rows[0].exists) {
      console.log('[Server] Tables not found. Automatically running initial migrations...');
      const migrationFile = path.resolve(__dirname, '../../database/migrations/001_create_tables.sql');
      const sql = fs.readFileSync(migrationFile, 'utf8');
      await db.exec(sql);
      console.log('[Server] Initial migrations completed automatically.');
    }
  } catch (err) {
    console.warn('[Server] Note on table check:', err.message);
  }
}

async function startServer() {
  try {
    await db.getDb();
    await ensureTables();

    const server = app.listen(env.PORT, () => {
      console.log(`[Server] Backend REST API running at http://localhost:${env.PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    const shutdown = async () => {
      console.log('[Server] Shutting down gracefully...');
      server.close(async () => {
        await db.closeDb();
        console.log('[Server] Database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('[Server] Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
