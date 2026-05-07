'use client'

import { useState } from 'react'
import { formatDate, formatTimeRange } from '@/lib/utils/format'
import type { SessionWithSpeakers, SessionType } from '@/lib/types/database'

const TYPE_LABEL: Record<SessionType, string> = {
  regular: '',
  special: 'Special',
  graduation: 'Graduation',
  custom: '',
}

interface SessionCardProps {
  session: SessionWithSpeakers
  isPast?: boolean
}

export default function SessionCard({ session, isPast = false }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false)

  const typeLabel =
    session.type === 'custom'
      ? session.custom_type_label || ''
      : TYPE_LABEL[session.type]

  const timeRange = formatTimeRange(session.start_time, session.end_time)
  const speakers = [...session.session_speakers].sort(
    (a, b) => a.display_order - b.display_order
  )
  const hasDescription = !!session.description?.trim()
  const locationParts = [session.location_name, session.room].filter(Boolean)

  return (
    <div
      className={`border border-navy/10 rounded-lg bg-white overflow-hidden transition-opacity ${
        isPast ? 'opacity-60' : ''
      }`}
    >
      <div className="flex gap-4 p-4 sm:p-5">
        {/* Date column */}
        <div className="w-14 sm:w-16 flex-shrink-0 text-center pt-0.5">
          <p className="font-mono text-xs font-medium text-terracotta leading-tight whitespace-nowrap">
            {formatDate(session.session_date).split(',')[1]?.trim().split(' ')[0]}
          </p>
          <p className="font-display text-2xl font-semibold text-navy leading-none mt-0.5">
            {new Date(
              parseInt(session.session_date.split('-')[0]),
              parseInt(session.session_date.split('-')[1]) - 1,
              parseInt(session.session_date.split('-')[2])
            ).getDate()}
          </p>
          {session.session_number != null && (
            <p className="font-mono text-xs text-navy/30 mt-0.5">#{session.session_number}</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
            <h3 className="font-display text-base sm:text-lg font-semibold text-navy">
              {session.title}
            </h3>
            {typeLabel && (
              <span className="font-mono text-xs text-terracotta/80 bg-terracotta/8 px-2 py-0.5 rounded">
                {typeLabel}
              </span>
            )}
          </div>

          {/* Meta */}
          {(timeRange || locationParts.length > 0) && (
            <p className="text-xs text-navy/50 mb-2">
              {[timeRange, locationParts.join(', ')].filter(Boolean).join(' · ')}
            </p>
          )}

          {/* Description */}
          {hasDescription && (
            <div>
              <p
                className={`text-sm text-navy/70 leading-relaxed ${
                  expanded ? '' : 'line-clamp-2'
                }`}
              >
                {session.description}
              </p>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-mono text-terracotta hover:text-terracotta/80 transition-colors mt-1"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            </div>
          )}

          {/* Speakers */}
          {speakers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <div className="flex -space-x-2">
                {speakers.slice(0, 4).map((ss) => (
                  <div
                    key={ss.id}
                    className="w-7 h-7 rounded-full bg-cream border-2 border-white overflow-hidden flex-shrink-0"
                    title={ss.speaker.full_name}
                  >
                    {ss.speaker.photo_url ? (
                      <img
                        src={ss.speaker.photo_url}
                        alt={ss.speaker.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-display text-xs font-semibold text-navy/40">
                        {ss.speaker.full_name[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-navy/50">
                {speakers.map((ss) => ss.speaker.full_name).join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
