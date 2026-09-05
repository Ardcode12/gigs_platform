const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding database...');
    const seedSQL = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seedSQL);
    console.log('✅ Seed data loaded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
