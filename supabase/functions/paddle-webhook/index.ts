// Natio — paddle-webhook (Phase 4)
//
// Deploy with: supabase functions deploy paddle-webhook --no-verify-jwt
// (--no-verify-jwt because Paddle calls this directly, not through your app's
// auth). Required secrets: PADDLE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY.
// Then in the Paddle Dashboard, add a notification destination pointing at
// this function's URL, listening for: transaction.completed,
// subscription.created, subscription.updated, subscription.canceled.
//
// This is the ONLY place a user's `plan`/`billing`/trip dates should change
// as a result of a real payment — it's the source of truth once billing is
// live, replacing the client-driven renewTrip/upgradeToSubscription calls.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const webhookSecret = Deno.env.get('PADDLE_WEBHOOK_SECRET')!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const TRIP_PASS_MAX_DAYS = 14

// Paddle signs `${timestamp}:${raw body}` with HMAC-SHA256 and sends it in
// the `Paddle-Signature` header as `ts=<unix ts>;h1=<hex digest>`. Verifying
// against the exact raw bytes (not a re-serialized/parsed copy) is required
// — see https://developer.paddle.com/webhooks/about/signature-verification.
async function isValidSignature(rawBody: string, header: string | null): Promise<boolean> {
  // Temporary diagnostics — safe to log: none of this is the secret itself,
  // only lengths/digests, which are meaningless without it.
  console.log('paddle-webhook debug: secret set?', !!webhookSecret, 'secret length:', webhookSecret?.length)
  console.log('paddle-webhook debug: header received:', header)
  console.log('paddle-webhook debug: body length:', rawBody.length)

  if (!header) return false
  const parts = Object.fromEntries(
    header.split(';').map((p) => p.trim().split('=').map((s) => s.trim()) as [string, string]),
  )
  const { ts, h1 } = parts
  console.log('paddle-webhook debug: parsed ts:', ts, 'h1:', h1)
  if (!ts || !h1) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(webhookSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${ts}:${rawBody}`))
  const computed = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  console.log('paddle-webhook debug: computed:', computed)

  if (computed.length !== h1.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ h1.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  const rawBody = await req.text()
  const valid = await isValidSignature(rawBody, req.headers.get('paddle-signature'))
  if (!valid) {
    console.error('paddle-webhook: invalid signature')
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(rawBody)
  const data = event.data ?? {}
  console.log(`paddle-webhook: received ${event.event_type}`)

  switch (event.event_type) {
    // Only acts on a Trip Pass purchase (a one-time, non-recurring price) —
    // a subscription purchase's plan/billing is set from subscription.created
    // below instead, keyed off the Paddle customer id rather than custom_data,
    // since custom_data propagating from transaction to subscription isn't
    // guaranteed the way it is on the transaction itself.
    case 'transaction.completed': {
      const userId = data.custom_data?.user_id
      const plan = data.custom_data?.plan
      if (!userId || plan !== 'trip') break
      const start = new Date()
      const end = new Date(start)
      end.setDate(end.getDate() + TRIP_PASS_MAX_DAYS)
      await supabase
        .from('profiles')
        .update({
          plan: 'trip',
          billing: null,
          trip_start: start.toISOString().slice(0, 10),
          trip_end: end.toISOString().slice(0, 10),
        })
        .eq('id', userId)
      break
    }

    case 'subscription.created': {
      const customerId = data.customer_id
      if (!customerId) break
      await supabase
        .from('profiles')
        .update({
          plan: 'subscription',
          billing: data.custom_data?.billing || 'monthly',
          paddle_subscription_id: data.id,
        })
        .eq('paddle_customer_id', customerId)
      break
    }

    case 'subscription.updated': {
      const customerId = data.customer_id
      if (!customerId) break
      await supabase
        .from('profiles')
        .update({ plan: data.status === 'active' ? 'subscription' : null })
        .eq('paddle_customer_id', customerId)
      break
    }

    case 'subscription.canceled': {
      const customerId = data.customer_id
      if (!customerId) break
      await supabase
        .from('profiles')
        .update({ plan: null, billing: null, paddle_subscription_id: null })
        .eq('paddle_customer_id', customerId)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
