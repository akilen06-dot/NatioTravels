import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  existingUsers as seedExistingUsers,
  initialGroups,
  initialPosts,
  initialThreads,
  travelers,
} from './mockData'
import { isBackendConfigured } from './supabaseClient'
import * as profilesApi from './api/profiles'
import * as matchesApi from './api/matches'
import * as groupsApi from './api/groups'
import * as messagesApi from './api/messages'
import * as postsApi from './api/posts'
import * as moderationApi from './api/moderation'

function calcAge(dob) {
  if (!dob) return null
  const d = new Date(dob)
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

export const DEFAULT_NOTIFICATION_PREFS = {
  matches: true,
  messages: true,
  groupActivity: true,
  meetupReminders: true,
  marketing: false,
}

export const DEFAULT_DEVICE_PERMISSIONS = {
  location: true,
  camera: true,
  notifications: true,
}

export const DEFAULT_AD_PREFERENCES = {
  personalized: true,
}

const initialDraft = {
  name: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  country: '',
  dob: '',
  idCaptured: false,
  faceVerified: false,
  photo: '',
  city: '',
  lat: null,
  lng: null,
  tripStart: '',
  tripEnd: '',
  plan: null,
  billing: 'annual',
  intendedPlan: null,
}

export const useStore = create(
  persist(
    (set, get) => ({
      auth: 'signed-out',
      draft: { ...initialDraft },
      currentUser: null,
      existingUsers: seedExistingUsers,
      travelers,
      likedIds: [],
      passedIds: [],
      matches: [],
      groups: initialGroups,
      threads: initialThreads,
      posts: initialPosts,
      meetupsThisYear: 240,
      verifiedTravelers: 1000,
      signInError: '',
      blockedIds: [],
      reports: [],

      beginSignUp: (fields) =>
        set({
          auth: 'onboarding',
          draft: { ...initialDraft, ...fields },
          signInError: '',
        }),

      setDraftField: (key, value) =>
        set((s) => ({ draft: { ...s.draft, [key]: value } })),

      // Loads everything the signed-in user needs (other profiles, matches,
      // groups, threads, posts, blocks/reports) from Supabase in one go.
      // Only meaningful once a real backend is configured; a no-op otherwise.
      hydrate: async () => {
        if (!isBackendConfigured) return
        const userId = get().currentUser?.id
        if (!userId) return
        const [allProfiles, matchedIds, swiped, groups, threads, posts, blockedIds, reports] =
          await Promise.all([
            profilesApi.listProfiles(userId),
            matchesApi.listMatchedIds(userId),
            matchesApi.listSwipedIds(userId),
            groupsApi.listGroups(),
            messagesApi.listConversations(userId),
            postsApi.listPosts(),
            moderationApi.listBlockedIds(userId),
            moderationApi.listReports(userId),
          ])
        set({
          travelers: allProfiles,
          existingUsers: [],
          matches: matchedIds,
          likedIds: swiped.likedIds,
          passedIds: swiped.passedIds,
          groups,
          threads: Object.fromEntries(threads.map((t) => [t.id, t])),
          posts,
          blockedIds,
          reports,
        })
      },

      attemptSignIn: async (email, password) => {
        if (isBackendConfigured) {
          try {
            const profile = await profilesApi.signIn(email, password)
            set({ currentUser: profile, auth: 'active', signInError: '' })
            await get().hydrate()
            return true
          } catch (err) {
            const message = /invalid login/i.test(err.message || '')
              ? 'Incorrect password. Try again.'
              : err.message || 'Could not sign in. Try again.'
            set({ signInError: message })
            return false
          }
        }
        const found = get().existingUsers.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        )
        if (!found) {
          set({ signInError: 'No account found with that email. Try signing up instead.' })
          return false
        }
        if (found.password !== password) {
          set({ signInError: 'Incorrect password. Try again.' })
          return false
        }
        set({ currentUser: found, auth: 'active', signInError: '' })
        return true
      },

      clearSignInError: () => set({ signInError: '' }),

      completeVerification: () =>
        set((s) => ({ draft: { ...s.draft, idCaptured: true, faceVerified: true } })),

      setTripDates: (tripStart, tripEnd) =>
        set((s) => ({ draft: { ...s.draft, tripStart, tripEnd } })),

      choosePlanAndFinish: async (plan, billing) => {
        if (isBackendConfigured) {
          const draft = { ...get().draft, plan, billing: plan === 'subscription' ? billing : null }
          const profile = await profilesApi.signUp(draft)
          set((s) => ({
            currentUser: profile,
            auth: 'active',
            draft: { ...initialDraft },
            verifiedTravelers: s.verifiedTravelers + 1,
          }))
          await get().hydrate()
          return
        }
        const draft = { ...get().draft, plan, billing }
        const user = {
          id: `u-${Date.now()}`,
          email: draft.email,
          password: draft.password,
          name: draft.name,
          username: draft.username,
          age: calcAge(draft.dob),
          country: draft.country,
          city: draft.city || 'Lisbon',
          lat: draft.lat,
          lng: draft.lng,
          photo: draft.photo || `https://i.pravatar.cc/480?u=${encodeURIComponent(draft.email || 'new-traveler')}`,
          bio: 'New here, say hi!',
          verified: true,
          private: false,
          language: 'en',
          notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
          devicePermissions: { ...DEFAULT_DEVICE_PERMISSIONS },
          adPreferences: { ...DEFAULT_AD_PREFERENCES },
          plan,
          billing: plan === 'subscription' ? billing : null,
          tripStart: draft.tripStart,
          tripEnd: draft.tripEnd,
        }
        set((s) => ({
          currentUser: user,
          existingUsers: [...s.existingUsers, user],
          auth: 'active',
          draft: { ...initialDraft },
          verifiedTravelers: s.verifiedTravelers + 1,
        }))
      },

      skipPlanAndFinish: async () => {
        if (isBackendConfigured) {
          const draft = { ...get().draft, plan: null, billing: null }
          const profile = await profilesApi.signUp(draft)
          set({ currentUser: profile, auth: 'active', draft: { ...initialDraft } })
          await get().hydrate()
          return
        }
        const draft = get().draft
        const user = {
          id: `u-${Date.now()}`,
          email: draft.email,
          password: draft.password,
          name: draft.name,
          username: draft.username,
          age: calcAge(draft.dob),
          country: draft.country,
          city: draft.city || 'Lisbon',
          lat: draft.lat,
          lng: draft.lng,
          photo: draft.photo || `https://i.pravatar.cc/480?u=${encodeURIComponent(draft.email || 'new-traveler')}`,
          bio: 'New here, say hi!',
          verified: true,
          private: false,
          language: 'en',
          notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
          devicePermissions: { ...DEFAULT_DEVICE_PERMISSIONS },
          adPreferences: { ...DEFAULT_AD_PREFERENCES },
          plan: null,
          billing: null,
          tripStart: draft.tripStart || '',
          tripEnd: draft.tripEnd || '',
        }
        set((s) => ({
          currentUser: user,
          existingUsers: [...s.existingUsers, user],
          auth: 'active',
          draft: { ...initialDraft },
        }))
      },

      renewTrip: async (tripStart, tripEnd) => {
        if (isBackendConfigured) {
          const updated = await profilesApi.updateProfile(get().currentUser.id, {
            tripStart,
            tripEnd,
            plan: 'trip',
          })
          set((s) => ({ currentUser: updated, verifiedTravelers: s.verifiedTravelers + 1 }))
          return
        }
        set((s) => ({
          currentUser: { ...s.currentUser, tripStart, tripEnd, plan: 'trip' },
          verifiedTravelers: s.verifiedTravelers + 1,
        }))
      },

      upgradeToSubscription: async (billing) => {
        if (isBackendConfigured) {
          const updated = await profilesApi.updateProfile(get().currentUser.id, {
            plan: 'subscription',
            billing,
          })
          set((s) => ({ currentUser: updated, verifiedTravelers: s.verifiedTravelers + 1 }))
          return
        }
        set((s) => ({
          currentUser: { ...s.currentUser, plan: 'subscription', billing },
          verifiedTravelers: s.verifiedTravelers + 1,
        }))
      },

      signOut: async () => {
        if (isBackendConfigured) await profilesApi.signOut()
        set({ auth: 'signed-out', currentUser: null, draft: { ...initialDraft } })
      },

      updateProfile: async ({ photo, bio }) => {
        if (isBackendConfigured) {
          const updated = await profilesApi.updateProfile(get().currentUser.id, { photo, bio })
          set({ currentUser: updated })
          return
        }
        set((s) => ({
          currentUser: { ...s.currentUser, photo, bio },
          existingUsers: s.existingUsers.map((u) =>
            u.id === s.currentUser.id ? { ...u, photo, bio } : u,
          ),
        }))
      },

      // Merges `patch` into currentUser. In mock mode also keeps the matching
      // existingUsers entry in sync so the change survives a future sign-in.
      updateCurrentUser: async (patch) => {
        if (isBackendConfigured) {
          const updated = await profilesApi.updateProfile(get().currentUser.id, patch)
          set({ currentUser: updated })
          return
        }
        set((s) => ({
          currentUser: { ...s.currentUser, ...patch },
          existingUsers: s.existingUsers.map((u) =>
            u.id === s.currentUser.id ? { ...u, ...patch } : u,
          ),
        }))
      },

      setAccountPrivacy: (isPrivate) => get().updateCurrentUser({ private: isPrivate }),

      setLanguage: (language) => get().updateCurrentUser({ language }),

      setNotificationPref: (key, value) => {
        const current = get().currentUser
        get().updateCurrentUser({
          notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS, ...current.notificationPrefs, [key]: value },
        })
      },

      setDevicePermission: (key, value) => {
        const current = get().currentUser
        get().updateCurrentUser({
          devicePermissions: { ...DEFAULT_DEVICE_PERMISSIONS, ...current.devicePermissions, [key]: value },
        })
      },

      setAdPreference: (key, value) => {
        const current = get().currentUser
        get().updateCurrentUser({
          adPreferences: { ...DEFAULT_AD_PREFERENCES, ...current.adPreferences, [key]: value },
        })
      },

      changePassword: async (currentPassword, newPassword) => {
        if (isBackendConfigured) {
          return profilesApi.changePassword(get().currentUser.email, currentPassword, newPassword)
        }
        const user = get().currentUser
        if (user.password !== currentPassword) {
          return { ok: false, error: 'Current password is incorrect.' }
        }
        await get().updateCurrentUser({ password: newPassword })
        return { ok: true }
      },

      archivePost: async (postId) => {
        if (isBackendConfigured) {
          await postsApi.setPostArchived(postId, true)
          set({ posts: await postsApi.listPosts() })
          return
        }
        set((s) => ({
          posts: s.posts.map((p) => (p.id === postId ? { ...p, archived: true } : p)),
        }))
      },

      unarchivePost: async (postId) => {
        if (isBackendConfigured) {
          await postsApi.setPostArchived(postId, false)
          set({ posts: await postsApi.listPosts() })
          return
        }
        set((s) => ({
          posts: s.posts.map((p) => (p.id === postId ? { ...p, archived: false } : p)),
        }))
      },

      blockUser: async (id) => {
        if (isBackendConfigured) {
          await moderationApi.blockUser(get().currentUser.id, id)
        }
        set((s) => ({
          blockedIds: s.blockedIds.includes(id) ? s.blockedIds : [...s.blockedIds, id],
        }))
      },

      unblockUser: async (id) => {
        if (isBackendConfigured) {
          await moderationApi.unblockUser(get().currentUser.id, id)
        }
        set((s) => ({ blockedIds: s.blockedIds.filter((x) => x !== id) }))
      },

      reportUser: async (id, reason) => {
        if (isBackendConfigured) {
          await moderationApi.reportUser(get().currentUser.id, id, reason)
        }
        set((s) => ({
          reports: [
            ...s.reports,
            { id: `report-${Date.now()}`, targetId: id, reason, at: new Date().toISOString() },
          ],
        }))
      },

      swipe: async (travelerId, liked) => {
        if (isBackendConfigured) {
          const userId = get().currentUser.id
          const { matched } = await matchesApi.swipe(userId, travelerId, liked)
          if (liked) {
            set((s) => ({
              likedIds: [...s.likedIds, travelerId],
              matches: matched ? [...s.matches, travelerId] : s.matches,
            }))
            if (matched) {
              const s = get()
              const traveler = s.travelers.find((t) => t.id === travelerId)
              const threadId = `match-${travelerId}`
              if (traveler && !s.threads[threadId]) {
                set((st) => ({
                  threads: {
                    ...st.threads,
                    [threadId]: {
                      id: threadId,
                      type: 'match',
                      name: traveler.name,
                      photo: traveler.photo,
                      messages: [],
                    },
                  },
                }))
              }
            }
          } else {
            set((s) => ({ passedIds: [...s.passedIds, travelerId] }))
          }
          return
        }
        const s = get()
        if (liked) {
          set({
            likedIds: [...s.likedIds, travelerId],
            matches: [...s.matches, travelerId],
          })
          const traveler = s.travelers.find((t) => t.id === travelerId)
          const threadId = `match-${travelerId}`
          if (traveler && !s.threads[threadId]) {
            set((st) => ({
              threads: {
                ...st.threads,
                [threadId]: {
                  id: threadId,
                  type: 'match',
                  name: traveler.name,
                  photo: traveler.photo,
                  messages: [],
                },
              },
            }))
          }
        } else {
          set({ passedIds: [...s.passedIds, travelerId] })
        }
      },

      undoLastSwipe: async () => {
        const s = get()
        const lastLiked = s.likedIds[s.likedIds.length - 1]
        const lastPassed = s.passedIds[s.passedIds.length - 1]
        if (isBackendConfigured) {
          const userId = s.currentUser.id
          if (lastLiked) {
            await matchesApi.undoSwipe(userId, lastLiked)
            set({ likedIds: s.likedIds.slice(0, -1), matches: s.matches.filter((id) => id !== lastLiked) })
          } else if (lastPassed) {
            await matchesApi.undoSwipe(userId, lastPassed)
            set({ passedIds: s.passedIds.slice(0, -1) })
          }
          return
        }
        if (lastLiked) {
          set({
            likedIds: s.likedIds.slice(0, -1),
            matches: s.matches.filter((id) => id !== lastLiked),
          })
        } else if (lastPassed) {
          set({ passedIds: s.passedIds.slice(0, -1) })
        }
      },

      createGroup: async (data) => {
        if (isBackendConfigured) {
          const owner = get().currentUser
          const id = await groupsApi.createGroup(owner.id, data)
          const groups = await groupsApi.listGroups()
          set((s) => ({ groups, meetupsThisYear: s.meetupsThisYear + 1 }))
          return id
        }
        const s = get()
        const owner = s.currentUser
        const id = `g-${Date.now()}`
        const group = {
          id,
          name: data.name,
          nationality: data.nationality,
          city: data.city,
          date: data.date,
          description: data.description,
          ownerId: owner.id,
          members: [owner.id],
          pendingRequests: [],
          ratings: [],
        }
        set({ groups: [group, ...s.groups], meetupsThisYear: s.meetupsThisYear + 1 })
        return id
      },

      requestToJoin: async (groupId) => {
        if (isBackendConfigured) {
          await groupsApi.requestToJoin(groupId, get().currentUser.id)
          set({ groups: await groupsApi.listGroups() })
          return
        }
        const s = get()
        const uid = s.currentUser.id
        set({
          groups: s.groups.map((g) =>
            g.id === groupId && !g.members.includes(uid) && !g.pendingRequests.includes(uid)
              ? { ...g, pendingRequests: [...g.pendingRequests, uid] }
              : g,
          ),
        })
      },

      acceptRequest: async (groupId, userId) => {
        if (isBackendConfigured) {
          await groupsApi.acceptRequest(groupId, userId)
          set({ groups: await groupsApi.listGroups() })
          return
        }
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  members: [...g.members, userId],
                  pendingRequests: g.pendingRequests.filter((id) => id !== userId),
                }
              : g,
          ),
        }))
      },

      declineRequest: async (groupId, userId) => {
        if (isBackendConfigured) {
          await groupsApi.declineRequest(groupId, userId)
          set({ groups: await groupsApi.listGroups() })
          return
        }
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId
              ? { ...g, pendingRequests: g.pendingRequests.filter((id) => id !== userId) }
              : g,
          ),
        }))
      },

      kickMember: async (groupId, userId) => {
        if (isBackendConfigured) {
          await groupsApi.kickMember(groupId, userId)
          set({ groups: await groupsApi.listGroups() })
          return
        }
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId
              ? { ...g, members: g.members.filter((id) => id !== userId) }
              : g,
          ),
        }))
      },

      leaveGroup: async (groupId) => {
        const uid = get().currentUser?.id
        if (isBackendConfigured) {
          await groupsApi.leaveGroup(groupId, uid)
          set({ groups: await groupsApi.listGroups() })
          return
        }
        set((s) => ({
          groups: s.groups.map((g) =>
            g.id === groupId ? { ...g, members: g.members.filter((id) => id !== uid) } : g,
          ),
        }))
      },

      rateGroup: async (groupId, rating, comment) => {
        const uid = get().currentUser?.id
        if (isBackendConfigured) {
          await groupsApi.rateGroup(groupId, uid, rating, comment)
          set({ groups: await groupsApi.listGroups() })
          return
        }
        set((s) => ({
          groups: s.groups.map((g) => {
            if (g.id !== groupId) return g
            const existing = (g.ratings || []).filter((r) => r.userId !== uid)
            return {
              ...g,
              ratings: [...existing, { userId: uid, rating, comment, at: new Date().toISOString() }],
            }
          }),
        }))
      },

      sendMessage: async (threadId, text) => {
        if (isBackendConfigured) {
          const otherId = threadId.replace(/^match-/, '')
          await messagesApi.sendMessage(get().currentUser.id, otherId, text)
          const threads = await messagesApi.listConversations(get().currentUser.id)
          set({ threads: Object.fromEntries(threads.map((t) => [t.id, t])) })
          return
        }
        set((s) => {
          const thread = s.threads[threadId]
          if (!thread) return s
          const msg = { id: `m-${Date.now()}`, from: 'me', text, at: new Date().toISOString() }
          return {
            threads: { ...s.threads, [threadId]: { ...thread, messages: [...thread.messages, msg] } },
          }
        })
      },

      createPost: async ({ photo, caption }) => {
        const uid = get().currentUser?.id
        if (isBackendConfigured) {
          const id = await postsApi.createPost(uid, { photo, caption })
          set({ posts: await postsApi.listPosts() })
          return id
        }
        const post = {
          id: `post-${Date.now()}`,
          authorId: uid,
          photo,
          caption,
          likedBy: [],
          comments: [],
          at: new Date().toISOString(),
        }
        set((s) => ({ posts: [post, ...s.posts] }))
        return post.id
      },

      deletePost: async (postId) => {
        if (isBackendConfigured) {
          await postsApi.deletePost(postId)
          set({ posts: await postsApi.listPosts() })
          return
        }
        set((s) => ({ posts: s.posts.filter((p) => p.id !== postId) }))
      },

      toggleLikePost: async (postId) => {
        const uid = get().currentUser?.id
        if (isBackendConfigured) {
          const post = get().posts.find((p) => p.id === postId)
          await postsApi.toggleLikePost(postId, uid, !!post?.likedBy.includes(uid))
          set({ posts: await postsApi.listPosts() })
          return
        }
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p
            const liked = p.likedBy.includes(uid)
            return {
              ...p,
              likedBy: liked ? p.likedBy.filter((id) => id !== uid) : [...p.likedBy, uid],
            }
          }),
        }))
      },

      addPostComment: async (postId, text) => {
        const uid = get().currentUser?.id
        if (isBackendConfigured) {
          await postsApi.addPostComment(postId, uid, text)
          set({ posts: await postsApi.listPosts() })
          return
        }
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  comments: [
                    ...p.comments,
                    { id: `pc-${Date.now()}`, authorId: uid, text, at: new Date().toISOString() },
                  ],
                }
              : p,
          ),
        }))
      },

      deleteMyData: async () => {
        const s = get()
        if (isBackendConfigured) {
          await profilesApi.deleteMyProfile(s.currentUser.id)
          set({
            currentUser: null,
            auth: 'signed-out',
            draft: { ...initialDraft },
            matches: [],
            likedIds: [],
            passedIds: [],
            blockedIds: [],
            reports: [],
          })
          return
        }
        set({
          existingUsers: s.existingUsers.filter((u) => u.id !== s.currentUser?.id),
          posts: s.posts.filter((p) => p.authorId !== s.currentUser?.id),
          currentUser: null,
          auth: 'signed-out',
          draft: { ...initialDraft },
          matches: [],
          likedIds: [],
          passedIds: [],
          blockedIds: [],
          reports: [],
        })
      },
    }),
    { name: 'natio-store-v1' },
  ),
)

