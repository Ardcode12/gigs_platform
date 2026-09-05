// Inspect all existing tables and their columns on Supabase
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function inspect() {
  const client = await pool.connect();
  try {
    const tables = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
    `);

    for (const { tablename } of tables.rows) {
      const cols = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tablename]);

      // Count rows
      const count = await client.query(`SELECT COUNT(*) FROM "${tablename}"`);

      console.log(`\n📋 TABLE: ${tablename} (${count.rows[0].count} rows)`);
      cols.rows.forEach(c => {
        console.log(`   ${c.column_name.padEnd(30)} ${c.data_type.padEnd(20)} ${c.is_nullable === 'YES' ? 'nullable' : 'NOT NULL'}`);
      });
    }
  } finally {
    client.release();
    await pool.end();
  }
}

inspect().catch(console.error);
