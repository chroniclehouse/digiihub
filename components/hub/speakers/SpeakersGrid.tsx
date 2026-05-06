'use client'

import { useState } from 'react'
import type { Speaker } from '@/lib/types/database'
import SpeakerCard from './SpeakerCard'
import SpeakerModal from './SpeakerModal'

interface SpeakersGridProps {
  speakers: Speaker[]
}

export default function SpeakersGrid({ speakers }: SpeakersGridProps) {
  const [selected, setSelected] = useState<Speaker | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {speakers.map((speaker) => (
          <SpeakerCard key={speaker.id} speaker={speaker} onClick={() => setSelected(speaker)} />
        ))}
      </div>
      {selected && <SpeakerModal speaker={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
