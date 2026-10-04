process.env.MIGRATION_MODE = 'true';
const fs = require('fs');
const path = require('path');
const db = require('../../backend/src/config/db');

async function runMigrations() {
  console.log('[Migration] Starting database migrations...');
  try {
    const migrationFile = path.resolve(__dirname, '001_create_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Execute multi-statement migration SQL
    await db.exec(sql);

    console.log('[Migration] Successfully executed 001_create_tables.sql');
    console.log('[Migration] Tables users, stores, ratings created or verified.');
  } catch (error) {
    console.error('[Migration] Error running migrations:', error);
    process.exit(1);
  } finally {
    await db.closeDb();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
