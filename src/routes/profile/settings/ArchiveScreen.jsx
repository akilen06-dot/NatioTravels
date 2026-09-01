import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkle } from '@phosphor-icons/react'
import { useStore } from '../../../lib/store'

export default function ArchiveScreen() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const allPosts = useStore((s) => s.posts)
  const unarchivePost = useStore((s) => s.unarchivePost)
  const archived = allPosts.filter((p) => p.authorId === currentUser.id && p.archived)

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <button
        type="button"
        onClick={() => navigate('/profile/settings')}
        className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
      >
        <ArrowLeft size={16} />
        Settings
      </button>

      <h1 className="mt-4 text-xl font-semibold text-ink">Archive</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-muted">
        Archived pictures are hidden from your profile, but not deleted. Only you can see this.
      </p>

      {archived.length === 0 ? (
        <div className="mt-10 flex flex-col items-center border-t border-border py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-sunken text-ink-faint">
            <Sparkle size={24} />
          </span>
          <p className="mt-4 text-[14.5px] font-medium text-ink">Nothing archived yet</p>
          <p className="mt-1 max-w-[240px] text-[13px] text-ink-muted">
            Archive a picture from its detail view and it'll show up here.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-0.5 border-t border-border">
          {archived.map((post) => (
            <div key={post.id} className="relative aspect-square overflow-hidden bg-bg-sunken">
              <img src={post.photo} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => unarchivePost(post.id)}
                className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-black/60 px-2 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm transition-colors duration-200 hover:bg-black/75 cursor-pointer"
              >
                Unarchive
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
