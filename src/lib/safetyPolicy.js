import { CreditCard, Flag, IdentificationCard, MapPinLine } from '@phosphor-icons/react'

export const policySections = [
  {
    icon: MapPinLine,
    title: 'Location Privacy',
    summary: 'Your exact location is never shown, only your general area, and never live-tracked.',
    tint: 'accent',
    items: [
      {
        term: 'Invisible GPS',
        body: 'Your exact coordinates are never visible to other users. The app only shows travelers who are in the same general city or neighborhood.',
      },
      {
        term: 'No Live Tracking',
        body: 'Other members cannot track your movements, see your real-time position, or view your path on a map.',
      },
      {
        term: 'Background Security',
        body: 'We access your location behind the scenes solely to verify your arrival in a new country. You can adjust this to "Only While Using the App" in your device settings.',
      },
    ],
  },
  {
    icon: CreditCard,
    title: 'Financial Security',
    summary: 'Encrypted, PCI-compliant payments, kept strictly within our verified checkout system.',
    tint: 'teal',
    items: [
      {
        term: 'Secure Processing',
        body: 'All premium membership and event fees are handled via encrypted, PCI-compliant payment gateways. We never store your full credit card details on our servers.',
      },
      {
        term: 'In-App Only',
        body: 'Never exchange cash, wire money, or share bank details directly with another user. Keep all financial transactions strictly within our verified checkout system.',
      },
    ],
  },
  {
    icon: IdentificationCard,
    title: 'Meetup Verification',
    summary: 'Home country verified against your passport and billing address. Meetups happen in public places only.',
    tint: 'coral',
    items: [
      {
        term: 'Home Country Check',
        body: 'To ensure authenticity, your home country is verified using your payment billing address and the passport country provided during registration.',
      },
      {
        term: 'Public Spaces Only',
        body: 'For your safety, the app blocks private residences from being set as meetup locations. Always gather in well-lit, crowded, public venues.',
      },
      {
        term: 'Manual Sharing',
        body: 'Because the app never shares your location, you must manually coordinate and agree on a public meeting point with other travelers through the chat.',
      },
    ],
  },
  {
    icon: Flag,
    title: 'Reporting & Privacy',
    summary: 'Block anyone instantly. Zero tolerance for harassment, scams, or fraud.',
    tint: 'neutral',
    items: [
      {
        term: 'Instant Blocking',
        body: 'If another traveler makes you feel uncomfortable, tap the flag icon on their profile to block them immediately. They will no longer be able to message you or see your profile in local search results.',
      },
      {
        term: 'Zero Tolerance',
        body: 'We enforce strict bans on harassment, scams, commercial solicitation, and identity fraud to keep our community safe for everyone.',
      },
    ],
  },
]
