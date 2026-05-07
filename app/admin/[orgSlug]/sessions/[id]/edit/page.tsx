import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSessionWithSpeakers } from '@/lib/queries/sessions'
import { getAdminOrgSpeakers } from '@/lib/queries/speakers'
import SessionForm from '@/components/admin/SessionForm'

interface PageProps {
  params: Promise<{ orgSlug: string; id: string }>
}

export default async function EditSessionPage({ params }: PageProps) {
  const { orgSlug, id } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/admin')

  const [session, orgSpeakers] = await Promise.all([
    getSessionWithSpeakers(id),
    getAdminOrgSpeakers(org.id),
  ])

  if (!session || session.organization_id !== org.id) notFound()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-navy">Edit session</h1>
        <p className="font-mono text-xs text-navy/40 mt-1">{session.title}</p>
      </div>
      <SessionForm
        orgSlug={orgSlug}
        orgId={org.id}
        session={session}
        orgSpeakers={orgSpeakers}
      />
    </div>
  )
}
