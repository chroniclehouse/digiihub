'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { uploadSpeakerPhoto } from '@/lib/storage/media'
import { createSpeakerAction, updateSpeakerAction } from '@/lib/actions/speakers'
import type { Speaker, SpeakerLink } from '@/lib/types/database'

interface SpeakerFormProps {
  orgSlug: string
  orgId: string
  speaker?: Speaker
}

export default function SpeakerForm({ orgSlug, orgId, speaker }: SpeakerFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEdit = !!speaker

  const [fullName, setFullName] = useState(speaker?.full_name ?? '')
  const [title, setTitle] = useState(speaker?.title ?? '')
  const [orgName, setOrgName] = useState(speaker?.organization_name ?? '')
  const [bio, setBio] = useState(speaker?.bio ?? '')
  const [photoUrl, setPhotoUrl] = useState(speaker?.photo_url ?? '')
  const [links, setLinks] = useState<SpeakerLink[]>(speaker?.links ?? [])

  const [photoUploading, setPhotoUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    setError(null)
    try {
      const url = await uploadSpeakerPhoto(file, orgSlug)
      setPhotoUrl(url)
    } catch {
      setError('Photo upload failed. Try again.')
    } finally {
      setPhotoUploading(false)
    }
  }

  const addLink = () => setLinks([...links, { label: '', url: '' }])
  const removeLink = (i: number) => setLinks(links.filter((_, idx) => idx !== i))
  const updateLink = (i: number, field: keyof SpeakerLink, value: string) =>
    setLinks(links.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    setIsSubmitting(true)
    setError(null)

    const input = {
      full_name: fullName.trim(),
      title: title.trim() || null,
      organization_name: orgName.trim() || null,
      photo_url: photoUrl || null,
      bio: bio.trim() || null,
      links: links.filter((l) => l.label.trim() && l.url.trim()),
    }

    try {
      if (isEdit) {
        await updateSpeakerAction(speaker.id, input)
      } else {
        await createSpeakerAction(orgId, input)
      }
      router.push(`/admin/${orgSlug}/speakers`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Photo */}
      <div>
        <p className="font-mono text-xs tracking-widest text-navy/50 uppercase mb-2">Photo</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-cream flex-shrink-0 overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="Speaker photo preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display text-2xl font-semibold text-navy/30">
                {fullName ? fullName[0].toUpperCase() : '?'}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="text-sm font-mono text-terracotta hover:text-terracotta/80 transition-colors disabled:opacity-50"
            >
              {photoUploading ? 'Uploading...' : photoUrl ? 'Change photo' : 'Upload photo'}
            </button>
            <p className="text-xs text-navy/40 mt-0.5">JPG, PNG, or WebP — max 5 MB. Square crop works best.</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {/* Full name */}
      <div>
        <label className="font-mono text-xs tracking-widest text-navy/50 uppercase block mb-1">
          Full name <span className="text-terracotta">*</span>
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Dr. Amara Osei"
          className="w-full border border-navy/20 rounded px-3 py-2 text-sm text-navy bg-white focus:outline-none focus:border-navy/50"
        />
      </div>

      {/* Title */}
      <div>
        <label className="font-mono text-xs tracking-widest text-navy/50 uppercase block mb-1">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Executive Director"
          className="w-full border border-navy/20 rounded px-3 py-2 text-sm text-navy bg-white focus:outline-none focus:border-navy/50"
        />
      </div>

      {/* Organization */}
      <div>
        <label className="font-mono text-xs tracking-widest text-navy/50 uppercase block mb-1">
          Organization
        </label>
        <input
          type="text"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Chronicle House"
          className="w-full border border-navy/20 rounded px-3 py-2 text-sm text-navy bg-white focus:outline-none focus:border-navy/50"
        />
        <p className="text-xs text-navy/40 mt-1">
          Their employer or affiliated org — separate from this hub.
        </p>
      </div>

      {/* Bio */}
      <div>
        <label className="font-mono text-xs tracking-widest text-navy/50 uppercase block mb-1">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={5}
          placeholder="A few sentences about this speaker's background and expertise..."
          className="w-full border border-navy/20 rounded px-3 py-2 text-sm text-navy bg-white focus:outline-none focus:border-navy/50 resize-y"
        />
      </div>

      {/* Links */}
      <div>
        <p className="font-mono text-xs tracking-widest text-navy/50 uppercase mb-2">Links</p>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={link.label}
                onChange={(e) => updateLink(i, 'label', e.target.value)}
                placeholder="LinkedIn"
                className="w-28 border border-navy/20 rounded px-3 py-2 text-sm text-navy bg-white focus:outline-none focus:border-navy/50"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
                placeholder="https://..."
                className="flex-1 border border-navy/20 rounded px-3 py-2 text-sm text-navy bg-white focus:outline-none focus:border-navy/50"
              />
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="text-navy/30 hover:text-red-400 transition-colors text-xl leading-none px-1"
                aria-label="Remove link"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLink}
          className="mt-2 text-sm font-mono text-terracotta hover:text-terracotta/80 transition-colors"
        >
          + Add link
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-navy/10">
        <button
          type="submit"
          disabled={isSubmitting || photoUploading}
          className="bg-navy text-white px-6 py-2 rounded text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add speaker'}
        </button>
        <Link
          href={`/admin/${orgSlug}/speakers`}
          className="text-sm text-navy/50 hover:text-navy transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
