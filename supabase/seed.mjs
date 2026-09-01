// Natio — demo data seed script (Phase 1)
//
// Run this ONCE after applying schema.sql, to recreate today's mock demo
// accounts (Maria/James/Elena + travelers Priya/Mateus/Freya/Kenji/Aroha/Diego)
// as real Supabase Auth users + profiles, plus their groups/posts/one sample
// match+conversation — so the existing demo flow still works against the real
// backend. See SETUP.md for the exact command.
//
// This uses the SERVICE ROLE key (bypasses RLS, can create auth users) and
// must never run in the browser or ship to the frontend — it's a one-time
// local/admin script only.
//
// SAFETY: this writes fake placeholder people into your database. Never run
// it against a project real users are already signed up on — mixing fake
// profiles into a live product is a trust problem (and the kind of thing
// that draws regulatory scrutiny for dating/meetup apps). Two gates below
// enforce that:
//   1. You must set SEED_CONFIRM to the exact phrase shown in the error.
//   2. If the project already has any real (non-seed) profiles, it refuses
//      to run at all — that's a strong signal this isn't a fresh dev project.

import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Run with: node --env-file=supabase/.env.seed supabase/seed.mjs\n' +
      '(see SETUP.md for how to create supabase/.env.seed)',
  )
  process.exit(1)
}

const CONFIRM_PHRASE = 'yes-seed-this-dev-project'
if (process.env.SEED_CONFIRM !== CONFIRM_PHRASE) {
  console.error(
    `This script writes fake demo profiles into ${url}.\n` +
      'Only run it against a fresh dev/staging project — never one real users are on.\n' +
      `To proceed, re-run with SEED_CONFIRM=${CONFIRM_PHRASE} set in supabase/.env.seed.`,
  )
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { count: realProfileCount, error: countErr } = await supabase
  .from('profiles')
  .select('id', { count: 'exact', head: true })
  .eq('is_seed_data', false)
if (countErr) {
  console.error('Could not check for existing real profiles:', countErr.message)
  process.exit(1)
}
if (realProfileCount > 0) {
  console.error(
    `Found ${realProfileCount} real (non-seed) profile(s) already in this project.\n` +
      "That means real people may have signed up — refusing to seed fake demo data here.\n" +
      'If this really is a fresh dev project and you\'re certain, delete those rows first.',
  )
  process.exit(1)
}

const PASSWORD = 'password123'

function daysFromNow(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

const people = [
  { key: 't1', email: 'priya@example.com', name: 'Priya', username: 'priya', country: 'India', city: 'Lisbon', photo: 'https://i.pravatar.cc/480?img=47', bio: 'Second week in Lisbon, looking for someone to explore Alfama with.' },
  { key: 't2', email: 'mateus@example.com', name: 'Mateus', username: 'mateus', country: 'Brazil', city: 'Lisbon', photo: 'https://i.pravatar.cc/480?img=13', bio: 'Surfer, here for a month. Down for football and pastel de nata runs.' },
  { key: 't3', email: 'freya@example.com', name: 'Freya', username: 'freya', country: 'Norway', city: 'Lisbon', photo: 'https://i.pravatar.cc/480?img=32', bio: 'Just landed. Coffee first, adventure second.' },
  { key: 't4', email: 'kenji@example.com', name: 'Kenji', username: 'kenji', country: 'Japan', city: 'Lisbon', photo: 'https://i.pravatar.cc/480?img=51', bio: 'Photographer on a career break. Always chasing the golden hour.' },
  { key: 't5', email: 'aroha@example.com', name: 'Aroha', username: 'aroha', country: 'New Zealand', city: 'Lisbon', photo: 'https://i.pravatar.cc/480?img=25', bio: 'Two months into a career break. Always up for hiking or wine.' },
  { key: 't6', email: 'diego@example.com', name: 'Diego', username: 'diego', country: 'Mexico', city: 'Lisbon', photo: 'https://i.pravatar.cc/480?img=59', bio: "Remote work, based here for the quarter. Know a good taco spot? Tell me." },
  { key: 'u-maria', email: 'maria@example.com', name: 'Maria Costa', username: 'maria.costa', country: 'Portugal', city: 'Berlin', photo: 'https://i.pravatar.cc/480?img=44', bio: 'Founder on a working trip. Coffee, co-working, and Saturday markets.', plan: 'subscription', billing: 'annual', tripStart: daysFromNow(-20), tripEnd: daysFromNow(15) },
  { key: 'u-james', email: 'james@example.com', name: 'James Whitfield', username: 'jwhitfield', country: 'United Kingdom', city: 'Bangkok', photo: 'https://i.pravatar.cc/480?img=68', bio: 'Two weeks in Bangkok. Street food and rooftop bars.', plan: 'trip', tripStart: daysFromNow(-20), tripEnd: daysFromNow(-6) },
  { key: 'u-elena', email: 'elena@example.com', name: 'Elena Popescu', username: 'elena.popescu', country: 'Romania', city: 'Chiang Mai', photo: 'https://i.pravatar.cc/480?img=48', bio: 'Six weeks in Chiang Mai for a change of scenery. Coworking by day.', plan: 'trip', tripStart: daysFromNow(-20), tripEnd: daysFromNow(10) },
]

async function upsertPerson(person) {
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: person.email,
    password: PASSWORD,
    email_confirm: true,
  })

  let userId
  if (createErr) {
    if (!createErr.message?.includes('already been registered')) {
      console.error(`Failed to create auth user for ${person.email}:`, createErr.message)
      return null
    }
    const { data: list } = await supabase.auth.admin.listUsers()
    userId = list.users.find((u) => u.email === person.email)?.id
    if (!userId) {
      console.error(`${person.email} already registered but couldn't be looked up.`)
      return null
    }
  } else {
    userId = created.user.id
  }

  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: userId,
    email: person.email,
    name: person.name,
    username: person.username,
    country: person.country,
    city: person.city,
    photo_url: person.photo,
    bio: person.bio,
    plan: person.plan ?? null,
    billing: person.billing ?? null,
    trip_start: person.tripStart ?? null,
    trip_end: person.tripEnd ?? null,
    is_seed_data: true,
  })
  if (profileErr) console.error(`Failed to upsert profile for ${person.email}:`, profileErr.message)

  return userId
}

