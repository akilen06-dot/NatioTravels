import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Archive, ArrowUUpLeft, Heart, Trash } from '@phosphor-icons/react'
import { fieldClasses } from '../../lib/fieldClasses'
import { useStore, findPersonById } from '../../lib/store'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function CommentRow({ comment }) {
  const author = useStore((s) => findPersonById(s, comment.authorId))
  return (
    <div className="flex items-start gap-3 py-2.5">
      <img src={author?.photo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
      <div className="min-w-0">
        <p className="text-[13.5px] leading-relaxed text-ink">
          <span className="font-medium">{author?.name ?? 'Someone'}</span>{' '}
          <span className="text-ink-muted">{comment.text}</span>
        </p>
        <p className="mt-0.5 text-[11.5px] text-ink-faint">{timeAgo(comment.at)}</p>
      </div>
    </div>
  )
}

export default function PostDetail() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const post = useStore((s) => s.posts.find((p) => p.id === postId))
  const author = useStore((s) => (post ? findPersonById(s, post.authorId) : null))
  const toggleLikePost = useStore((s) => s.toggleLikePost)
  const addPostComment = useStore((s) => s.addPostComment)
  const deletePost = useStore((s) => s.deletePost)
  const archivePost = useStore((s) => s.archivePost)
  const unarchivePost = useStore((s) => s.unarchivePost)
  const [text, setText] = useState('')

  if (!post) {
    return <p className="p-8 text-center text-ink-muted">Post not found.</p>
  }

  const liked = post.likedBy.includes(currentUser.id)
  const isOwn = post.authorId === currentUser.id

  function handleComment(e) {
    e.preventDefault()
    if (!text.trim()) return
    addPostComment(postId, text.trim())
    setText('')
  }

  function handleDelete() {
    deletePost(postId)
    navigate('/profile')
  }

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <img src={author?.photo} alt="" className="h-7 w-7 rounded-full object-cover" />
          <p className="text-[14px] font-medium text-ink">{author?.name}</p>
        </div>
        {isOwn ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => (post.archived ? unarchivePost(postId) : archivePost(postId))}
              aria-label={post.archived ? 'Unarchive post' : 'Archive post'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:text-ink hover:bg-bg-sunken cursor-pointer"
            >
              {post.archived ? <ArrowUUpLeft size={16} /> : <Archive size={16} />}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete post"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors duration-200 hover:text-danger hover:bg-danger-tint cursor-pointer"
            >
              <Trash size={17} />
            </button>
          </div>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          <img src={post.photo} alt="" className="aspect-square w-full object-cover" />
          {post.archived && (
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-sm">
              Archived · only you can see this
            </span>
          )}
        </div>

        <div className="px-5 py-4">
          <button
            type="button"
            onClick={() => toggleLikePost(postId)}
            aria-label={liked ? 'Unlike' : 'Like'}
            className="inline-flex items-center gap-2 cursor-pointer"
          >
            <Heart
              size={24}
              weight={liked ? 'fill' : 'regular'}
              className={liked ? 'text-danger' : 'text-ink'}
            />
            <span className="text-[13.5px] font-medium text-ink">
              {post.likedBy.length} {post.likedBy.length === 1 ? 'like' : 'likes'}
            </span>
          </button>

          <p className="mt-3 text-[14px] leading-relaxed text-ink">
            <span className="font-medium">{author?.name}</span>{' '}
            <span className="text-ink-muted">{post.caption}</span>
          </p>
          <p className="mt-1 text-[11.5px] text-ink-faint">{timeAgo(post.at)}</p>

          <div className="mt-4 divide-y divide-border border-t border-border">
            {post.comments.length === 0 ? (
              <p className="py-4 text-[13px] text-ink-muted">No comments yet.</p>
            ) : (
              post.comments.map((c) => <CommentRow key={c.id} comment={c} />)
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleComment} className="flex items-center gap-2.5 border-t border-border px-5 py-3.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment"
          className={fieldClasses(false)}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="shrink-0 text-[13.5px] font-medium text-accent-strong disabled:opacity-40 cursor-pointer"
        >
          Post
        </button>
      </form>
    </div>
  )
}
