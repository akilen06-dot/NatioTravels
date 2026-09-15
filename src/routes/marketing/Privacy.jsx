import Nav from './sections/Nav'
import Footer from './sections/Footer'

function Section({ id, number, title, children }) {
  return (
    <section id={id} className="mt-10 first:mt-0 scroll-mt-24">
      <h2 className="text-[17px] font-semibold text-ink">
        {number}. {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-[14.5px] leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  )
}

export default function Privacy() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-[13.5px] text-ink-faint">Last updated: September 16, 2026</p>

        <p className="mt-8 text-[14.5px] leading-relaxed text-ink-muted">
          This Privacy Policy explains what information Natio Travels (the "App," "we," "us," or
          "our") collects from you, why we collect it, who we share it with, and the choices you
          have. By using the App, you agree to the practices described here. For the legal terms
          of using the App, see our{' '}
          <a href="/terms" className="text-accent-strong underline underline-offset-2">
            Terms and Conditions
          </a>
          .
        </p>

        <Section number={1} title="Information We Collect">
          <p>
            <strong className="font-medium text-ink">Account information:</strong> your name,
            username, email address, password (stored securely, never in plain text), and date of
            birth.
          </p>
          <p>
            <strong className="font-medium text-ink">Identity & home country:</strong> a
            passport/ID photo captured during signup, and the home country/nationality you
            provide.
          </p>
          <p>
            <strong className="font-medium text-ink">Location:</strong> your device's GPS
            location, rounded/fuzzed to roughly a 1–2 km area before it ever leaves your device —
            we never store or transmit your exact coordinates. This is used to show your general
            city/area and, if you're traveling outside your home country, to show that you're
            currently visiting somewhere else.
          </p>
          <p>
            <strong className="font-medium text-ink">Profile content:</strong> your bio, profile
            photo, and any posts, photos, or captions you choose to share.
          </p>
          <p>
            <strong className="font-medium text-ink">Activity data:</strong> who you swipe on or
            match with, messages you send, groups you join or create, and any reports or blocks
            you submit.
          </p>
          <p>
            <strong className="font-medium text-ink">Billing information:</strong> your plan and
            billing cycle. We never see or store your full card details — payments are handled
            entirely by our payment processor (see below).
          </p>
        </Section>

        <Section number={2} title="How We Use Your Information">
          <p>
            We use your information to operate the App's core purpose: matching you with verified
            travelers of your own nationality nearby, letting you message and meet up with them,
            verifying your identity and home country, processing payments, sending you
            account-related emails (like email verification), and keeping the community safe
            (reviewing reports, enforcing blocks, and preventing abuse).
          </p>
        </Section>

        <Section number={3} title="Who We Share It With">
          <p>
            We don't sell your data. We do rely on a small number of third-party services to
            actually run the App, and each only receives the specific data it needs to do its job:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <strong className="font-medium text-ink">Supabase</strong> — our database, user
              accounts, and backend infrastructure. Stores your profile, messages, matches, and
              all other app data.
            </li>
            <li>
              <strong className="font-medium text-ink">Paddle</strong> — processes payments for
              paid plans. Handles your payment details directly; we never receive your full card
              number.
            </li>
            <li>
              <strong className="font-medium text-ink">Resend</strong> — sends account emails,
              such as email verification.
            </li>
            <li>
              <strong className="font-medium text-ink">OpenCage</strong> — converts your fuzzed
              GPS coordinates into a city/country name.
            </li>
            <li>
              <strong className="font-medium text-ink">Sentry</strong> — receives technical error
              reports if something in the App breaks, to help us fix bugs.
            </li>
            <li>
              <strong className="font-medium text-ink">Vercel</strong> — hosts the website itself.
            </li>
          </ul>
          <p>
            Other users only ever see what your profile settings make visible (your name, photo,
            bio, general area, and whether you're currently traveling) — never your exact
            location, email, or payment information.
          </p>
        </Section>

        <Section number={4} title="Data Retention & Deletion">
          <p>
            We keep your information for as long as your account is active. You can permanently
            delete your account and all associated data at any time from Profile → Settings →
            Safety & Privacy → "Delete my data." This is irreversible: it deletes your account,
            profile, matches, messages, and posts entirely, not just hides them.
          </p>
        </Section>

        <Section number={5} title="Your Rights">
          <p>
            You can review and correct most of your information yourself at any time by editing
            your profile. You have the right to request a copy of your data or ask us to delete it
            by contacting us directly (see below), in addition to the self-service deletion option
            above.
          </p>
        </Section>

        <Section number={6} title="Cookies & Local Storage">
          <p>
            The App uses your browser's local storage to keep you signed in and remember your app
            preferences (like light/dark mode). We don't use third-party advertising trackers or
            cookies to follow you across other websites.
          </p>
        </Section>

        <Section number={7} title="Children's Privacy">
          <p>
            The App is not intended for anyone under 18. We don't knowingly collect information
            from anyone under 18, consistent with the age requirement in our Terms and Conditions.
          </p>
        </Section>

        <Section number={8} title="International Data Transfers">
          <p>
            Because our service providers operate infrastructure in different countries, your
            information may be processed or stored outside the country you're currently in,
            including outside Mauritius. By using the App, you consent to this transfer and
            processing.
          </p>
        </Section>

        <Section number={9} title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. If we make material changes,
            we'll update the "Last updated" date above.
          </p>
        </Section>

        <Section number={10} title="Contact Us">
          <p>
            Questions about this Privacy Policy or your data? Email us at{' '}
            <a
              href="mailto:natiotravels@gmail.com"
              className="text-accent-strong underline underline-offset-2"
            >
              natiotravels@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>
      <Footer />
    </div>
  )
}
