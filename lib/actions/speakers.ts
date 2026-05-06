'use server'

import { revalidatePath } from 'next/cache'
import { createSpeaker, updateSpeaker, archiveSpeaker } from '@/lib/queries/speakers'
import type { SpeakerInput } from '@/lib/types/database'

export async function createSpeakerAction(
  orgId: string,
  input: SpeakerInput
): Promise<{ id: string }> {
  const speaker = await createSpeaker(orgId, input)
  return { id: speaker.id }
}

export async function updateSpeakerAction(
  id: string,
  input: Partial<SpeakerInput>
): Promise<void> {
  await updateSpeaker(id, input)
}

export async function archiveSpeakerAction(id: string, orgSlug: string): Promise<void> {
  await archiveSpeaker(id)
  revalidatePath(`/admin/${orgSlug}/speakers`)
}
