import { getOrgSpeakersBySlug } from '@/lib/queries/speakers'
import SpeakersGrid from '@/components/hub/speakers/SpeakersGrid'

interface PageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function HubSpeakersPage({ params }: PageProps) {
  const { orgSlug } = await params
  const speakers = await getOrgSpeakersBySlug(orgSlug)

  return (
    <div className="px-6 py-12 max-w-5xl mx-auto">
      <h1 className="font-display text-3xl font-semibold text-navy mb-8">Speakers</h1>
      {speakers.length === 0 ? (
        <p className="text-navy/40 text-sm">No speakers have been added yet.</p>
      ) : (
        <SpeakersGrid speakers={speakers} />
      )}
    </div>
  )
}
