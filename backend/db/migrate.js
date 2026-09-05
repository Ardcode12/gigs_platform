/**
 * Applies db/migrations/*.sql to the Supabase project in .env.
 *
 * Supabase's JS client cannot execute arbitrary DDL, so this connects over the
 * Postgres wire protocol instead. It needs DATABASE_URL to be set; without it,
 * run the SQL by hand in the Supabase SQL editor.
 *
 *   node db/migrate.js
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    '\n  DATABASE_URL is not set in backend/.env.\n' +
      '  Either add it, or paste db/migrations/001_authority_auth.sql into the\n' +
      '  Supabase dashboard SQL editor and run it there.\n'
  );
  process.exit(1);
}

const { default: pg } = await import('pg').catch(() => {
  console.error('\n  The "pg" package is required for this script: npm i pg\n');
  process.exit(1);
});

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const dir = path.join(here, 'migrations');
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();

await client.connect();

try {
  for (const file of files) {
    process.stdout.write(`  applying ${file} ... `);
    await client.query(await readFile(path.join(dir, file), 'utf8'));
    console.log('done');
  }
  console.log('\n  Migrations applied.\n');
} catch (error) {
  console.error(`\n  Migration failed: ${error.message}\n`);
  process.exitCode = 1;
} finally {
  await client.end();
}
