'use client'

import { createClient } from '@/lib/supabase/client'

const BUCKET = 'speaker-photos'

export async function uploadSpeakerPhoto(file: File, orgSlug: string): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${orgSlug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) throw new Error(`Photo upload failed: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function deleteSpeakerPhoto(publicUrl: string): Promise<void> {
  const supabase = createClient()
  const marker = `/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = publicUrl.slice(idx + marker.length)
  await supabase.storage.from(BUCKET).remove([path])
}
