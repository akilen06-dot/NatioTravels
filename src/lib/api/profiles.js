import { supabase } from '../supabaseClient'

function calcAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

// Converts a `profiles` DB row (snake_case) into the shape every existing
// component already expects (camelCase, `photo` not `photo_url`, etc.) so
// the rest of the app never needs to know the backend is real.
export function mapProfileRow(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    username: row.username,
    age: calcAge(row.dob),
    dob: row.dob,
    country: row.country,
    city: row.city,
    photo: row.photo_url,
    bio: row.bio ?? '',
    verified: row.verified,
    plan: row.plan,
    billing: row.billing,
    tripStart: row.trip_start,
    tripEnd: row.trip_end,
    private: row.private,
    language: row.language,
    notificationPrefs: row.notification_prefs,
    devicePermissions: row.device_permissions,
    adPreferences: row.ad_preferences,
    lat: row.lat,
    lng: row.lng,
  }
}

export async function getProfile(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) throw error
  return mapProfileRow(data)
}

export async function listProfiles(excludeId) {
  let query = supabase.from('profiles').select('*')
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query
  if (error) throw error
  return (data || []).map(mapProfileRow)
}

export async function isUsernameTaken(username) {
  const { data, error } = await supabase.rpc('is_username_taken', { check_username: username.trim() })
  if (error) throw error
  return !!data
}

// draft: the in-progress signup form from zustand's `draft` state.
export async function signUp(draft) {
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: draft.email,
    password: draft.password,
  })
  if (authErr) throw authErr
  const userId = authData.user.id

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: draft.email,
      name: draft.name,
      username: draft.username,
      dob: draft.dob || null,
      country: draft.country,
      city: draft.city || 'Lisbon',
      lat: draft.lat ?? null,
      lng: draft.lng ?? null,
      photo_url: draft.photo || `https://i.pravatar.cc/480?u=${encodeURIComponent(draft.email)}`,
      bio: 'New here, say hi!',
      plan: draft.plan ?? null,
      billing: draft.plan === 'subscription' ? draft.billing : null,
      trip_start: draft.tripStart || null,
      trip_end: draft.tripEnd || null,
    })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('That username is taken. Try another.')
    throw error
  }
  return mapProfileRow(data)
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return getProfile(data.user.id)
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function updateProfile(id, patch) {
  const dbPatch = {}
  if ('photo' in patch) dbPatch.photo_url = patch.photo
  if ('bio' in patch) dbPatch.bio = patch.bio
  if ('plan' in patch) dbPatch.plan = patch.plan
  if ('billing' in patch) dbPatch.billing = patch.billing
  if ('tripStart' in patch) dbPatch.trip_start = patch.tripStart
  if ('tripEnd' in patch) dbPatch.trip_end = patch.tripEnd
  if ('private' in patch) dbPatch.private = patch.private
  if ('language' in patch) dbPatch.language = patch.language
  if ('notificationPrefs' in patch) dbPatch.notification_prefs = patch.notificationPrefs
  if ('devicePermissions' in patch) dbPatch.device_permissions = patch.devicePermissions
  if ('adPreferences' in patch) dbPatch.ad_preferences = patch.adPreferences
  if ('password' in patch) {
    const { error: pwErr } = await supabase.auth.updateUser({ password: patch.password })
    if (pwErr) throw pwErr
  }
  if ('lat' in patch) dbPatch.lat = patch.lat
  if ('lng' in patch) dbPatch.lng = patch.lng

  if (Object.keys(dbPatch).length === 0) return getProfile(id)

  const { data, error } = await supabase.from('profiles').update(dbPatch).eq('id', id).select().single()
  if (error) throw error
  return mapProfileRow(data)
}

export async function changePassword(email, currentPassword, newPassword) {
  const { error: verifyErr } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
  if (verifyErr) return { ok: false, error: 'Current password is incorrect.' }
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function deleteMyProfile(id) {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
  await signOut()
}
