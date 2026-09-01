import { supabase } from '../supabaseClient'

function pairKey(a, b) {
  return a < b ? [a, b] : [b, a]
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
      .select('id, sender_id, text, created_at')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: true })
    results.push({
      id: `match-${otherId}`,
      conversationId: c.id,
      otherId,
      type: 'match',
      name: profileById[otherId]?.name,
      photo: profileById[otherId]?.photo_url,
      messages: (messages || []).map((m) => ({
        id: m.id,
        from: m.sender_id === userId ? 'me' : m.sender_id,
        text: m.text,
        at: m.created_at,
      })),
    })
  }
  return results
}

export async function sendMessage(userId, otherId, text) {
  const conversationId = await getOrCreateConversation(userId, otherId)
  const { error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: userId, text })
  if (error) throw error
}
