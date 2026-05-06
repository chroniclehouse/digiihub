import type { Speaker } from '@/lib/types/database'

interface SpeakerCardProps {
  speaker: Speaker
  onClick: () => void
}

export default function SpeakerCard({ speaker, onClick }: SpeakerCardProps) {
  return (
    <button onClick={onClick} className="text-left group w-full">
      <div className="aspect-square rounded-lg bg-cream overflow-hidden mb-3">
        {speaker.photo_url ? (
          <img
            src={speaker.photo_url}
            alt={speaker.full_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-display text-4xl font-semibold text-navy/30">
              {speaker.full_name[0]}
            </span>
          </div>
        )}
      </div>
      <p className="font-semibold text-navy text-sm group-hover:text-terracotta transition-colors">
        {speaker.full_name}
      </p>
      {speaker.title && <p className="text-xs text-navy/60 mt-0.5">{speaker.title}</p>}
      {speaker.organization_name && (
        <p className="text-xs text-navy/40">{speaker.organization_name}</p>
      )}
    </button>
  )
}
