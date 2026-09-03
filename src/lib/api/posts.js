import { supabase } from '../supabaseClient'
import { notify } from './notifications'

function mapPostRow(row, likes, comments) {
  return {
    id: row.id,
    authorId: row.author_id,
    photo: row.photo_url,
    caption: row.caption ?? '',
    archived: row.archived,
    at: row.created_at,
    likedBy: likes.filter((l) => l.post_id === row.id).map((l) => l.user_id),
    comments: comments
      .filter((c) => c.post_id === row.id)
      .map((c) => ({ id: c.id, authorId: c.author_id, text: c.text, at: c.created_at })),
  }
}

export async function listPosts() {
  const [{ data: posts, error }, { data: likes }, { data: comments }] = await Promise.all([
    supabase.from('posts').select('*').order('created_at', { ascending: false }),
    supabase.from('post_likes').select('post_id, user_id'),
    supabase.from('post_comments').select('id, post_id, author_id, text, created_at'),
  ])
  if (error) throw error
  return (posts || []).map((p) => mapPostRow(p, likes || [], comments || []))
}

export async function createPost(authorId, { photo, caption }) {
  const { data, error } = await supabase
    .from('posts')
    .insert({ author_id: authorId, photo_url: photo, caption })
    .select()
    .single()
  if (error) throw error
  return data.id
}

export async function deletePost(postId) {
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) throw error
}

export async function setPostArchived(postId, archived) {
  const { error } = await supabase.from('posts').update({ archived }).eq('id', postId)
  if (error) throw error
}

export async function toggleLikePost(postId, userId, currentlyLiked, authorId) {
  if (currentlyLiked) {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from('post_likes')
    .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id' })
  if (error) throw error
  if (authorId) await notify(authorId, userId, 'post_like', { postId })
}

export async function addPostComment(postId, authorId, text) {
  const { error } = await supabase.from('post_comments').insert({ post_id: postId, author_id: authorId, text })
  if (error) throw error
}
