import { createClient } from '@/lib/supabase/server'
import type { Speaker, SpeakerInput } from '@/lib/types/database'

export async function getOrgSpeakersBySlug(orgSlug: string): Promise<Speaker[]> {
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .single()

  if (!org) return []

  const { data, error } = await supabase
    .from('speakers')
    .select('*')
    .eq('organization_id', org.id)
    .eq('status', 'active')
    .order('full_name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Speaker[]
}

export async function getAdminOrgSpeakers(orgId: string): Promise<Speaker[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('speakers')
    .select('*')
    .eq('organization_id', orgId)
    .order('full_name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Speaker[]
}

export async function getSpeakerById(id: string): Promise<Speaker | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('speakers')
    .select('*')
    .eq('id', id)
    .single()

  return (data as Speaker | null) ?? null
}

export async function createSpeaker(orgId: string, input: SpeakerInput): Promise<Speaker> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('speakers')
    .insert({ ...input, organization_id: orgId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Speaker
}

export async function updateSpeaker(id: string, input: Partial<SpeakerInput>): Promise<Speaker> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('speakers')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Speaker
}

export async function archiveSpeaker(id: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('speakers')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}
