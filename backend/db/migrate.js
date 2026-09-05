// Direct schema runner — uses single transaction
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runSchema() {
  const client = await pool.connect();
  try {
    console.log('🔗 Connected to Supabase...\n');
    const sql = fs.readFileSync(path.join(__dirname, 'schema_v2.sql'), 'utf8');
    console.log('📦 Applying schema_v2.sql...');
    await client.query(sql);
    console.log('✅ Schema V2 applied successfully!\n');

    // Verify new tables
    const res = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);
    console.log('Tables in DB:');
    res.rows.forEach(r => console.log(' •', r.tablename));

    // Verify new columns on workers
    const wcols = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'workers' AND column_name IN
      ('worker_unique_id','kyc_status','category','kyc_method','availability')
    `);
    console.log('\nNew worker columns:', wcols.rows.map(r => r.column_name).join(', '));

  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.detail) console.error('   Detail:', err.detail);
  } finally {
    client.release();
    await pool.end();
  }
}

runSchema();
