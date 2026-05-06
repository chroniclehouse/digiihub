import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SpeakerForm from '@/components/admin/SpeakerForm'

interface PageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function NewSpeakerPage({ params }: PageProps) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/admin')

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/admin/${orgSlug}/speakers`}
          className="font-mono text-xs text-navy/40 hover:text-navy transition-colors mb-3 inline-block"
        >
          ← Speakers
        </Link>
        <h1 className="font-display text-3xl font-semibold text-navy">Add speaker</h1>
      </div>
      <SpeakerForm orgSlug={orgSlug} orgId={org.id} />
    </div>
  )
}
