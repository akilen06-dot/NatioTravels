import { CreditCard, Flag, IdentificationCard, MapPinLine } from '@phosphor-icons/react'

// A function (not a plain array) so every consumer — SafetyCenter,
// SafetyPolicy, and the marketing Safety section — renders this in the
// viewer's chosen language instead of always English.
export function getPolicySections(t) {
  return [
    {
      icon: MapPinLine,
      title: t('Location Privacy'),
      summary: t('Your exact location is never shown, only your general area, and never live-tracked.'),
      tint: 'accent',
      items: [
        {
          term: t('Invisible GPS'),
          body: t('Your exact coordinates are never visible to other users. The app only shows travelers who are in the same general city or neighborhood.'),
        },
        {
          term: t('No Live Tracking'),
          body: t('Other members cannot track your movements, see your real-time position, or view your path on a map.'),
        },
        {
          term: t('Background Security'),
          body: t('We access your location behind the scenes solely to verify your arrival in a new country. You can adjust this to "Only While Using the App" in your device settings.'),
        },
      ],
    },
    {
      icon: CreditCard,
      title: t('Financial Security'),
      summary: t('Encrypted, PCI-compliant payments, kept strictly within our verified checkout system.'),
      tint: 'teal',
      items: [
        {
          term: t('Secure Processing'),
          body: t('All premium membership and event fees are handled via encrypted, PCI-compliant payment gateways. We never store your full credit card details on our servers.'),
        },
        {
          term: t('In-App Only'),
          body: t('Never exchange cash, wire money, or share bank details directly with another user. Keep all financial transactions strictly within our verified checkout system.'),
        },
      ],
    },
    {
      icon: IdentificationCard,
      title: t('Meetup Verification'),
      summary: t('Home country verified against your passport and billing address. Meetups happen in public places only.'),
      tint: 'coral',
      items: [
        {
          term: t('Home Country Check'),
          body: t('To ensure authenticity, your home country is verified using your payment billing address and the passport country provided during registration.'),
        },
        {
          term: t('Public Spaces Only'),
          body: t('For your safety, the app blocks private residences from being set as meetup locations. Always gather in well-lit, crowded, public venues.'),
        },
        {
          term: t('Manual Sharing'),
          body: t('Because the app never shares your location, you must manually coordinate and agree on a public meeting point with other travelers through the chat.'),
        },
      ],
    },
    {
      icon: Flag,
      title: t('Reporting & Privacy'),
      summary: t('Block anyone instantly. Zero tolerance for harassment, scams, or fraud.'),
      tint: 'neutral',
      items: [
        {
          term: t('Instant Blocking'),
          body: t('If another traveler makes you feel uncomfortable, tap the flag icon on their profile to block them immediately. They will no longer be able to message you or see your profile in local search results.'),
        },
        {
          term: t('Zero Tolerance'),
          body: t('We enforce strict bans on harassment, scams, commercial solicitation, and identity fraud to keep our community safe for everyone.'),
        },
      ],
    },
  ]
}
