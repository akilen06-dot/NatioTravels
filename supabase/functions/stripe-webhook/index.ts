// Natio — stripe-webhook (Phase 4)
//
// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt
// (--no-verify-jwt because Stripe calls this directly, not through your app's
// auth). Required secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
// SUPABASE_SERVICE_ROLE_KEY. Then in the Stripe Dashboard, add an endpoint
// pointing at this function's URL listening for: checkout.session.completed,
// customer.subscription.updated, customer.subscription.deleted.
//
// This is the ONLY place a user's `plan`/`billing`/trip dates should change
// as a result of a real payment — it's the source of truth once billing is
// live, replacing the client-driven renewTrip/upgradeToSubscription calls.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const TRIP_PASS_MAX_DAYS = 14

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.user_id
      if (!userId) break

      if (session.mode === 'payment') {
        // Trip Pass: starts today, capped at 14 days (mirrors the app's own
        // tripPassExpiry rule in src/lib/store.js).
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
      } else if (session.mode === 'subscription') {
        await supabase
          .from('profiles')
          .update({
            plan: 'subscription',
            billing: session.metadata?.billing || 'monthly',
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break
      await supabase
        .from('profiles')
        .update({ plan: sub.status === 'active' ? 'subscription' : null })
        .eq('id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break
      await supabase
        .from('profiles')
        .update({ plan: null, billing: null, stripe_subscription_id: null })
        .eq('id', userId)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
