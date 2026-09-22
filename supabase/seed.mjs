/**
 * Vanguard 2026 — Admin Account Seeder
 *
 * Usage:
 *   1. Fill in your SUPABASE_URL and SERVICE_ROLE_KEY below
 *      (from Supabase Dashboard → Settings → API)
 *   2. Run:  node supabase/seed.mjs
 */

import { createClient } from '@supabase/supabase-js';

// ─── FILL THESE IN ──────────────────────────────────────────
const SUPABASE_URL = 'https://tfnqgkzyxgmqpcsjrqay.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbnFna3p5eGdtcXBjc2pycWF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDA4OTA2NSwiZXhwIjoyMTA1NjY1MDY1fQ.cxqUCTeXHBCYF7jt_NDrglvXWDB16hTJAtyM6dZPEDQ';
// ────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const admins = [
  {
    full_name: 'Vanguard Admin 1',
    email: 'vanguard.admin1@gmail.com',
    password: 'VG@Admin#1826',
  },
  {
    full_name: 'Vanguard Admin 2',
    email: 'vanguard.admin2@gmail.com',
    password: 'VG@Admin#2826',
  },
  {
    full_name: 'Vanguard Admin 3',
    email: 'vanguard.admin3@gmail.com',
    password: 'VG@Admin#3826',
  },
  {
    full_name: 'Vanguard Admin 4',
    email: 'vanguard.admin4@gmail.com',
    password: 'VG@Admin#4826',
  },
];

console.log('\n🚀  Seeding Vanguard 2026 admin accounts...\n');

for (const admin of admins) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
    email_confirm: true,
    user_metadata: {
      full_name: admin.full_name,
      role: 'admin',
    },
  });

  if (error) {
    console.error(`✗  ${admin.email}  →  ${error.message}`);
    continue;
  }

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    role: 'admin',
    full_name: admin.full_name,
    email: admin.email,
  });

  if (profileError) {
    console.error(`   ⚠ Profile error: ${profileError.message}`);
  } else {
    console.log(`✓  ${admin.full_name}`);
    console.log(`   Email    : ${admin.email}`);
    console.log(`   Password : ${admin.password}\n`);
  }
}

console.log('✅  Done! All admin accounts created.');
console.log('   → Login at /login with the credentials above.\n');
