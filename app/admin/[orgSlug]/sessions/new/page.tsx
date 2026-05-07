import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAdminOrgSpeakers } from '@/lib/queries/speakers'
import SessionForm from '@/components/admin/SessionForm'

interface PageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function NewSessionPage({ params }: PageProps) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/admin')

  const orgSpeakers = await getAdminOrgSpeakers(org.id)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-navy">Add session</h1>
        <p className="font-mono text-xs text-navy/40 mt-1">{org.name}</p>
      </div>
      <SessionForm orgSlug={orgSlug} orgId={org.id} orgSpeakers={orgSpeakers} />
    </div>
  )
}
