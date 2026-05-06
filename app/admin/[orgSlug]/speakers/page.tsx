import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminOrgSpeakers } from '@/lib/queries/speakers'
import { archiveSpeakerAction } from '@/lib/actions/speakers'
import type { Speaker } from '@/lib/types/database'

interface PageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function AdminSpeakersPage({ params }: PageProps) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/admin')

  const speakers = await getAdminOrgSpeakers(org.id)
  const active = speakers.filter((s) => s.status === 'active')
  const archived = speakers.filter((s) => s.status === 'archived')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy">Speakers</h1>
          <p className="font-mono text-xs text-navy/40 mt-1">{active.length} active</p>
        </div>
        <Link
          href={`/admin/${orgSlug}/speakers/new`}
          className="bg-navy text-white px-4 py-2 rounded text-sm font-medium hover:bg-navy/90 transition-colors"
        >
          Add speaker
        </Link>
      </div>

      {speakers.length === 0 ? (
        <EmptyState orgSlug={orgSlug} />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <SpeakerTable speakers={active} orgSlug={orgSlug} showArchive />
          )}
          {archived.length > 0 && (
            <div>
              <p className="font-mono text-xs text-navy/40 uppercase tracking-widest mb-3">
                Archived
              </p>
              <SpeakerTable speakers={archived} orgSlug={orgSlug} />
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
      <p className="font-display text-xl text-navy mb-2">No speakers yet</p>
      <p className="text-sm text-navy/60 mb-6">
        Speakers show as a card grid on your hub's public page. Each card shows their photo,
        name, and title. Visitors click a card to open the full bio and links.
      </p>
      <div className="bg-cream/60 rounded p-4 mb-6 space-y-1.5">
        <p className="font-mono text-xs text-navy/40 uppercase tracking-widest mb-2">
          How to add your first speaker
        </p>
        <p className="text-sm text-navy/70">1. Click "Add speaker" above.</p>
        <p className="text-sm text-navy/70">
          2. Fill in their name, title, and bio. Only name is required.
        </p>
        <p className="text-sm text-navy/70">
          3. Upload a headshot (JPG or PNG). Square crop works best — aim for at least 400×400 px.
        </p>
        <p className="text-sm text-navy/70">
          4. Add links like LinkedIn, a personal site, or anywhere else you want to send visitors.
        </p>
        <p className="text-sm text-navy/70">
          5. Save. The speaker appears on the public hub page immediately.
        </p>
        <p className="text-sm text-navy/70 pt-1">
          To remove someone later, use the Archive action — it hides them from the public page
          without deleting their record.
        </p>
      </div>
      <Link
        href={`/admin/${orgSlug}/speakers/new`}
        className="inline-block bg-navy text-white px-5 py-2 rounded text-sm font-medium hover:bg-navy/90 transition-colors"
      >
        Add your first speaker
      </Link>
    </div>
  )
}

function SpeakerTable({
  speakers,
  orgSlug,
  showArchive = false,
}: {
  speakers: Speaker[]
  orgSlug: string
  showArchive?: boolean
}) {
  return (
    <div className="divide-y divide-navy/10 border border-navy/10 rounded-lg overflow-hidden">
      {speakers.map((speaker) => {
        const archiveThis = archiveSpeakerAction.bind(null, speaker.id, orgSlug)
        return (
          <div
            key={speaker.id}
            className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-paper transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-cream flex-shrink-0 overflow-hidden">
              {speaker.photo_url ? (
                <img
                  src={speaker.photo_url}
                  alt={speaker.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display font-semibold text-navy/40">
                  {speaker.full_name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-navy truncate">{speaker.full_name}</p>
              {(speaker.title || speaker.organization_name) && (
                <p className="text-xs text-navy/50 truncate">
                  {[speaker.title, speaker.organization_name].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <Link
                href={`/admin/${orgSlug}/speakers/${speaker.id}/edit`}
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
                    Archive
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
