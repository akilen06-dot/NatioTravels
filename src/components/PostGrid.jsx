import { useNavigate } from 'react-router-dom'
import { Camera, Heart, Plus } from '@phosphor-icons/react'

export default function PostGrid({ posts, emptyHint, onAddClick }) {
  const navigate = useNavigate()

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center border-t border-border py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-sunken text-ink-faint">
          <Camera size={24} />
        </span>
        <p className="mt-4 text-[14.5px] font-medium text-ink">No posts yet</p>
        <p className="mt-1 max-w-[220px] text-[13px] text-ink-muted">{emptyHint}</p>
        {onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-accent-strong px-4 py-2 text-[13.5px] font-medium text-white transition-colors duration-200 hover:bg-accent-strong/90 cursor-pointer"
          >
            <Plus size={15} weight="bold" />
            New post
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 border-t border-border">
      {onAddClick && (
        <button
          type="button"
          onClick={onAddClick}
          aria-label="New post"
          className="flex aspect-square items-center justify-center border border-dashed border-border-strong bg-bg-sunken text-ink-faint transition-colors duration-200 hover:text-accent-strong hover:border-accent cursor-pointer"
        >
          <Plus size={26} />
        </button>
      )}
      {posts.map((post) => (
        <button
          key={post.id}
          type="button"
          onClick={() => navigate(`/posts/${post.id}`)}
          className="group relative aspect-square overflow-hidden bg-bg-sunken cursor-pointer"
        >
          <img
            src={post.photo}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
          {post.likedBy.length > 0 && (
            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white">
              <Heart size={11} weight="fill" />
              {post.likedBy.length}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
