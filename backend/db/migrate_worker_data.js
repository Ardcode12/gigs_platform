require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Adding columns to workers table...');
    await client.query(`
      ALTER TABLE workers
        ADD COLUMN IF NOT EXISTS age INTEGER,
        ADD COLUMN IF NOT EXISTS address TEXT,
        ADD COLUMN IF NOT EXISTS bank_account_no VARCHAR(50),
        ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(30),
        ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
        ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb;
    `);

    // Ensure photo_url is TEXT
    await client.query(`
      ALTER TABLE workers ALTER COLUMN photo_url TYPE TEXT;
    `);

    console.log('2. Adding ref_address to worker_kyc_refs table...');
    await client.query(`
      ALTER TABLE worker_kyc_refs
        ADD COLUMN IF NOT EXISTS ref_address TEXT;
    `);

    console.log('3. Updating SOC-TEST-1 password to "pass"...');
    const hash = await bcrypt.hash('pass', 10);
    await client.query(`
      UPDATE societies
      SET password_hash = $1, is_active = TRUE, updated_at = NOW()
      WHERE society_code = 'SOC-TEST-1' OR id = 1
    `, [hash]);

    console.log('4. Removing dummy 400 earning (payment ID 22)...');
    await client.query(`
      DELETE FROM payments WHERE id = 22 OR (total_amount = 400 AND status = 'paid' AND DATE(paid_at) = CURRENT_DATE);
    `);

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
