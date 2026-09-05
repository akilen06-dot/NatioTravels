// Natio — create-paddle-transaction (Phase 4)
//
// Deploy with: supabase functions deploy create-paddle-transaction
// Required secrets (supabase secrets set ...): PADDLE_API_KEY, PADDLE_PRICE_TRIP,
// PADDLE_PRICE_MONTHLY, PADDLE_PRICE_ANNUAL. Optional: PADDLE_ENVIRONMENT
// ('sandbox' or 'production', defaults to 'sandbox' — deliberately, so a
// missing secret never accidentally takes real payments).
// See SETUP.md for the full walkthrough, including creating the
// Products/Prices in the Paddle Dashboard first.
//
// The frontend calls this (via supabase.functions.invoke, which forwards the
// caller's auth token) with { plan: 'trip' | 'subscription', billing?: 'monthly' | 'annual' }
// and gets back { transactionId } — passed straight into Paddle.js's overlay
// checkout on the frontend. Real card entry happens entirely inside Paddle's
// own checkout UI — no card data ever touches this function or the frontend.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const environment = Deno.env.get('PADDLE_ENVIRONMENT') === 'production' ? 'production' : 'sandbox'
const paddleApiBase = environment === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com'
const paddleApiKey = Deno.env.get('PADDLE_API_KEY')!

const PRICE_IDS = {
  trip: Deno.env.get('PADDLE_PRICE_TRIP')!,
  monthly: Deno.env.get('PADDLE_PRICE_MONTHLY')!,
  annual: Deno.env.get('PADDLE_PRICE_ANNUAL')!,
}

// Called from a real browser (via supabase.functions.invoke), so it needs to
// answer the CORS preflight itself and set these on every response —
// Supabase Edge Functions don't add CORS headers for you.
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

async function paddleFetch(path: string, init: RequestInit) {
  const res = await fetch(`${paddleApiBase}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${paddleApiKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error?.detail || `Paddle API error (${res.status})`)
  return body.data
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

  const { plan, billing } = await req.json()
  if (plan !== 'trip' && plan !== 'subscription') {
    return json({ error: 'Invalid plan' }, 400)
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('paddle_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.paddle_customer_id
    if (!customerId) {
      const email = profile?.email ?? user.email
      // A customer with this email may already exist in Paddle from an
      // earlier attempt (e.g. one that created the customer but failed
      // before this row got updated) — Paddle's create-customer call
      // rejects a duplicate email outright, so look it up first instead of
      // assuming this user has no Paddle customer yet.
      const existing = await paddleFetch(`/customers?email=${encodeURIComponent(email)}`, { method: 'GET' })
      if (existing?.length) {
        customerId = existing[0].id
      } else {
        const customer = await paddleFetch('/customers', {
          method: 'POST',
          body: JSON.stringify({ email }),
        })
        customerId = customer.id
      }
      await supabase.from('profiles').update({ paddle_customer_id: customerId }).eq('id', user.id)
    }

    const priceId = plan === 'trip' ? PRICE_IDS.trip : billing === 'annual' ? PRICE_IDS.annual : PRICE_IDS.monthly

    const transaction = await paddleFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        customer_id: customerId,
        custom_data: { user_id: user.id, plan, billing: billing ?? '' },
      }),
    })

    return json({ transactionId: transaction.id })
  } catch (err) {
    // Logged explicitly — the Dashboard's Logs tab only shows boot/shutdown
    // events otherwise, and the Invocations tab's response body is easy to
    // miss. console.error here makes the real reason show up in Logs too.
    console.error('create-paddle-transaction failed:', err)
    return json({ error: err instanceof Error ? err.message : 'Could not create checkout' }, 500)
  }
})
