require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const wCols = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'workers' ORDER BY ordinal_position"
  );
  console.log('WORKERS COLS:', wCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  const refCols = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'worker_kyc_refs' ORDER BY ordinal_position"
  );
  console.log('KYC REFS COLS:', refCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  const socs = await pool.query("SELECT id, society_code, name, password_hash FROM societies");
  console.log('SOCIETIES:', socs.rows);

  await pool.end();
}

run().catch(console.error);
