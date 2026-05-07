'use server'

import { revalidatePath } from 'next/cache'
import { createSession, updateSession, archiveSession } from '@/lib/queries/sessions'
import type { SessionInput, SessionSpeakerInput } from '@/lib/types/database'

function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return new Error(String((err as { message: unknown }).message))
  }
  return new Error('An unexpected error occurred.')
}

export async function createSessionAction(
  orgId: string,
  input: SessionInput,
  speakers: SessionSpeakerInput[]
): Promise<{ id: string }> {
  try {
    const session = await createSession(orgId, input, speakers)
    return { id: session.id }
  } catch (err) {
    throw toError(err)
  }
}

export async function updateSessionAction(
  id: string,
  input: SessionInput,
  speakers: SessionSpeakerInput[]
): Promise<void> {
  try {
    await updateSession(id, input, speakers)
  } catch (err) {
    throw toError(err)
  }
}

export async function archiveSessionAction(id: string, orgSlug: string): Promise<void> {
  try {
    await archiveSession(id)
    revalidatePath(`/admin/${orgSlug}/sessions`)
  } catch (err) {
    throw toError(err)
  }
}
