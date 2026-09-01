import Nav from './sections/Nav'
import Footer from './sections/Footer'
import { Warning } from '@phosphor-icons/react'

function TodoField({ children }) {
  return (
    <span className="rounded bg-danger-tint px-1.5 py-0.5 font-medium text-danger">
      {children}
    </span>
  )
}

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

export default function Terms() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-2xl px-5 py-16 md:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-ink md:text-4xl">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-[13.5px] text-ink-faint">Last updated: August 31, 2026</p>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger-tint p-5">
          <Warning size={20} className="mt-0.5 shrink-0 text-danger" />
          <p className="text-[13.5px] leading-relaxed text-ink">
            This is a draft template for the Natio Travels prototype, not a finished legal document. The
            fields marked <TodoField>like this</TodoField> still need real information from you
            (your registered company name and your governing-law jurisdiction), and the whole
            document needs a lawyer's review before it can actually bind anyone.
          </p>
        </div>

        <p className="mt-8 text-[14.5px] leading-relaxed text-ink-muted">
          Welcome to Natio Travels (the "App"). This Terms and Conditions agreement ("Agreement")
          constitutes a legally binding contract between you ("User," "you," or "your") and{' '}
          <TodoField>Insert Company Name</TodoField> ("Company," "we," "us," or "our"). By
          downloading, installing, accessing, or using the App, you agree to be bound by all of
          the terms contained herein. If you do not agree to these terms, you must immediately
          cease using the App and delete it from your device.
        </p>

        <Section number={1} title="Eligibility & Verification">
          <p>
            <strong className="font-medium text-ink">Age Requirement:</strong> You must be at
            least 18 years of age (or the age of majority in your jurisdiction) to create an
            account and use this App.
          </p>
          <p>
            <strong className="font-medium text-ink">Home Country Verification:</strong> The App
            is explicitly designed to connect travelers from the same home country while they are
            abroad. We reserve the right to verify your home country via your passport metadata,
            government-issued identification, or payment billing address.
          </p>
          <p>
            <strong className="font-medium text-ink">Account Responsibility:</strong> You are
            solely responsible for maintaining the confidentiality of your login credentials and
            for all activities that occur under your account.
          </p>
        </Section>

        <Section number={2} title="Location Data & Permissions">
          <p>
            <strong className="font-medium text-ink">Permission Requirements:</strong> To match
            you with travelers from your home country, the App requires access to your device's
            Location Services. You agree to grant the App permission to access your geographic
            location data.
          </p>
          <p>
            <strong className="font-medium text-ink">Privacy Architecture:</strong> We utilize
            your location data strictly on our secure backend servers to determine which users are
            located within the same city or neighborhood.
          </p>
          <p>
            <strong className="font-medium text-ink">Invisible GPS Provision:</strong> Other users
            cannot see your real-time position, exact GPS coordinates, or historic movement paths.
            You acknowledge and agree that your precise physical location is completely masked
            from the public and other travelers.
          </p>
        </Section>

        <Section id="fees-and-billing" number={3} title="Fees, Payments, and Billing">
          <p>
            <strong className="font-medium text-ink">Subscription and Event Fees:</strong> Access
            to premium matching features, verified community events, or premium tiers may require
            the payment of fees ("Fees"). All Fees are stated in USD and are exclusive of
            applicable taxes.
          </p>
          <p>
            <strong className="font-medium text-ink">Payment Processing:</strong> All payments are
            processed through secure, third-party, PCI-compliant payment gateways (e.g., Apple App
            Store, Google Play Store, or Stripe). We do not store your full financial data.
          </p>
          <p>
            <strong className="font-medium text-ink">Refund Policy:</strong> Except as explicitly
            provided within the App's refund flow (such as the automatic cancellation of a hosted
            meetup by an organizer), all purchases and platform fees are non-refundable.
          </p>
          <p>
            <strong className="font-medium text-ink">Price Changes:</strong> We reserve the right
            to modify our fee structure at any time. Any changes to subscription pricing will be
            communicated to you in advance and will apply to the next billing cycle.
          </p>
        </Section>

        <Section number={4} title="User Conduct & Safe Interaction">
          <p>
            <strong className="font-medium text-ink">In-Person Meetups:</strong> The App provides
            an online matching mechanism for travelers to manually arrange in-person hangouts. You
            acknowledge that any subsequent physical meetings are entirely voluntary, organized
            solely by the users, and undertaken at your own risk.
          </p>
          <div>
            <p>
              <strong className="font-medium text-ink">Prohibited Conduct:</strong> You explicitly
              agree not to use the App to:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5">
              <li>Harass, abuse, stalk, threaten, or defraud other users.</li>
              <li>Share explicit, hateful, offensive, or unlawful user-generated content.</li>
              <li>
                Solicit money, engage in commercial advertising, or run unapproved promotional
                schemes.
              </li>
              <li>
                Falsify your home country, identity, or location data (e.g., through GPS spoofing
                software).
              </li>
            </ul>
          </div>
        </Section>

        <Section number={5} title="Limitation of Liability & Disclaimers">
          <p>
            <strong className="font-medium text-ink">"As-Is" Service:</strong> The App is provided
            on an "as-is" and "as-available" basis without warranties of any kind, either express
            or implied.
          </p>
          <p>
            <strong className="font-medium text-ink">No Offline Liability:</strong> We do not
            perform criminal background checks on users. The Company explicitly disclaims all
            liability for the actions, omissions, conduct, or safety of any users during
            in-person hangouts, meetups, or off-platform interactions.
          </p>
          <p>
            <strong className="font-medium text-ink">Cap on Damages:</strong> To the maximum
            extent permitted by applicable law, the Company's total liability for any claim
            arising out of or relating to this Agreement or use of the App shall not exceed the
            total amount of fees paid by you to the Company in the twelve (12) months preceding
            the claim.
          </p>
        </Section>

        <Section number={6} title="Termination of Service">
          <p>
            We reserve the unilateral right to suspend, terminate, or restrict your access to the
            App at any time, without notice or liability, if we determine, in our sole discretion,
            that you have violated these Terms and Conditions or pose a safety risk to our
            community.
          </p>
        </Section>

        <Section number={7} title="Governing Law & Dispute Resolution">
          <p>
            This Agreement shall be governed by and construed in accordance with the laws of{' '}
            <TodoField>Insert Country/State</TodoField>, without regard to its conflict of law
            provisions. Any legal action or proceeding arising under this Agreement will be
            brought exclusively in the courts located in{' '}
            <TodoField>Insert City/Jurisdiction</TodoField>.
          </p>
        </Section>
      </div>
      <Footer />
    </div>
  )
}
