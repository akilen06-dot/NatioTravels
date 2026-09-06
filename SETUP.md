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

## Real ID capture (works out of the box, no setup)

Unlike the other phases, this one needs no account, no API key, and no `.env.local` change —
it's on right now. `/onboarding/verify` does real work:

- **ID photo**: "Take photo" opens your real camera; "Upload from gallery" reads a real file.

A few things worth knowing:
- Camera access requires HTTPS (or `localhost`) — this is a browser security rule, not something
  in this app's control. It'll work fine both in local dev and once deployed to Vercel (which is
  HTTPS by default), but wouldn't work over plain `http://` on a real domain.
- What this still doesn't do: verify the ID document itself is authentic (that it's a real
  passport/ID and not a photo of a photo, edited, expired, etc.), or that it belongs to the
  person signing up. Real document authenticity checking needs a KYC vendor (Persona, Onfido,
  Veriff) and is a separate, bigger integration. An earlier version of this app also did a live
  face scan against the ID photo (client-side face matching); it was removed because it didn't
  reliably confirm anything a KYC vendor wouldn't do properly — the ID photo capture above is
  what remains.

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

### Notifications, message attachments, group deletion

These landed after the initial schema — if your project's SQL Editor hasn't run the latest
`schema.sql` yet, re-run the whole file (safe/idempotent, same as always). It adds:
- A `notifications` table (likes, right-swipes, messages) with a Realtime publication, so a
  toast can pop up live while the app is open — no extra dashboard step needed, the SQL enables
  it itself.
- `attachment_url`/`attachment_type`/`attachment_name` columns on `messages`, for photo/file
  sends in chat.
- Nothing new for group deletion — the owner-can-delete policy was already part of the original
  schema, only the app UI to trigger it was missing.

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

## Phase 4 — Real billing (Paddle)

This is the most involved piece, since it needs Edge Functions deployed alongside your database.
Paddle's **sandbox** is a fully separate environment from production — its own dashboard, its own
API host, its own test data — rather than a "test mode" toggle on one account like Stripe's, so pay
attention to which one you're in at each step below.

