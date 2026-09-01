// Natio — removes all seeded demo data (Phase 1)
//
// Run this once, right before a real launch, to delete every account
// supabase/seed.mjs created (flagged `is_seed_data = true`) — both their
// Supabase Auth login and their profiles row, which cascades to delete their
// matches, messages, groups, and posts too. Real user accounts are untouched.
//
// Run with: node --env-file=supabase/.env.seed supabase/cleanup-seed-data.mjs

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Run with: node --env-file=supabase/.env.seed supabase/cleanup-seed-data.mjs',
  )
  process.exit(1)
}

const CONFIRM_PHRASE = 'yes-delete-seed-data'
if (process.env.CLEANUP_CONFIRM !== CONFIRM_PHRASE) {
  console.error(
    `This permanently deletes every seeded demo account (and their data) from ${url}.\n` +
      `To proceed, re-run with CLEANUP_CONFIRM=${CONFIRM_PHRASE} set in supabase/.env.seed.`,
  )
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data: seedProfiles, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('is_seed_data', true)
  if (error) {
    console.error('Failed to list seed profiles:', error.message)
    process.exit(1)
  }

  if (!seedProfiles.length) {
    console.log('No seed data found — nothing to clean up.')
    return
  }

  console.log(`Deleting ${seedProfiles.length} seeded account(s)...`)
  for (const p of seedProfiles) {
    // Deleting the auth user cascades (via the profiles.id FK) to remove
    // their profile, matches, messages, groups, and posts automatically.
    const { error: delErr } = await supabase.auth.admin.deleteUser(p.id)
    console.log(`  ${p.email} -> ${delErr ? 'FAILED: ' + delErr.message : 'deleted'}`)
  }
  console.log('Done.')
}

main()
