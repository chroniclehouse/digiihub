import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrgSessions } from '@/lib/queries/sessions'
import { archiveSessionAction } from '@/lib/actions/sessions'
import { formatDateShort, formatTimeRange } from '@/lib/utils/format'
import type { Session } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ orgSlug: string }>
}

const STATUS_LABEL: Record<Session['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
}

const STATUS_CLASS: Record<Session['status'], string> = {
  draft: 'bg-navy/10 text-navy/60',
  published: 'bg-terracotta/10 text-terracotta',
  cancelled: 'bg-red-100 text-red-500',
}

export default async function AdminSessionsPage({ params }: PageProps) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/admin')

  const sessions = await getOrgSessions(org.id)
  const active = sessions.filter((s) => s.status !== 'cancelled')
  const cancelled = sessions.filter((s) => s.status === 'cancelled')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">Sessions</h1>
          <p className="font-mono text-xs text-navy/40 mt-1">{active.length} active</p>
        </div>
        <Link
          href={`/admin/${orgSlug}/sessions/new`}
          className="bg-navy text-white px-4 py-2 rounded text-sm font-medium hover:bg-navy/90 transition-colors"
        >
          Add session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <EmptyState orgSlug={orgSlug} />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <SessionTable sessions={active} orgSlug={orgSlug} showArchive />
          )}
          {cancelled.length > 0 && (
            <div>
              <p className="font-mono text-xs text-navy/40 uppercase tracking-widest mb-3">Cancelled</p>
              <SessionTable sessions={cancelled} orgSlug={orgSlug} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState({ orgSlug }: { orgSlug: string }) {
  return (
    <div className="border border-dashed border-navy/20 rounded-lg p-8 max-w-lg">
      <p className="font-display text-xl text-navy mb-2">No sessions yet</p>
      <p className="text-sm text-navy/60 mb-6">
        Sessions appear as a chronological schedule on your hub's public page. Each session
        can have a date, time, location, description, and attached speakers.
      </p>
      <Link
        href={`/admin/${orgSlug}/sessions/new`}
        className="inline-block bg-navy text-white px-5 py-2 rounded text-sm font-medium hover:bg-navy/90 transition-colors"
      >
        Add your first session
      </Link>
    </div>
  )
}

function SessionTable({
  sessions,
  orgSlug,
  showArchive = false,
}: {
  sessions: Session[]
  orgSlug: string
  showArchive?: boolean
}) {
  return (
    <div className="divide-y divide-navy/10 border border-navy/10 rounded-lg overflow-hidden">
      {sessions.map((session) => {
        const archiveThis = archiveSessionAction.bind(null, session.id, orgSlug)
        const timeRange = formatTimeRange(session.start_time, session.end_time)

        return (
          <div
            key={session.id}
            className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-paper transition-colors"
          >
            <div className="w-14 flex-shrink-0 text-center">
              <p className="font-mono text-xs text-terracotta font-medium leading-tight">
                {formatDateShort(session.session_date)}
              </p>
              {session.session_number != null && (
                <p className="font-mono text-xs text-navy/30">#{session.session_number}</p>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy truncate">{session.title}</p>
              <p className="text-xs text-navy/40 truncate">
                {[timeRange, session.location_name].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`font-mono text-xs px-2 py-0.5 rounded ${STATUS_CLASS[session.status]}`}>
                {STATUS_LABEL[session.status]}
              </span>
              <Link
                href={`/admin/${orgSlug}/sessions/${session.id}/edit`}
                className="text-xs font-mono text-navy/50 hover:text-navy transition-colors"
              >
                Edit
              </Link>
              {showArchive && (
                <form action={archiveThis}>
                  <button
                    type="submit"
                    className="text-xs font-mono text-navy/30 hover:text-red-400 transition-colors"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
