const fs = require('fs');
const path = require('path');
const env = require('./env');

let pool = null;
let pgliteInstance = null;
let initPromise = null;

async function getDb() {
  if (pool || pgliteInstance) {
    return { pool, pgliteInstance };
  }

  if (initPromise) {
    return await initPromise;
  }

  initPromise = (async () => {
    const primaryUrl = (process.env.MIGRATION_MODE === 'true' && env.DIRECT_URL)
      ? env.DIRECT_URL
      : (env.DATABASE_URL || env.DIRECT_URL || '').trim();

    if (primaryUrl && primaryUrl !== 'embedded') {
      try {
        const { Pool } = require('pg');
        const isRemote =
          primaryUrl.includes('supabase.com') ||
          primaryUrl.includes('sslmode=require') ||
          (!primaryUrl.includes('localhost') && !primaryUrl.includes('127.0.0.1'));

        pool = new Pool({
          connectionString: primaryUrl,
          ssl: isRemote ? { rejectUnauthorized: false } : false,
        });
        await pool.query('SELECT 1');
        console.log(`[DB] Connected to PostgreSQL via ${primaryUrl === env.DIRECT_URL ? 'DIRECT_URL' : 'DATABASE_URL'}`);
        return { pool, pgliteInstance: null };
      } catch (err) {
        if (env.DIRECT_URL && primaryUrl !== env.DIRECT_URL) {
          try {
            console.warn(`[DB] Notice: Could not connect to DATABASE_URL (${err.message}). Attempting DIRECT_URL...`);
            const { Pool } = require('pg');
            pool = new Pool({
              connectionString: env.DIRECT_URL,
              ssl: { rejectUnauthorized: false },
            });
            await pool.query('SELECT 1');
            console.log('[DB] Connected to PostgreSQL via DIRECT_URL');
            return { pool, pgliteInstance: null };
          } catch (dirErr) {
            console.warn(`[DB] Notice: DIRECT_URL connection also failed (${dirErr.message}).`);
          }
        }
        console.warn(`[DB] Notice: Could not connect to PostgreSQL (${err.code || err.message}).`);
        console.log('[DB] Falling back to persistent PostgreSQL engine...');
      }
    }

    const { PGlite } = require('@electric-sql/pglite');
    const dataDir = env.PG_DATA_DIR;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    pgliteInstance = new PGlite(dataDir);
    await pgliteInstance.waitReady;
    console.log(`[DB] Embedded PostgreSQL engine initialized at ${dataDir}`);
    return { pool: null, pgliteInstance };
  })();

  return await initPromise;
}

async function query(text, params = []) {
  await getDb();

  if (pool) {
    const res = await pool.query(text, params);
    return {
      rows: res.rows || [],
      rowCount: res.rowCount ?? (res.rows ? res.rows.length : 0),
    };
  }

  if (pgliteInstance) {
    const res = await pgliteInstance.query(text, params);
    return {
      rows: res.rows || [],
      rowCount: res.affectedRows ?? (res.rows ? res.rows.length : 0),
    };
  }

  throw new Error('Database client not initialized');
}

async function exec(text) {
  await getDb();

  if (pool) {
    return await pool.query(text);
  }

  if (pgliteInstance) {
    return await pgliteInstance.exec(text);
  }

  throw new Error('Database client not initialized');
}

async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (pgliteInstance) {
    await pgliteInstance.close();
    pgliteInstance = null;
  }
  initPromise = null;
}

module.exports = {
  getDb,
  query,
  exec,
  closeDb,
};
