'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSessionAction, updateSessionAction } from '@/lib/actions/sessions'
import type { Speaker, SessionWithSpeakers, SessionType, SessionStatus, SpeakerRole } from '@/lib/types/database'

interface SelectedSpeaker {
  speakerId: string
  role: SpeakerRole
}

interface SessionFormProps {
  orgSlug: string
  orgId: string
  session?: SessionWithSpeakers
  orgSpeakers: Speaker[]
}

const TYPE_OPTIONS: { value: SessionType; label: string }[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'special', label: 'Special' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'custom', label: 'Custom' },
]

const ROLE_OPTIONS: { value: SpeakerRole; label: string }[] = [
  { value: 'primary', label: 'Primary facilitator' },
  { value: 'co_facilitator', label: 'Co-facilitator' },
  { value: 'guest', label: 'Guest speaker' },
]

const inputCls =
  'w-full border border-navy/20 rounded px-3 py-2 text-sm text-navy bg-white focus:outline-none focus:border-navy/50'
const labelCls = 'font-mono text-xs tracking-widest text-navy/50 uppercase block mb-1'

export default function SessionForm({ orgSlug, orgId, session, orgSpeakers }: SessionFormProps) {
  const router = useRouter()
  const isEdit = !!session

  const [sessionNumber, setSessionNumber] = useState(
    session?.session_number != null ? String(session.session_number) : ''
  )
  const [title, setTitle] = useState(session?.title ?? '')
  const [type, setType] = useState<SessionType>(session?.type ?? 'regular')
  const [customTypeLabel, setCustomTypeLabel] = useState(session?.custom_type_label ?? '')
  const [date, setDate] = useState(session?.session_date ?? '')
  const [startTime, setStartTime] = useState(
    session?.start_time ? session.start_time.slice(0, 5) : ''
  )
  const [endTime, setEndTime] = useState(
    session?.end_time ? session.end_time.slice(0, 5) : ''
  )
  const [locationName, setLocationName] = useState(session?.location_name ?? '')
  const [locationAddress, setLocationAddress] = useState(session?.location_address ?? '')
  const [room, setRoom] = useState(session?.room ?? '')
  const [description, setDescription] = useState(session?.description ?? '')
  const [status, setStatus] = useState<SessionStatus>(session?.status === 'cancelled' ? 'draft' : (session?.status ?? 'draft'))

  const initialSpeakers: SelectedSpeaker[] = session
    ? [...session.session_speakers]
        .sort((a, b) => a.display_order - b.display_order)
        .map((ss) => ({ speakerId: ss.speaker.id, role: ss.role }))
    : []
  const [selectedSpeakers, setSelectedSpeakers] = useState<SelectedSpeaker[]>(initialSpeakers)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableSpeakers = orgSpeakers.filter(
    (sp) => !selectedSpeakers.some((s) => s.speakerId === sp.id)
  )

  const addSpeaker = (speakerId: string) => {
    setSelectedSpeakers((prev) => [...prev, { speakerId, role: 'primary' }])
  }

  const removeSpeaker = (speakerId: string) => {
    setSelectedSpeakers((prev) => prev.filter((s) => s.speakerId !== speakerId))
  }

  const updateRole = (speakerId: string, role: SpeakerRole) => {
    setSelectedSpeakers((prev) =>
      prev.map((s) => (s.speakerId === speakerId ? { ...s, role } : s))
    )
  }

  const getSpeaker = (speakerId: string) =>
    orgSpeakers.find((sp) => sp.id === speakerId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    if (!date) { setError('Date is required.'); return }
    setIsSubmitting(true)
    setError(null)

    const input = {
      session_number: sessionNumber ? parseInt(sessionNumber, 10) : null,
      title: title.trim(),
      type,
      custom_type_label: type === 'custom' && customTypeLabel.trim() ? customTypeLabel.trim() : null,
      session_date: date,
      start_time: startTime || null,
      end_time: endTime || null,
      location_name: locationName.trim() || null,
      location_address: locationAddress.trim() || null,
      room: room.trim() || null,
      description: description.trim() || null,
      status,
    }

    const speakers = selectedSpeakers.map((s, i) => ({
      speakerId: s.speakerId,
      role: s.role,
      displayOrder: i + 1,
    }))

    try {
      if (isEdit) {
        await updateSessionAction(session.id, input, speakers)
      } else {
        await createSessionAction(orgId, input, speakers)
      }
      router.push(`/admin/${orgSlug}/sessions`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Session number + Title */}
      <div className="flex gap-4">
        <div className="w-24 flex-shrink-0">
          <label className={labelCls}>Session #</label>
          <input
            type="number"
            min={1}
            value={sessionNumber}
            onChange={(e) => setSessionNumber(e.target.value)}
            placeholder="1"
            className={inputCls}
          />
        </div>
        <div className="flex-1">
          <label className={labelCls}>
            Title <span className="text-terracotta">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Foundations of Leadership"
            className={inputCls}
          />
        </div>
      </div>

      {/* Type */}
      <div>
        <label className={labelCls}>Type</label>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border ${
                type === opt.value
                  ? 'bg-navy text-white border-navy'
                  : 'border-navy/20 text-navy/60 hover:border-navy/40 hover:text-navy'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {type === 'custom' && (
          <input
            type="text"
            value={customTypeLabel}
            onChange={(e) => setCustomTypeLabel(e.target.value)}
            placeholder="Custom type label"
            className={`${inputCls} mt-2`}
          />
        )}
      </div>

      {/* Date */}
      <div>
        <label className={labelCls}>
          Date <span className="text-terracotta">*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className={inputCls}
        />
      </div>

      {/* Start + End time */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className={labelCls}>Start time</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex-1">
          <label className={labelCls}>End time</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-3">
        <p className={labelCls}>Location</p>
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="Venue name"
          className={inputCls}
        />
        <input
          type="text"
          value={locationAddress}
          onChange={(e) => setLocationAddress(e.target.value)}
          placeholder="Address"
          className={inputCls}
        />
        <input
          type="text"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Room / suite"
          className={inputCls}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="What will participants do, learn, or experience in this session?"
          className={`${inputCls} resize-y`}
        />
      </div>

      {/* Speakers */}
      <div>
        <p className={labelCls}>Speakers</p>

        {selectedSpeakers.length > 0 && (
          <div className="space-y-2 mb-3">
            {selectedSpeakers.map((sel) => {
              const sp = getSpeaker(sel.speakerId)
              if (!sp) return null
              return (
                <div
                  key={sel.speakerId}
                  className="flex items-center gap-3 p-2 border border-navy/10 rounded bg-white"
                >
                  <div className="w-8 h-8 rounded-full bg-cream flex-shrink-0 overflow-hidden">
                    {sp.photo_url ? (
                      <img src={sp.photo_url} alt={sp.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display text-sm font-semibold text-navy/30">
                        {sp.full_name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{sp.full_name}</p>
                    {sp.title && <p className="text-xs text-navy/40 truncate">{sp.title}</p>}
                  </div>
                  <select
                    value={sel.role}
                    onChange={(e) => updateRole(sel.speakerId, e.target.value as SpeakerRole)}
                    className="text-xs font-mono border border-navy/20 rounded px-2 py-1 text-navy bg-white focus:outline-none focus:border-navy/50"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSpeaker(sel.speakerId)}
                    className="text-navy/30 hover:text-red-400 transition-colors text-xl leading-none px-1 flex-shrink-0"
                    aria-label="Remove speaker"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {availableSpeakers.length > 0 && (
          <div className="border border-dashed border-navy/20 rounded p-2">
            <p className="font-mono text-xs text-navy/40 mb-2">Add speaker</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {availableSpeakers.map((sp) => (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => addSpeaker(sp.id)}
                  className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-paper transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-cream flex-shrink-0 overflow-hidden">
                    {sp.photo_url ? (
                      <img src={sp.photo_url} alt={sp.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display text-xs font-semibold text-navy/30">
                        {sp.full_name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy truncate">{sp.full_name}</p>
                    {sp.title && <p className="text-xs text-navy/40 truncate">{sp.title}</p>}
                  </div>
                  <span className="text-xs font-mono text-terracotta flex-shrink-0">+ Add</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {orgSpeakers.length === 0 && (
          <p className="text-xs text-navy/40">
            No speakers added to this org yet.{' '}
            <Link href={`/admin/${orgSlug}/speakers/new`} className="text-terracotta hover:underline">
              Add a speaker
            </Link>{' '}
            first.
          </p>
        )}
      </div>

      {/* Status */}
      <div>
        <p className={labelCls}>Status</p>
        <div className="flex gap-2">
          {(['draft', 'published'] as SessionStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors border capitalize ${
                status === s
                  ? 'bg-navy text-white border-navy'
                  : 'border-navy/20 text-navy/60 hover:border-navy/40 hover:text-navy'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs text-navy/40 mt-1">
          Draft sessions are only visible in admin. Publish to show on the hub.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-navy/10">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-navy text-white px-6 py-2 rounded text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add session'}
        </button>
        <Link
          href={`/admin/${orgSlug}/sessions`}
          className="text-sm text-navy/50 hover:text-navy transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
