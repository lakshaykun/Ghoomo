const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
});

async function check() {
  try {
    const res = await pool.query('SELECT DISTINCT status FROM rides');
    console.log('Current statuses in rides table:', res.rows.map(r => r.status));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
