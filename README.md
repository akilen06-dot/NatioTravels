# Natio Travels (prototype)

A clickable UX prototype for a travel companion-matching app: meet verified travelers of your own nationality abroad, one-on-one or through group meetups.

## Running it

```bash
npm install
npm run dev
```

## What's real

- The full React app: routing, screens, component structure, design system.
- All UI state and interactions: signup/signin branching, swipe matching, group requests/accept/kick, messaging (including photo/file attachments), notifications (likes, right-swipes, messages — with live pop-ups once a real backend is configured), group deletion by its owner, plan selection, trip-expiry lockout.
- **ID verification**: real camera access to capture a passport/ID photo (or upload one) during onboarding — no setup required.
- Optionally real, each independently switched on by adding its own keys to `.env.local` (the app works with none of them set — see [SETUP.md](SETUP.md)):
  - **Database & accounts** — Supabase Postgres + Auth, replacing the mock in-memory store.
  - **Location** — real browser geolocation + reverse geocoding, real distances between users.
  - **Billing** — real Paddle checkout for Trip Pass / Frequent Traveler (sandbox mode).
  - **Error monitoring** — real Sentry crash reporting for the frontend.
  - **Report alerts** — an email to you the moment someone submits a report, via a Database
    Webhook and Resend.
  - **Email verification** — a real confirmation email sent via Resend after signup; soft (never
    blocks access), shown as a banner until confirmed.
- **Live chat** — an open conversation updates the instant the other person replies, via Supabase
  Realtime, once a real backend is configured.
- **Terms acceptance** — signup requires checking a box agreeing to the Terms & Privacy Policy
  before an account can be created.
- **Abuse prevention** — database-enforced rate limits on messages, swipes, reports, and post
  comments (can't be bypassed by calling the API directly), always on regardless of the above.
- Without those keys, everything falls back to local mock data persisted to `localStorage` (zustand `persist`), exactly like the original prototype.

## What's still simulated

- **ID document authenticity** — the app captures a passport/ID photo but doesn't verify it's a genuine, unaltered, unexpired document, or that it belongs to the person signing up. That needs a KYC vendor (Persona, Onfido, Veriff) and a compliance review.
- **Anything not configured in `.env.local`** — see [SETUP.md](SETUP.md) for exactly what each phase needs and what's still simplified even once it's on (e.g. private-account enforcement is UI-level, not yet database RLS).

## Demo accounts

Sign in with any of these emails and the password `password123`:

- `maria@example.com` — active subscription, on a 35-day trip with no lockout (subscriptions aren't capped)
- `james@example.com` — trip pass whose reported trip ended naturally, now locked
- `elena@example.com` — still mid-trip by her own reported dates, but her trip pass caps out at 14 days from arrival regardless, so she's locked too — this is the "cancels after more than 2 weeks" rule in action

## Trip Pass expiry logic

A Trip Pass is valid until `min(reported departure date, arrival date + 14 days)` — whichever comes first. This is implemented in `src/lib/store.js` as `tripPassExpiry()` / `isTripLocked()`. A subscription has no such cap.
