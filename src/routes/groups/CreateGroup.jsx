import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPinLine } from '@phosphor-icons/react'
import Field from '../../components/Field'
import { fieldClasses } from '../../lib/fieldClasses'
import DatePicker from '../../components/DatePicker'
import Button from '../../components/Button'
import TripLockedNotice from '../../components/TripLockedNotice'
import LocationPickerModal from '../../components/LocationPickerModal'
import { useStore, hasAccess } from '../../lib/store'
import { countries } from '../../lib/mockData'
import { forwardGeocode, isGeocodingConfigured } from '../../lib/geocode'
import { useT } from '../../lib/i18n'

export default function CreateGroup() {
  const t = useT()
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const createGroup = useStore((s) => s.createGroup)
  const [form, setForm] = useState({
    name: '',
    nationality: currentUser?.country || '',
    city: currentUser?.city || '',
    date: '',
    description: '',
    locationQuery: '',
  })
  const [dateError, setDateError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  // Set only via the map picker below — kept separate from the text field
  // so a pin placed on the map takes priority over forward-geocoding at
  // submit time, but is dropped the moment the user edits the text by hand
  // (at that point the text no longer necessarily describes the pin).
  const [pickedCoords, setPickedCoords] = useState(null)

  if (!hasAccess(currentUser)) {
    return currentUser?.plan ? (
      <TripLockedNotice
        title={t('Group details are locked')}
        body={t('Trip passes cover up to 14 days. Renew your plan to create a group meetup.')}
      />
    ) : (
      <TripLockedNotice
        title={t('Groups are for paying travelers')}
        body={t('Add a Trip Pass or subscription to create a group meetup.')}
        ctaLabel={t('Add a plan to unlock')}
      />
    )
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.date) {
      setDateError(t('Pick a date for the meetup.'))
      return
    }
    setSubmitting(true)
    // A pin dropped on the map picker is already exact — no need to
    // forward-geocode the text on top of it. Otherwise, optional and
    // soft-fails quietly like the app's other geocoding calls: a group
    // with no exact spot set (or text that didn't resolve) just falls back
    // to the existing approximate map pin for everyone, members included,
    // rather than blocking creation over it.
    const geo = pickedCoords ? null : form.locationQuery.trim() ? await forwardGeocode(form.locationQuery) : null
    const id = await createGroup({
      ...form,
      locationName: form.locationQuery.trim(),
      locationLat: pickedCoords?.lat ?? geo?.lat ?? null,
      locationLng: pickedCoords?.lng ?? geo?.lng ?? null,
    })
    navigate(`/groups/${id}`)
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <button
        type="button"
        onClick={() => navigate('/groups')}
        className="text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
      >
        {t('← Back to groups')}
      </button>

      <h1 className="mt-4 text-xl font-semibold text-ink">{t('Create a group')}</h1>
      <p className="mt-1 text-[13.5px] text-ink-muted">
        {t('Start a meetup for travelers of your nationality nearby.')}
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
        <Field label={t('Group name')} htmlFor="name">
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={t('Aussies in Lisbon')}
            className={fieldClasses(false)}
          />
        </Field>

        <Field label={t('Nationality')} htmlFor="nationality">
          <select
            id="nationality"
            required
            value={form.nationality}
            onChange={(e) => update('nationality', e.target.value)}
            className={fieldClasses(false)}
          >
            <option value="">{t('Select a nationality')}</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('City')} htmlFor="city">
          <input
            id="city"
            required
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            className={fieldClasses(false)}
          />
        </Field>

        <Field label={t('Meetup date')} htmlFor="date" error={dateError}>
          <DatePicker
            id="date"
            value={form.date}
            onChange={(next) => {
              update('date', next)
              setDateError('')
            }}
            placeholder={t('When are you meeting?')}
            error={!!dateError}
            disabledMatcher={{ before: new Date() }}
          />
        </Field>

        <Field
          label={t('Exact meetup spot (optional)')}
          htmlFor="locationQuery"
          helper={
            isGeocodingConfigured
              ? t('Only shown as a map pin to people who join — everyone else still sees just the approximate area.')
              : t("Saved as text for now — ask your Natio admin to set up location lookup to also show it as a map pin.")
          }
        >
          <div className="flex gap-2">
            <input
              id="locationQuery"
              value={form.locationQuery}
              onChange={(e) => {
                update('locationQuery', e.target.value)
                setPickedCoords(null)
              }}
              placeholder={t('e.g. Praça do Comércio, or a bar name')}
              className={fieldClasses(false)}
            />
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              aria-label={t('Pick on a map')}
              title={t('Pick on a map')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border-strong bg-bg-raised text-ink-muted transition-colors duration-200 hover:border-accent hover:text-accent-strong cursor-pointer"
            >
              <MapPinLine size={19} />
            </button>
          </div>
        </Field>

        <Field label={t('Description')} htmlFor="description">
          <textarea
            id="description"
            required
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder={t("What's the plan?")}
            className="w-full rounded-xl border border-border-strong bg-bg-raised px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/25 resize-none"
          />
        </Field>

        <Button type="submit" size="lg" className="mt-2 w-full" disabled={submitting}>
          {submitting ? t('Creating…') : t('Create group')}
        </Button>
      </form>

      {pickerOpen && (
        <LocationPickerModal
          initialCenter={currentUser?.lat != null && currentUser?.lng != null ? { lat: currentUser.lat, lng: currentUser.lng } : null}
          onClose={() => setPickerOpen(false)}
          onConfirm={({ lat, lng, label }) => {
            setPickedCoords({ lat, lng })
            update('locationQuery', label || t('Pinned location'))
            setPickerOpen(false)
          }}
        />
      )}
    </div>
  )
}
