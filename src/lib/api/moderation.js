import { supabase } from '../supabaseClient'

export async function listBlockedIds(userId) {
  const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', userId)
  if (error) throw error
  return (data || []).map((r) => r.blocked_id)
}

export async function blockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from('blocks')
    .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' })
  if (error) throw error
}

export async function unblockUser(blockerId, blockedId) {
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
  if (error) throw error
}

export async function listReports(userId) {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((r) => ({
    id: r.id,
    targetId: r.target_id,
    reason: r.reason,
    details: r.details ?? '',
    at: r.created_at,
  }))
}

export async function reportUser(reporterId, targetId, reason, details) {
  const { error } = await supabase
    .from('reports')
    .insert({ reporter_id: reporterId, target_id: targetId, reason, details: details || null })
  if (error) throw error
}