1. Go to [paddle.com](https://paddle.com), create an account, and switch to the **Sandbox**
   environment (there's a toggle in the dashboard) — no business verification needed there.
2. In the Sandbox Dashboard, create three Products, each with one Price:
   - "Trip Pass" — one-time (non-recurring), $9.99
   - "Frequent Traveler Monthly" — recurring monthly, $16.99
   - "Frequent Traveler Annual" — recurring yearly, $142.99
   Copy each **Price ID** (`pri_...`).
3. In **Developer Tools → Authentication**, copy your sandbox **API key** (`Bearer` key, starts
   with a long string — this is `PADDLE_API_KEY`) and your **client-side token** (starts with
   `test_` in sandbox — this is `VITE_PADDLE_CLIENT_TOKEN`).
4. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and log in, then from the
   `haven-app` folder:
   ```bash
   supabase link --project-ref your-project-ref
   supabase secrets set PADDLE_API_KEY=... \
     PADDLE_ENVIRONMENT=sandbox \
     PADDLE_PRICE_TRIP=pri_... \
     PADDLE_PRICE_MONTHLY=pri_... \
     PADDLE_PRICE_ANNUAL=pri_...
   supabase functions deploy create-paddle-transaction
   supabase functions deploy paddle-webhook --no-verify-jwt
   ```
5. In the Sandbox Dashboard, go to **Developer Tools → Notifications → Add destination**, point it
   at your deployed `paddle-webhook` function's URL, and select these events: `transaction.completed`,
   `subscription.created`, `subscription.updated`, `subscription.canceled`. Copy the destination's
   **secret key** (`pdl_ntfset_...`) and set it too:
   ```bash
   supabase secrets set PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
   ```
6. Add the client-side token to `.env.local` (this one, unlike the API key, is safe in frontend
   code — it's meant to be public):
   ```
   VITE_PADDLE_CLIENT_TOKEN=test_...
   VITE_PADDLE_ENVIRONMENT=sandbox
   ```
7. Restart the dev server, go to `/onboarding/plan`, and pay with Paddle's sandbox test card
   `4242 4242 4242 4242`, any name, any future expiry, any CVC. Confirm the `plan` column updates
   on your `profiles` row in Supabase after the checkout closes and redirects back.

**Going live (real charges) is a decision only you can make** — it needs your own verified Paddle
account (separate approval from sandbox), switching to the **production** dashboard and its own
API key/client-side token/webhook destination, and setting `PADDLE_ENVIRONMENT=production` plus
`VITE_PADDLE_ENVIRONMENT=production`. Nothing in this codebase does that automatically.

---

## Phase 5 — Error monitoring (Sentry)

Without this, a crash in the app is invisible to you — you'd only find out from a user
complaining. With it, you get an alert the moment something actually breaks in production.

1. Go to [sentry.io](https://sentry.io), create a free account, and create a new project — pick
   **React** as the platform.
2. Copy the **DSN** it gives you (looks like `https://abc123@o000000.ingest.sentry.io/000000`).
3. Add it to `.env.local`:
   ```
   VITE_SENTRY_DSN=https://...
   ```
4. Restart the dev server (or redeploy on Vercel — add the same variable there too).

That's it — no Edge Function changes needed. This only tracks frontend crashes (a screen breaking,
an unhandled error) — it doesn't add performance monitoring or session replay, to keep it
lightweight. Errors inside the Paddle Edge Functions are already visible in Supabase's own
**Edge Functions → Logs** tab (see the "Notifications, message attachments, group deletion"
section above), so they aren't duplicated into Sentry too.

Without a DSN set, the app behaves exactly as it does today — nothing to configure, nothing
breaks.

---

## Report alerts (email you when someone gets reported)

Right now, reports land in the `reports` table with nothing else happening — you'd only see one
by opening Table Editor yourself. This wires up an email to you the moment someone submits one.

1. Go to [resend.com](https://resend.com) and create a free account — **sign up using
   `natiotravel@gmail.com`** (or whichever inbox you want alerts sent to). This matters: Resend's
   test sending address (`onboarding@resend.dev`, no setup required) can only deliver to the
   email the account itself was created with. Sign up with a different email and these alerts
   won't arrive until you verify your own domain with Resend instead.
2. In the Resend dashboard, copy your **API key** (starts with `re_`).
3. From the `haven-app` folder:
   ```bash
   supabase secrets set RESEND_API_KEY=re_... \
     ADMIN_EMAIL=natiotravel@gmail.com \
     REPORT_ALERT_SECRET=some-long-random-string-you-make-up
   supabase functions deploy send-report-alert --no-verify-jwt
   ```
   `REPORT_ALERT_SECRET` can be anything — it's just a shared password so the function can tell a
   real Database Webhook call apart from a random request. Make it long and don't reuse it
   elsewhere.
4. Wire up the trigger that actually calls the function on every new report. **Database →
   Webhooks** has moved around across dashboard versions and can be hard to find, so this is done
   as plain SQL instead — same result either way:
   - Open [`supabase/report-alert-webhook.sql`](supabase/report-alert-webhook.sql).
   - Replace `YOUR_REPORT_ALERT_SECRET` with the exact same string you used for
     `REPORT_ALERT_SECRET` above.
   - Paste the whole thing into the SQL Editor and run it. **Don't commit your edited copy with
     the real secret in it** — only paste it into the SQL Editor, leave the file in git with the
     placeholder.

   (If you do manage to find **Database → Webhooks** in your dashboard, that works too — table
   `reports`, event `Insert`, pointed at `send-report-alert`, with an `x-report-alert-secret`
   header. The SQL above does the identical thing either way.)
5. Test it: submit a report on a profile in the app (the flag icon → Report), then check the
   `natiotravel@gmail.com` inbox — you should get an email within a few seconds naming the
   reporter, the reported person, and the reason.

If the email never arrives, check **Edge Functions → send-report-alert → Logs** in the dashboard
first — it'll show whether the webhook even reached the function, and whether Resend's API
rejected the send (most likely cause: signed up with a different email than `ADMIN_EMAIL`, so
`onboarding@resend.dev` refused to deliver).

---

## Rate limiting & abuse prevention

Two layers, one you configure in a dashboard and one already built into `schema.sql`.

**Sign-ups** — Supabase has its own configurable limit: **Authentication → Rate Limits** in your
dashboard, under "Rate limit for sign-ups and sign-ins". Worth setting a sane cap per hour once
you have real users. (Note: Supabase's own docs and community have flagged this setting as not
always perfectly enforced — treat it as one layer, not a guarantee.)

**Messages, swipes, reports, and post comments** — enforced directly in the database via triggers
in `schema.sql` (re-run it if you haven't since this was added). Each one raises a friendly error
if the same person tries to insert too many rows too quickly — generous enough that no real
person doing normal things should ever hit them, but enough to stop a script from blasting
hundreds of messages/swipes/reports a minute. Because it's enforced in Postgres itself, it can't
be bypassed by calling the API directly instead of going through the app.

---

## What's still simulated, even with everything above configured

- **ID document authenticity** — the app captures a passport/ID photo (see the section above) but
  does not verify it's a genuine, unaltered, unexpired document, or that it belongs to the person
  signing up. A real version of that needs a KYC vendor like Persona, Onfido, or Veriff, plus a
  compliance review.
- **Deleting your account** removes your `profiles` row (and everything that cascades from it),
  but doesn't delete the underlying Supabase Auth user — that needs a service-role action, which
  would be a small additional Edge Function.
- **Private accounts** are enforced in the UI (hiding bio/posts from non-matches), not at the
  database (RLS) level yet — a determined API caller could still read a private profile's row.
  Tightening this is a good next step once the basics above are working.
