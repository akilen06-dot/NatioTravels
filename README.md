# Natio Travels (prototype)

A clickable UX prototype for a travel companion-matching app: meet verified travelers of your own nationality abroad, one-on-one or through group meetups.

## Running it

```bash
npm install
npm run dev
```

## What's real

- The full React app: routing, screens, component structure, design system.
- All UI state and interactions: signup/signin branching, swipe matching, group requests/accept/kick, messaging, plan selection, trip-expiry lockout.
- Data persists to `localStorage` (zustand `persist`) so the demo survives a refresh.

## What's simulated, not real

This is a design prototype, not a production system. Nothing below is real:

- **ID verification** — the "capture" step just sets a flag. No document is actually read or validated.
- **Face-match biometrics** — the face scan is a timed animation that always succeeds. There is no camera, no liveness detection, and no biometric matching.
- **Payments** — the checkout form does not process any charge. No payment provider is integrated.
- **Backend** — there is no server or database. All users, groups, and messages live in an in-memory store seeded with mock data.

## Building the real version

Turning this into a production app means adding, separately from this frontend:

- A real backend and database, replacing `src/lib/store.js`'s mock state with API calls.
- A KYC/identity verification vendor (e.g. Persona, Onfido, Veriff) for ID checks, and a liveness/biometric SDK for face matching. These are regulated, compliance-sensitive integrations, not something to hand-roll.
- A payment processor (e.g. Stripe) wired to real subscription billing and trip-pass expiry.
- Server-side location fuzzing against real geolocation data.
- A legal/compliance review: data retention and deletion policy, age verification requirements, and — since this app is designed around meeting strangers in person — a safety and moderation review before launch.

## Demo accounts

Sign in with any of these emails and the password `password123`:

- `maria@example.com` — active subscription, on a 35-day trip with no lockout (subscriptions aren't capped)
- `james@example.com` — trip pass whose reported trip ended naturally, now locked
- `elena@example.com` — still mid-trip by her own reported dates, but her trip pass caps out at 14 days from arrival regardless, so she's locked too — this is the "cancels after more than 2 weeks" rule in action

## Trip Pass expiry logic

A Trip Pass is valid until `min(reported departure date, arrival date + 14 days)` — whichever comes first. This is implemented in `src/lib/store.js` as `tripPassExpiry()` / `isTripLocked()`. A subscription has no such cap.
