import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// True once you've created a Supabase project and added its URL/anon key to
// .env.local (see SETUP.md). Until then every store action falls back to the
// original local/mock behavior, so the app keeps working exactly as before.
export const isBackendConfigured = Boolean(url && anonKey)

export const supabase = isBackendConfigured ? createClient(url, anonKey) : null
