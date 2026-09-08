// Natio — send-verification-email
//
// Deploy with: supabase functions deploy send-verification-email
// Required secrets: RESEND_API_KEY, EMAIL_FROM (e.g. "Natio <noreply@natiotravels.com>",
// needs a domain verified with Resend — onboarding@resend.dev can only
// deliver to the Resend account's own email, not arbitrary users), SITE_URL
// (e.g. https://natiotravels.com, used to build the verification link).
//
// Called by a signed-in user (their own JWT, forwarded automatically by
// supabase.functions.invoke) right after signup, and again from the
// "Resend verification email" button. Soft verification only — this never
// blocks anything, it just marks the profile verified once clicked.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const emailFrom = Deno.env.get('EMAIL_FROM')!
const siteUrl = Deno.env.get('SITE_URL')!

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
  )
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

  try {
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('email, email_verified')
      .eq('id', user.id)
      .single()
    if (profileErr) throw profileErr
    if (profile.email_verified) return json({ alreadyVerified: true })

    const token = crypto.randomUUID()
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ email_verify_token: token })
      .eq('id', user.id)
    if (updateErr) throw updateErr

    const verifyUrl = `${siteUrl}/verify-email?token=${token}`
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [profile.email],
        subject: 'Confirm your email for Natio',
        html: `
          <p>Tap the link below to confirm your email address.</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>If you didn't sign up for Natio, you can ignore this email.</p>
        `,
      }),
    })
    if (!res.ok) {
      console.error('send-verification-email: Resend API error:', await res.text())
      return json({ error: 'Failed to send email' }, 500)
    }

    return json({ sent: true })
  } catch (err) {
    console.error('send-verification-email failed:', err)
    return json({ error: err instanceof Error ? err.message : 'Could not send verification email' }, 500)
  }
})
