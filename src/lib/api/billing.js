import { supabase } from '../supabaseClient'

// True once you've set VITE_STRIPE_PUBLISHABLE_KEY (frontend) and deployed
// the create-checkout-session / stripe-webhook Edge Functions with their own
// secrets (see SETUP.md). Until then PlanSelect falls back to the existing
// mock checkout so the app keeps working without a Stripe account.
export const isStripeConfigured = Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

// Calls the create-checkout-session Edge Function and returns a Stripe
// Checkout URL to redirect the browser to. Real card entry happens entirely
// on Stripe's own page — no card data ever touches this app's frontend.
export async function createCheckoutSession(plan, billing) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { plan, billing },
  })
  if (error) throw error
  if (!data?.url) throw new Error('Stripe did not return a checkout URL.')
  return data.url
}
