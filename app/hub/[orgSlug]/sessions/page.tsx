export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getPublishedOrgSessionsBySlug } from '@/lib/queries/sessions'
import { isPastDate, formatDate } from '@/lib/utils/format'
import SessionCard from '@/components/hub/sessions/SessionCard'

interface PageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function HubSessionsPage({ params }: PageProps) {
  const { orgSlug } = await params
  const sessions = await getPublishedOrgSessionsBySlug(orgSlug)

  if (sessions === null) notFound()

  const upcoming = sessions.filter((s) => !isPastDate(s.session_date))
  const past = sessions.filter((s) => isPastDate(s.session_date))

  if (sessions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="border border-dashed border-navy/20 rounded-lg p-8 text-center">
          <p className="font-display text-xl text-navy mb-2">No sessions scheduled yet</p>
          <p className="text-sm text-navy/50">Check back soon for the program schedule.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8 sm:mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-navy">Sessions</h1>
        <p className="text-navy/50 mt-1 text-sm">
          {upcoming.length > 0
            ? `${upcoming.length} upcoming session${upcoming.length !== 1 ? 's' : ''}`
            : 'All sessions complete'}
        </p>
      </div>

      {upcoming.length > 0 && (
        <section className="mb-10 sm:mb-14">
          <div className="space-y-3 sm:space-y-4">
            {groupByDate(upcoming).map(({ dateStr, items }) => (
              <div key={dateStr}>
                <p className="font-mono text-xs text-navy/40 uppercase tracking-widest mb-2 px-1">
                  {formatDate(dateStr)}
                </p>
                <div className="space-y-3">
                  {items.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <p className="font-mono text-xs text-navy/40 uppercase tracking-widest mb-4">
            Past sessions
          </p>
          <div className="space-y-3">
            {past.map((session) => (
              <SessionCard key={session.id} session={session} isPast />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function groupByDate(sessions: Awaited<ReturnType<typeof getPublishedOrgSessionsBySlug>>) {
  const map = new Map<string, typeof sessions>()
  for (const s of sessions) {
    const key = s.session_date
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return Array.from(map.entries()).map(([dateStr, items]) => ({ dateStr, items }))
}
