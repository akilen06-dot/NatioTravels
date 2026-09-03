import { supabase } from '../supabaseClient'
import { getOrCreateConversation } from './messages'
import { notify } from './notifications'

function pairKey(a, b) {
  return a < b ? [a, b] : [b, a]
}

// Haversine distance in km between two fuzzed lat/lng points. Returns null
// if either profile hasn't shared a location yet.
export function distanceKm(a, b) {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return null
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}

export async function listSwipedIds(userId) {
  const { data, error } = await supabase.from('swipes').select('target_id, liked').eq('swiper_id', userId)
  if (error) throw error
  return {
    likedIds: (data || []).filter((r) => r.liked).map((r) => r.target_id),
    passedIds: (data || []).filter((r) => !r.liked).map((r) => r.target_id),
  }
}

// Returns { matched } — true if this swipe created a mutual match.
export async function swipe(userId, targetId, liked) {
  const { error } = await supabase
    .from('swipes')
    .upsert({ swiper_id: userId, target_id: targetId, liked }, { onConflict: 'swiper_id,target_id' })
  if (error) throw error
  if (!liked) return { matched: false }

  await notify(targetId, userId, 'swipe_like')

  const { data: reciprocal } = await supabase
    .from('swipes')
    .select('liked')
    .eq('swiper_id', targetId)
    .eq('target_id', userId)
    .maybeSingle()

  if (!reciprocal?.liked) return { matched: false }

  const [a, b] = pairKey(userId, targetId)
  const { error: matchErr } = await supabase
    .from('matches')
    .upsert({ user_a: a, user_b: b }, { onConflict: 'user_a,user_b' })
  if (matchErr) throw matchErr
  await getOrCreateConversation(userId, targetId)
  return { matched: true }
}

// Deletes every pass this user has made, so those people reappear in their
// Discover deck. Liked swipes (and any matches they created) are untouched.
export async function clearPasses(userId) {
  const { error } = await supabase.from('swipes').delete().eq('swiper_id', userId).eq('liked', false)
  if (error) throw error
}

export async function undoSwipe(userId, targetId) {
  const { error } = await supabase
    .from('swipes')
    .delete()
    .eq('swiper_id', userId)
    .eq('target_id', targetId)
  if (error) throw error
}

export async function listMatchedIds(userId) {
  const { data, error } = await supabase
    .from('matches')
    .select('user_a, user_b')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
  if (error) throw error
  return (data || []).map((m) => (m.user_a === userId ? m.user_b : m.user_a))
}

export async function hasMatch(userId, otherId) {
  const [a, b] = pairKey(userId, otherId)
  const { data, error } = await supabase
    .from('matches')
    .select('id')
    .eq('user_a', a)
    .eq('user_b', b)
    .maybeSingle()
  if (error) throw error
  return !!data
}
