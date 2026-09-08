import { supabase } from '../supabaseClient'
import { notify } from './notifications'

function pairKey(a, b) {
  return a < b ? [a, b] : [b, a]
}

function mapMessageRow(m, userId) {
  return {
    id: m.id,
    from: m.sender_id === userId ? 'me' : m.sender_id,
    text: m.text ?? '',
    attachment: m.attachment_url
      ? { url: m.attachment_url, type: m.attachment_type, name: m.attachment_name }
      : null,
    at: m.created_at,
  }
}

export async function getOrCreateConversation(userId, otherId) {
  const [a, b] = pairKey(userId, otherId)
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_a', a)
    .eq('user_b', b)
    .maybeSingle()
  if (existing) return existing.id

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_a: a, user_b: b })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

// Returns a list shaped like the app's old `threads` map values, keyed by
// the *other* person's id so existing UI (which used `match-<personId>` as
// the thread id) keeps working unchanged.
export async function listConversations(userId) {
  const { data: convos, error } = await supabase
    .from('conversations')
    .select('id, user_a, user_b')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
  if (error) throw error
  if (!convos?.length) return []

  const otherIds = convos.map((c) => (c.user_a === userId ? c.user_b : c.user_a))
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, photo_url')
    .in('id', otherIds)
  const profileById = Object.fromEntries((profiles || []).map((p) => [p.id, p]))

  const results = []
  for (const c of convos) {
    const otherId = c.user_a === userId ? c.user_b : c.user_a
    const { data: messages } = await supabase
      .from('messages')
      .select('id, sender_id, text, attachment_url, attachment_type, attachment_name, created_at')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: true })
    results.push({
      id: `match-${otherId}`,
      conversationId: c.id,
      otherId,
      type: 'match',
      name: profileById[otherId]?.name,
      photo: profileById[otherId]?.photo_url,
      messages: (messages || []).map((m) => mapMessageRow(m, userId)),
    })
  }
  return results
}

// `attachment` is { url, type: 'image' | 'file', name } or null/undefined.
export async function sendMessage(userId, otherId, text, attachment) {
  const conversationId = await getOrCreateConversation(userId, otherId)
  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: userId,
    text: text || null,
    attachment_url: attachment?.url ?? null,
    attachment_type: attachment?.type ?? null,
    attachment_name: attachment?.name ?? null,
  })
  if (error) throw error
  const preview = text?.trim() || (attachment ? (attachment.type === 'image' ? 'Sent a photo' : `Sent a file: ${attachment.name}`) : '')
  await notify(otherId, userId, 'message', { conversationId, preview: preview.slice(0, 140) })
}

// Live push the moment a new message lands in this conversation, so an open
// ChatThread updates instantly instead of only on next mount/refresh.
// Returns an unsubscribe function.
export function subscribeToConversation(conversationId, userId, onInsert) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(mapMessageRow(payload.new, userId)),
    )
    .subscribe()
  return () => supabase.removeChannel(channel)
}
