'use client'

import { useEffect } from 'react'
import type { Speaker } from '@/lib/types/database'

interface SpeakerModalProps {
  speaker: Speaker
  onClose: () => void
}

export default function SpeakerModal({ speaker, onClose }: SpeakerModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-navy/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-navy/30 hover:text-navy transition-colors text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>

        <div className="flex items-start gap-5 mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-cream flex-shrink-0">
            {speaker.photo_url ? (
              <img
                src={speaker.photo_url}
                alt={speaker.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-display text-2xl font-semibold text-navy/30">
                {speaker.full_name[0]}
              </div>
            )}
          </div>
          <div className="pt-1">
            <h2 className="font-display text-2xl font-semibold text-navy leading-tight">
              {speaker.full_name}
            </h2>
            {speaker.title && (
              <p className="text-sm text-navy/60 mt-0.5">{speaker.title}</p>
            )}
            {speaker.organization_name && (
              <p className="text-sm text-navy/40">{speaker.organization_name}</p>
            )}
          </div>
        </div>

        {speaker.bio && (
          <p className="text-sm text-navy/80 leading-relaxed mb-6 whitespace-pre-line">
            {speaker.bio}
          </p>
        )}

        {speaker.links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {speaker.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-terracotta border border-terracotta/30 px-3 py-1.5 rounded hover:bg-terracotta/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
