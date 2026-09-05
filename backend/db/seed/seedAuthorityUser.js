/**
 * Creates (or updates) an authority officer account.
 *
 * There is no public sign-up: authority officers are provisioned. This script
 * is how the first one gets in, before the user-management module exists.
 *
 *   npm run seed -- --email officer@dept.gov.in --password 'Str0ngPass!' \
 *                   --name "R. Menon" --employee-id AUTH-001
 *
 * Re-running with an existing email resets that account's password and profile
 * rather than failing, so it doubles as a recovery hatch.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../.env') });

function arg(flag, fallback) {
  const index = process.argv.indexOf(`--${flag}`);
  return index !== -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const config = {
  email: arg('email', 'authority@cooperative.gov.in').toLowerCase(),
  password: arg('password', 'Authority@123'),
  fullName: arg('name', 'Authority Administrator'),
  employeeId: arg('employee-id', 'AUTH-001'),
  designation: arg('designation', 'Authority Officer'),
  department: arg('department', 'Department of Cooperative Societies'),
  phone: arg('phone', null),
};

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findAuthUserByEmail(email) {
  // listUsers has no server-side email filter, so page through until found.
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);

    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function seed() {
  console.log(`\nProvisioning authority account: ${config.email}`);

  const existing = await findAuthUserByEmail(config.email);
  let userId;

  if (existing) {
    userId = existing.id;
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: config.password,
      email_confirm: true,
    });
    if (error) throw new Error(`Could not reset the password: ${error.message}`);
    console.log('  Existing auth user found -- password reset.');
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: config.email,
      password: config.password,
      email_confirm: true, // provisioned account: skip the confirmation email
      user_metadata: { full_name: config.fullName, role: 'authority' },
    });
    if (error) throw new Error(`Could not create the auth user: ${error.message}`);
    userId = data.user.id;
    console.log('  Auth user created.');
  }

  const { error: profileError } = await supabase.from('authority_users').upsert(
    {
      id: userId,
      employee_id: config.employeeId,
      full_name: config.fullName,
      email: config.email,
      phone: config.phone,
      designation: config.designation,
      department: config.department,
      role: 'authority',
      status: 'active',
      must_change_password: false,
      failed_login_count: 0,
      locked_until: null,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    throw new Error(
      `Could not write the authority profile: ${profileError.message}\n` +
        'Has db/migrations/001_authority_auth.sql been run on this project?'
    );
  }

  console.log('  Authority profile saved.\n');
  console.log('  Sign in with:');
  console.log(`    Email    : ${config.email}`);
  console.log(`    Password : ${config.password}\n`);
  console.log('  Change this password after the first sign-in.\n');
}

seed().catch((error) => {
  console.error(`\n  Seed failed: ${error.message}\n`);
  process.exit(1);
});
