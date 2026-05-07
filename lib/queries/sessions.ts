import { createClient } from '@/lib/supabase/server'
import type { Session, SessionInput, SessionSpeakerInput, SessionWithSpeakers } from '@/lib/types/database'

const SESSION_WITH_SPEAKERS_SELECT = `
  *,
  session_speakers (
    id,
    role,
    display_order,
    speaker:speakers ( id, full_name, title, photo_url )
  )
` as const

export async function getOrgSessions(orgId: string): Promise<Session[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('organization_id', orgId)
    .order('session_date', { ascending: true })
    .order('session_number', { ascending: true, nullsFirst: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Session[]
}

export async function getPublishedOrgSessionsBySlug(orgSlug: string): Promise<SessionWithSpeakers[]> {
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .eq('status', 'active')
    .single()

  if (!org) return []

  const { data, error } = await supabase
    .from('sessions')
    .select(SESSION_WITH_SPEAKERS_SELECT)
    .eq('organization_id', org.id)
    .eq('status', 'published')
    .order('session_date', { ascending: true })
    .order('session_number', { ascending: true, nullsFirst: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as SessionWithSpeakers[]
}

export async function getSessionWithSpeakers(id: string): Promise<SessionWithSpeakers | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('sessions')
    .select(SESSION_WITH_SPEAKERS_SELECT)
    .eq('id', id)
    .single()
  return (data as unknown as SessionWithSpeakers) ?? null
}

export async function createSession(
  orgId: string,
  input: SessionInput,
  speakers: SessionSpeakerInput[]
): Promise<Session> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .insert({ ...input, organization_id: orgId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  const session = data as Session

  if (speakers.length > 0) {
    const { error: ssError } = await supabase.from('session_speakers').insert(
      speakers.map((s) => ({
        session_id: session.id,
        speaker_id: s.speakerId,
        role: s.role,
        display_order: s.displayOrder,
      }))
    )
    if (ssError) throw new Error(ssError.message)
  }

  return session
}

export async function updateSession(
  id: string,
  input: SessionInput,
  speakers: SessionSpeakerInput[]
): Promise<Session> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sessions')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Replace session speakers
  await supabase.from('session_speakers').delete().eq('session_id', id)

  if (speakers.length > 0) {
    const { error: ssError } = await supabase.from('session_speakers').insert(
      speakers.map((s) => ({
        session_id: id,
        speaker_id: s.speakerId,
        role: s.role,
        display_order: s.displayOrder,
      }))
    )
    if (ssError) throw new Error(ssError.message)
  }

  return data as Session
}

export async function archiveSession(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'cancelled' })
    .eq('id', id)
  if (error) throw new Error(error.message)
}