async function main() {
  console.log('Creating demo accounts (password: "password123" for all)...')
  const ids = {}
  for (const person of people) {
    const id = await upsertPerson(person)
    if (id) ids[person.key] = id
    console.log(`  ${person.email} -> ${id ?? 'FAILED'}`)
  }

  console.log('Seeding groups...')
  const groups = [
    { key: 'g1', name: 'Aussies in Lisbon', nationality: 'Australia', city: 'Lisbon', date: daysFromNow(-3), description: 'Casual meetup for Aussies passing through. Drinks at a miradouro, then wherever the night goes.', ownerKey: 'u-maria', memberKeys: ['u-maria', 't3'], requestKeys: ['t5'] },
    { key: 'g2', name: 'Brazil Crew Lisbon', nationality: 'Brazil', city: 'Lisbon', date: '2026-09-10', description: 'Futevolei on the river, then churrasco. Bring your own chair.', ownerKey: 't2', memberKeys: ['t2', 't6'], requestKeys: [] },
    { key: 'g3', name: 'Japan House Lisbon', nationality: 'Japan', city: 'Lisbon', date: '2026-09-18', description: 'Photo walk through Alfama at golden hour, ramen after.', ownerKey: 't4', memberKeys: ['t4'], requestKeys: [] },
  ]
  for (const g of groups) {
    if (!ids[g.ownerKey]) continue
    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name: g.name, nationality: g.nationality, city: g.city, date: g.date, description: g.description, owner_id: ids[g.ownerKey] })
      .select()
      .single()
    if (error) {
      console.error(`Failed to create group ${g.name}:`, error.message)
      continue
    }
    for (const mk of g.memberKeys) {
      if (ids[mk]) await supabase.from('group_members').insert({ group_id: group.id, user_id: ids[mk] })
    }
    for (const rk of g.requestKeys) {
      if (ids[rk]) await supabase.from('group_join_requests').insert({ group_id: group.id, user_id: ids[rk] })
    }
  }

  console.log('Seeding posts, likes, and comments...')
  const posts = [
    { authorKey: 't3', photo: 'https://picsum.photos/seed/natio-post-freya-1/700/700', caption: 'First morning in Lisbon. Coffee at Miradouro was worth the climb.', likedByKeys: ['t1', 'u-maria'], comments: [{ authorKey: 't1', text: 'That view is unreal.' }, { authorKey: 't5', text: 'Which miradouro was this?' }] },
    { authorKey: 't3', photo: 'https://picsum.photos/seed/natio-post-freya-2/700/700', caption: 'Alfama at golden hour with the group from the meetup.', likedByKeys: ['t4'], comments: [{ authorKey: 't4', text: 'Great light in this one.' }] },
    { authorKey: 't2', photo: 'https://picsum.photos/seed/natio-post-mateus-1/700/700', caption: 'Futevolei on the river. My legs are done for.', likedByKeys: ['t6', 't3'], comments: [{ authorKey: 't6', text: 'Rematch next week.' }] },
    { authorKey: 't4', photo: 'https://picsum.photos/seed/natio-post-kenji-1/700/700', caption: 'Chasing the golden hour through Alfama.', likedByKeys: ['t3', 't1', 't5'], comments: [] },
    { authorKey: 't1', photo: 'https://picsum.photos/seed/natio-post-priya-1/700/700', caption: 'Second week here and still finding new streets in Alfama.', likedByKeys: [], comments: [] },
    { authorKey: 'u-maria', photo: 'https://picsum.photos/seed/natio-post-maria-1/700/700', caption: 'Saturday market run before a full day of calls.', likedByKeys: ['t3', 'u-james'], comments: [{ authorKey: 't3', text: 'That bread stall is the best one.' }] },
    { authorKey: 'u-elena', photo: 'https://picsum.photos/seed/natio-post-elena-1/700/700', caption: 'Six weeks in and I still cowork from this same balcony every morning.', likedByKeys: ['u-maria'], comments: [] },
  ]
  for (const p of posts) {
    if (!ids[p.authorKey]) continue
    const { data: post, error } = await supabase
      .from('posts')
      .insert({ author_id: ids[p.authorKey], photo_url: p.photo, caption: p.caption })
      .select()
      .single()
    if (error) {
      console.error('Failed to create post:', error.message)
      continue
    }
    for (const lk of p.likedByKeys) {
      if (ids[lk]) await supabase.from('post_likes').insert({ post_id: post.id, user_id: ids[lk] })
    }
    for (const c of p.comments) {
      if (ids[c.authorKey]) await supabase.from('post_comments').insert({ post_id: post.id, author_id: ids[c.authorKey], text: c.text })
    }
  }

  console.log('Seeding one sample match + conversation (Maria <-> Freya)...')
  if (ids['u-maria'] && ids['t3']) {
    const [a, b] = [ids['u-maria'], ids['t3']].sort()
    const { data: match } = await supabase.from('matches').upsert({ user_a: a, user_b: b }, { onConflict: 'user_a,user_b' }).select().single()
    const { data: convo } = await supabase.from('conversations').upsert({ user_a: a, user_b: b }, { onConflict: 'user_a,user_b' }).select().single()
    if (convo) {
      await supabase.from('messages').insert([
        { conversation_id: convo.id, sender_id: ids['t3'], text: "Hey! Saw we're both around this week." },
        { conversation_id: convo.id, sender_id: ids['u-maria'], text: 'Yes! Down for coffee tomorrow?' },
      ])
    }
    if (!match) console.error('Failed to create sample match.')
  }

  console.log('Done. Sign in with any of the emails above and password "password123".')
}

main()
