'use server'

import { revalidatePath } from 'next/cache'
import { createSpeaker, updateSpeaker, archiveSpeaker } from '@/lib/queries/speakers'
import type { SpeakerInput } from '@/lib/types/database'

function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return new Error(String((err as { message: unknown }).message))
  }
  return new Error('An unexpected error occurred.')
}

export async function createSpeakerAction(
  orgId: string,
  input: SpeakerInput
): Promise<{ id: string }> {
  try {
    const speaker = await createSpeaker(orgId, input)
    return { id: speaker.id }
  } catch (err) {
    throw toError(err)
  }
}

export async function updateSpeakerAction(
  id: string,
  input: Partial<SpeakerInput>
): Promise<void> {
  try {
    await updateSpeaker(id, input)
  } catch (err) {
    throw toError(err)
  }
}

export async function archiveSpeakerAction(id: string, orgSlug: string): Promise<void> {
  try {
    await archiveSpeaker(id)
    revalidatePath(`/admin/${orgSlug}/speakers`)
  } catch (err) {
    throw toError(err)
  }
}
