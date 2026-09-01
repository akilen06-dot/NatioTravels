// Natio — create-checkout-session (Phase 4)
//
// Deploy with: supabase functions deploy create-checkout-session
// Required secrets (supabase secrets set ...): STRIPE_SECRET_KEY,
// STRIPE_PRICE_TRIP, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL, SITE_URL.
// See SETUP.md for the full walkthrough, including creating the Products/
// Prices in the Stripe Dashboard first.
//
// The frontend calls this (via supabase.functions.invoke, which forwards the
// caller's auth token) with { plan: 'trip' | 'subscription', billing?: 'monthly' | 'annual' }
// and gets back { url } — a Stripe Checkout URL to redirect the browser to.
// Stripe's own Checkout page collects the card (and offers Apple Pay/Google
// Pay/PayPal automatically) — no card data ever touches this function.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

const PRICE_IDS = {
  trip: Deno.env.get('STRIPE_PRICE_TRIP')!,
  monthly: Deno.env.get('STRIPE_PRICE_MONTHLY')!,
  annual: Deno.env.get('STRIPE_PRICE_ANNUAL')!,
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
  )
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user) return new Response('Unauthorized', { status: 401 })

  const { plan, billing } = await req.json()
  if (plan !== 'trip' && plan !== 'subscription') {
    return new Response('Invalid plan', { status: 400 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({ email: profile?.email ?? user.email, metadata: { user_id: user.id } })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
  }

  const priceId = plan === 'trip' ? PRICE_IDS.trip : billing === 'annual' ? PRICE_IDS.annual : PRICE_IDS.monthly

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: plan === 'trip' ? 'payment' : 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/discover?checkout=success`,
    cancel_url: `${siteUrl}/onboarding/plan?checkout=canceled`,
    metadata: { user_id: user.id, plan, billing: billing ?? '' },
    // Trip Pass metadata carries through to the webhook so it can set trip_start/trip_end.
    subscription_data: plan === 'subscription' ? { metadata: { user_id: user.id, billing } } : undefined,
  })

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
