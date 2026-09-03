import { supabase } from '../supabaseClient'

// True once you've set VITE_PADDLE_CLIENT_TOKEN (frontend) and deployed the
// create-paddle-transaction / paddle-webhook Edge Functions with their own
// secrets (see SETUP.md). Until then PlanSelect falls back to the existing
// mock checkout so the app keeps working without a Paddle account.
export const isPaddleConfigured = Boolean(import.meta.env.VITE_PADDLE_CLIENT_TOKEN)

// Calls the create-paddle-transaction Edge Function and returns a Paddle
// transaction id, passed straight into Paddle.js's overlay checkout (see
// ../paddle.js). Real card entry happens entirely inside Paddle's own
// checkout UI — no card data ever touches this app's frontend.
export async function createPaddleTransaction(plan, billing) {
  const { data, error } = await supabase.functions.invoke('create-paddle-transaction', {
    body: { plan, billing },
  })
  if (error) throw error
  if (!data?.transactionId) throw new Error('Paddle did not return a transaction id.')
  return data.transactionId
}
