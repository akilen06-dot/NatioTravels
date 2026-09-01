# Going live: setup guide

This app runs today with **zero setup** — everything is local mock data. Each
section below is independent and optional: add its keys to `.env.local` and
that piece switches from mock to real. Skip a section and that part keeps
working exactly like the prototype did.

Copy the template first:

```bash
cp .env.example .env.local
```

Restart `npm run dev` after editing `.env.local` (Vite only reads env files on startup).

---

## Real ID + face verification (works out of the box, no setup)

Unlike the other phases, this one needs no account, no API key, and no `.env.local` change —
it's on right now. `/onboarding/verify` and `/onboarding/face-scan` do real work:

- **ID photo**: "Take photo" opens your real camera; "Upload from gallery" reads a real file.
- **Face scan**: opens your real camera, then extracts a face descriptor from the live feed and
  from your ID photo using [`@vladmandic/face-api`](https://github.com/vladmandic/face-api)
  (runs fully in the browser via TensorFlow.js — no server, no third party ever sees the photos)
  and compares them. It only proceeds past the face-scan step on a real match.

A few things worth knowing:
- The model files live in `public/models/` (~6.9MB, committed to the repo). They're fetched
  once and cached by the browser after that.
- **The very first scan on a fresh page load is noticeably slower** (TF.js has to compile its
  WebGL shaders the first time each model runs) — that's expected, not a bug. There's no timeout
  on the "Checking…" state, so it just finishes when it finishes.
- Camera access requires HTTPS (or `localhost`) — this is a browser security rule, not something
  in this app's control. It'll work fine both in local dev and once deployed to Vercel (which is
  HTTPS by default), but wouldn't work over plain `http://` on a real domain.
- What this still doesn't do: verify the ID document itself is authentic (that it's a real
  passport/ID and not a photo of a photo, edited, expired, etc.) — it only confirms the face in
  front of the camera matches the face in the photo you provided. Real document authenticity
  checking needs a KYC vendor (Persona, Onfido, Veriff) and is a separate, bigger integration.

---

## Phase 1 — Database & real accounts (Supabase)

