import { supabase } from '../supabaseClient'

function mapGroupRow(row, members, requests, ratings) {
  return {
    id: row.id,
    name: row.name,
    nationality: row.nationality,
    city: row.city,
    date: row.date,
    description: row.description ?? '',
    ownerId: row.owner_id,
    members: members.filter((m) => m.group_id === row.id).map((m) => m.user_id),
    pendingRequests: requests.filter((r) => r.group_id === row.id).map((r) => r.user_id),
    ratings: ratings
      .filter((r) => r.group_id === row.id)
      .map((r) => ({ userId: r.user_id, rating: r.rating, comment: r.comment, at: r.created_at })),
  }
}

export async function listGroups() {
  const [{ data: groups, error }, { data: members }, { data: requests }, { data: ratings }] = await Promise.all([
    supabase.from('groups').select('*').order('created_at', { ascending: false }),
    supabase.from('group_members').select('group_id, user_id'),
    supabase.from('group_join_requests').select('group_id, user_id'),
    supabase.from('group_ratings').select('group_id, user_id, rating, comment, created_at'),
  ])
  if (error) throw error
  return (groups || []).map((g) => mapGroupRow(g, members || [], requests || [], ratings || []))
}

export async function createGroup(ownerId, data) {
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name: data.name, nationality: data.nationality, city: data.city, date: data.date, description: data.description, owner_id: ownerId })
    .select()
    .single()
  if (error) throw error
  const { error: memberErr } = await supabase.from('group_members').insert({ group_id: group.id, user_id: ownerId })
  if (memberErr) throw memberErr
  return group.id
}

export async function requestToJoin(groupId, userId) {
  const { error } = await supabase
    .from('group_join_requests')
    .upsert({ group_id: groupId, user_id: userId }, { onConflict: 'group_id,user_id' })
  if (error) throw error
}

export async function acceptRequest(groupId, userId) {
  const { error: insertErr } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userId })
  if (insertErr) throw insertErr
  const { error: deleteErr } = await supabase
    .from('group_join_requests')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)
  if (deleteErr) throw deleteErr
}

export async function declineRequest(groupId, userId) {
  const { error } = await supabase
    .from('group_join_requests')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)
  if (error) throw error
}

export async function kickMember(groupId, userId) {
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId)
  if (error) throw error
}

export const leaveGroup = kickMember

export async function rateGroup(groupId, userId, rating, comment) {
  const { error } = await supabase
    .from('group_ratings')
    .upsert({ group_id: groupId, user_id: userId, rating, comment }, { onConflict: 'group_id,user_id' })
  if (error) throw error
}