export async function isUsernameTaken(state, username) {
  if (isBackendConfigured) {
    return profilesApi.isUsernameTaken(username)
  }
  const normalized = username.trim().toLowerCase()
  return state.existingUsers.some((u) => u.username?.toLowerCase() === normalized)
}

export function findPersonById(state, id) {
  if (state.currentUser?.id === id) return state.currentUser
  return (
    state.travelers.find((t) => t.id === id) ||
    state.existingUsers.find((u) => u.id === id) ||
    null
  )
}

const TRIP_PASS_MAX_DAYS = 14

// A Trip Pass is valid for the traveler's self-reported trip, but caps out at
// 14 days from arrival even if the trip runs longer ("cancels after more
// than 2 weeks"). Whichever comes first — the reported departure date, or
// the 14-day cap from arrival — is when the pass actually expires.
export function tripPassExpiry(user) {
  if (!user || user.plan !== 'trip' || !user.tripStart || !user.tripEnd) return null
  const start = new Date(user.tripStart)
  const cappedAt = new Date(start)
  cappedAt.setDate(cappedAt.getDate() + TRIP_PASS_MAX_DAYS)
  const reportedEnd = new Date(user.tripEnd)
  return reportedEnd < cappedAt ? reportedEnd : cappedAt
}

export function isTripCapped(user) {
  if (!user || user.plan !== 'trip' || !user.tripStart || !user.tripEnd) return false
  const tripLengthDays = (new Date(user.tripEnd) - new Date(user.tripStart)) / (1000 * 60 * 60 * 24)
  return tripLengthDays > TRIP_PASS_MAX_DAYS
}

export function isTripLocked(user) {
  const expiry = tripPassExpiry(user)
  if (!expiry) return false
  return expiry.getTime() < Date.now()
}

// Full access (Discover, Groups, unlimited Search) requires a paid plan that
// hasn't expired. Users who skipped payment (plan is null) get a limited,
// free tier instead of being treated as "unlocked."
export function hasAccess(user) {
  if (!user?.plan) return false
  return !isTripLocked(user)
}
