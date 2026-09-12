// Natio — delete-account
//
// Deploy with: supabase functions deploy delete-account
// Required secret: SUPABASE_SERVICE_ROLE_KEY (already set for paddle-webhook /
// send-report-alert).
//
// Called by a signed-in user (their own JWT) from the "Delete my data" button
// in Safety & Privacy. Deleting only the `profiles` row (what the client can
// do on its own under RLS) leaves the underlying auth.users account behind —
// orphaned, unable to sign up again with the same email, and unable to sign
// in cleanly since its profile is gone. Deleting the auth user via the admin
// API is the only way to remove it, and cascades to `profiles` (and from
// there to swipes/matches/messages/posts/etc.) via the existing
// `on delete cascade` foreign keys in schema.sql — one call cleans up
// everything.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // A short-lived client scoped to the caller's own JWT — only used to find
  // out who's calling, never to perform the deletion itself.
  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  })
  const {
    data: { user },
    error: authErr,
  } = await callerClient.auth.getUser()
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

  try {
    const admin = createClient(supabaseUrl, serviceRoleKey)
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) throw error
    return json({ deleted: true })
  } catch (err) {
    console.error('delete-account failed:', err)
    return json({ error: err instanceof Error ? err.message : 'Could not delete account' }, 500)
  }
})
