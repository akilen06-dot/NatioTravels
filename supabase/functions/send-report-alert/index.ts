// Natio — send-report-alert
//
// Deploy with: supabase functions deploy send-report-alert --no-verify-jwt
// (--no-verify-jwt because this is called by a Supabase Database Webhook,
// not a signed-in app user — there's no user JWT to verify.)
// Required secrets: RESEND_API_KEY, ADMIN_EMAIL, REPORT_ALERT_SECRET.
// See SETUP.md for the full walkthrough, including wiring up the Database
// Webhook itself in the Supabase dashboard.
//
// Fires once per new row in `reports` (via a Database Webhook, not called
// directly from the frontend), emailing a summary to ADMIN_EMAIL via
// Resend. Verifies the request actually came from that webhook — not some
// other caller — via a shared secret header, since this function has to be
// deployed with JWT verification off.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const resendApiKey = Deno.env.get('RESEND_API_KEY')!
const adminEmail = Deno.env.get('ADMIN_EMAIL')!
const alertSecret = Deno.env.get('REPORT_ALERT_SECRET')!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

Deno.serve(async (req) => {
  if (req.headers.get('x-report-alert-secret') !== alertSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = await req.json()
  const report = payload.record
  if (!report) return new Response('No record in payload', { status: 400 })

  const [{ data: reporter }, { data: target }] = await Promise.all([
    supabase.from('profiles').select('name, username, email').eq('id', report.reporter_id).single(),
    supabase.from('profiles').select('name, username, email').eq('id', report.target_id).single(),
  ])

  const html = `
    <p><strong>${escapeHtml(reporter?.name ?? 'Unknown')}</strong>
    (@${escapeHtml(reporter?.username ?? '?')}, ${escapeHtml(reporter?.email ?? 'no email')})
    reported <strong>${escapeHtml(target?.name ?? 'Unknown')}</strong>
    (@${escapeHtml(target?.username ?? '?')}, ${escapeHtml(target?.email ?? 'no email')}).</p>
    <p><strong>Reason:</strong> ${escapeHtml(report.reason ?? '')}</p>
    ${report.details ? `<p><strong>Details:</strong> ${escapeHtml(report.details)}</p>` : ''}
    <p><strong>When:</strong> ${escapeHtml(report.created_at ?? '')}</p>
  `

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Natio Reports <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `New report: ${target?.name ?? 'a user'} was reported`,
        html,
      }),
    })
    if (!res.ok) {
      console.error('send-report-alert: Resend API error:', await res.text())
      return new Response('Failed to send email', { status: 500 })
    }
  } catch (err) {
    console.error('send-report-alert failed:', err)
    return new Response('Failed to send email', { status: 500 })
  }

  return new Response(JSON.stringify({ sent: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