1. Go to [supabase.com](https://supabase.com), create a free account and a new project.
2. In the project dashboard, open **SQL Editor → New query**, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. In **Project Settings → API**, copy the **Project URL** and the **anon public** key into
   `.env.local`:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. Restart the dev server. Sign up a real account through the app's own `/signup` flow to
   confirm it's working — check **Table Editor → profiles** in the Supabase dashboard for the
   new row.

### Forgot-password emails

"Forgot password?" on the sign-in page (`/forgot-password`, `/reset-password`) uses Supabase
Auth's built-in password-reset email — no extra service to set up. One thing you do need to do:

1. In the dashboard, go to **Authentication → URL Configuration**.
2. Add `http://localhost:5173/reset-password` (and your production URL's `/reset-password`, once
   deployed) to **Redirect URLs**. Supabase refuses to redirect anywhere not on this list, so
   without it the emailed link won't be able to bring the user back into the app.

Supabase's default email templates work out of the box (a few free sends/hour on the free tier)
— fine for testing. For real volume later, you'd connect a custom SMTP provider in
**Authentication → Settings**, same section.

### If you tested matching before this fix

An earlier version of `schema.sql` had an RLS bug that made it impossible for the app to detect
a real mutual match — swipes saved fine, but a match/conversation never got created. If any real
users tried to match before you applied the fix, run
[`supabase/backfill-missed-matches.sql`](supabase/backfill-missed-matches.sql) once in the SQL
Editor — it finds any pair with reciprocal likes and creates the match/conversation they should
have gotten. Safe to run more than once; new matches going forward don't need this.

### Recreating the demo accounts (optional)

The mock demo accounts (Maria/James/Elena + the 6 seed travelers) aren't real logins until you
run the seed script — it uses Supabase's admin API, which plain SQL can't do (creating an
`auth.users` row needs the Auth service, not a table insert).

1. In **Project Settings → API**, copy the **service_role** key (⚠️ this key bypasses all
   security rules — never put it in frontend code or commit it anywhere).
2. Create `supabase/.env.seed` (already gitignored):
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   SEED_CONFIRM=yes-seed-this-dev-project
   ```
   That `SEED_CONFIRM` line is a deliberate safety catch — the script refuses to run without it, and separately refuses to run at all if it finds any real (non-seed) profiles already in the project, since that means real people may have signed up. Never run this against a project real users are on.
3. Run it once:
   ```bash
   node --env-file=supabase/.env.seed supabase/seed.mjs
   ```
4. Sign in with any of the printed emails (e.g. `maria@example.com`) and password `password123`.

### Before you actually launch: remove the seed data

Every profile `seed.mjs` creates is flagged `is_seed_data = true` specifically so you can find and
remove it later. Once you're ready for real users, delete it all — both the fake logins and
everything that cascades from them (their matches, messages, groups, posts):

```bash
# add CLEANUP_CONFIRM=yes-delete-seed-data to supabase/.env.seed first
node --env-file=supabase/.env.seed supabase/cleanup-seed-data.mjs
```

Real accounts (anything with `is_seed_data = false`) are never touched by this.

---

## Phase 2 — Deploying the site (Vercel)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com), sign up, and **Import Project** from your GitHub repo.
3. Under **Environment Variables**, add the same variables from your `.env.local`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and any others you've configured).
4. Deploy. `vercel.json` is already set up so client-side routes (like `/discover`) don't 404 on
   refresh.

---

## Phase 3 — Real location (OpenCage)

1. Go to [opencagedata.com](https://opencagedata.com), create a free account, and copy your API key.
2. Add to `.env.local`:
   ```
   VITE_GEOCODING_API_KEY=your-key-here
   ```
3. Restart the dev server. Go through onboarding and tap "Allow while using app" on the location
   screen — grant the browser's own location permission prompt when it appears. Your city should
   be filled in automatically, and Discover will show real computed distances between users who've
   shared their location (instead of the seeded numbers).

Without this key, location permission still prompts and the app still works — it just keeps
using the country you typed at signup and the seeded distance numbers.

---

## Phase 4 — Real billing (Stripe)

This is the most involved piece, since it needs Edge Functions deployed alongside your database.

1. Go to [stripe.com](https://stripe.com) and create an account (you can do everything below in
   **test mode** without any business verification).
2. In the Stripe Dashboard, create three Products/Prices:
   - "Trip Pass" — one-time, $9.99
   - "Frequent Traveler Monthly" — recurring monthly, $16.99
   - "Frequent Traveler Annual" — recurring yearly, $142.99
   Copy each **Price ID** (`price_...`).
3. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and log in, then from the
   `haven-app` folder:
   ```bash
   supabase link --project-ref your-project-ref
   supabase secrets set STRIPE_SECRET_KEY=sk_test_... \
     STRIPE_PRICE_TRIP=price_... \
     STRIPE_PRICE_MONTHLY=price_... \
     STRIPE_PRICE_ANNUAL=price_... \
     SITE_URL=http://localhost:5173
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
4. In the Stripe Dashboard, go to **Developers → Webhooks → Add endpoint**, point it at your
   deployed `stripe-webhook` function's URL, and select these events: `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`. Copy the **Signing secret**
   and set it too:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```
5. Add the publishable key to `.env.local` (this one, unlike the others above, is safe in
   frontend code — it's meant to be public):
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
6. Restart the dev server, go to `/onboarding/plan`, and pay with Stripe's test card
   `4242 4242 4242 4242`, any future expiry, any CVC. Confirm the `plan` column updates on your
   `profiles` row in Supabase after the redirect back.

**Going live (real charges) is a decision only you can make** — it needs your own verified
Stripe business account and switching from `sk_test_.../pk_test_...` keys to live ones. Nothing
in this codebase does that automatically.

---

## What's still simulated, even with everything above configured

- **Face matching is real** (see the section above), but **document authenticity is not** — the
  app confirms the live face matches the ID photo, not that the ID itself is a genuine,
  unaltered, unexpired passport/ID. A real version of that needs a KYC vendor like Persona,
  Onfido, or Veriff, plus a compliance review.
- **Deleting your account** removes your `profiles` row (and everything that cascades from it),
  but doesn't delete the underlying Supabase Auth user — that needs a service-role action, which
  would be a small additional Edge Function.
- **Private accounts** are enforced in the UI (hiding bio/posts from non-matches), not at the
  database (RLS) level yet — a determined API caller could still read a private profile's row.
  Tightening this is a good next step once the basics above are working.
