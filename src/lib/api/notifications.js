import { supabase } from '../supabaseClient'

function mapRow(row) {
  return {
    id: row.id,
    type: row.type,
    actorId: row.actor_id,
    postId: row.post_id,
    conversationId: row.conversation_id,
    preview: row.preview,
    read: row.read,
    at: row.created_at,
  }
}

export async function listNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data || []).map(mapRow)
}

// Never notifies yourself (liking your own post, etc.) — the caller doesn't
// need to check that first. Swallows its own errors: a notification is a
// side effect of the real action (a swipe, a like, a message), and that
// action having already succeeded should never get undone or blocked by
// this failing.
export async function notify(userId, actorId, type, extra = {}) {
  if (userId === actorId) return
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type,
    post_id: extra.postId ?? null,
    conversation_id: extra.conversationId ?? null,
    preview: extra.preview ?? null,
  })
  if (error) console.error('Failed to create notification:', error)
}

export async function markAllRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
  if (error) throw error
}

// Live push the moment a new notification lands, for the "someone messaged
// you" toast. Returns an unsubscribe function.
export function subscribeToNotifications(userId, onInsert) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(mapRow(payload.new)),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}
