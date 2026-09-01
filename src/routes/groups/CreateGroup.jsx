import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Field from '../../components/Field'
import { fieldClasses } from '../../lib/fieldClasses'
import DatePicker from '../../components/DatePicker'
import Button from '../../components/Button'
import TripLockedNotice from '../../components/TripLockedNotice'
import { useStore, hasAccess } from '../../lib/store'
import { countries } from '../../lib/mockData'

export default function CreateGroup() {
  const navigate = useNavigate()
  const currentUser = useStore((s) => s.currentUser)
  const createGroup = useStore((s) => s.createGroup)
  const [form, setForm] = useState({
    name: '',
    nationality: currentUser?.country || '',
    city: currentUser?.city || '',
    date: '',
    description: '',
  })
  const [dateError, setDateError] = useState('')

  if (!hasAccess(currentUser)) {
    return currentUser?.plan ? (
      <TripLockedNotice
        title="Group details are locked"
        body="Trip passes cover up to 14 days. Renew your plan to create a group meetup."
      />
    ) : (
      <TripLockedNotice
        title="Groups are for paying travelers"
        body="Add a Trip Pass or subscription to create a group meetup."
        ctaLabel="Add a plan to unlock"
      />
    )
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.date) {
      setDateError('Pick a date for the meetup.')
      return
    }
    const id = await createGroup(form)
    navigate(`/groups/${id}`)
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <button
        type="button"
        onClick={() => navigate('/groups')}
        className="text-[13.5px] text-ink-muted transition-colors duration-200 hover:text-ink cursor-pointer"
      >
        ← Back to groups
      </button>

      <h1 className="mt-4 text-xl font-semibold text-ink">Create a group</h1>
      <p className="mt-1 text-[13.5px] text-ink-muted">
        Start a meetup for travelers of your nationality nearby.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
        <Field label="Group name" htmlFor="name">
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Aussies in Lisbon"
            className={fieldClasses(false)}
          />
        </Field>

        <Field label="Nationality" htmlFor="nationality">
          <select
            id="nationality"
            required
            value={form.nationality}
            onChange={(e) => update('nationality', e.target.value)}
            className={fieldClasses(false)}
          >
            <option value="">Select a nationality</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="City" htmlFor="city">
          <input
            id="city"
            required
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
            className={fieldClasses(false)}
          />
        </Field>

        <Field label="Meetup date" htmlFor="date" error={dateError}>
          <DatePicker
            id="date"
            value={form.date}
            onChange={(next) => {
              update('date', next)
              setDateError('')
            }}
            placeholder="When are you meeting?"
            error={!!dateError}
            disabledMatcher={{ before: new Date() }}
          />
        </Field>

        <Field label="Description" htmlFor="description" helper="Exact location stays hidden until someone joins.">
          <textarea
            id="description"
            required
            rows={3}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="What's the plan?"
            className="w-full rounded-xl border border-border-strong bg-bg-raised px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors duration-200 focus:border-accent focus:ring-2 focus:ring-accent/25 resize-none"
          />
        </Field>

        <Button type="submit" size="lg" className="mt-2 w-full">
          Create group
        </Button>
      </form>
    </div>
  )
}
