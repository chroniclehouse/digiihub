'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HUB_SECTIONS } from '@/lib/hub-sections'
import type { HubOrg, HubBranding } from '@/lib/queries/hub'

interface HubNavProps {
  org: HubOrg
  branding: HubBranding | null
}

export default function HubNav({ org, branding }: HubNavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const base = `/hub/${org.slug}`
  const wordmark = branding?.eyebrow_text || org.name

  const isActive = (slug: string) =>
    pathname === `${base}/${slug}` || pathname.startsWith(`${base}/${slug}/`)

  return (
    <header className="bg-white border-b border-navy/10 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-6">

        {/* Wordmark / Logo */}
        <Link href={base} className="flex items-center gap-3 flex-shrink-0">
          {branding?.logo_primary_url ? (
            <img
              src={branding.logo_primary_url}
              alt={org.name}
              className="h-8 w-auto object-contain"
            />
          ) : (
            <span className="font-display text-lg font-semibold text-navy leading-none">
              {wordmark}
            </span>
          )}
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          {HUB_SECTIONS.map(({ label, slug }) => (
            <Link
              key={slug}
              href={`${base}/${slug}`}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                isActive(slug)
                  ? 'text-terracotta'
                  : 'text-navy/60 hover:text-navy'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 -mr-2 flex flex-col justify-center gap-[5px]"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span
            className={`block w-5 h-px bg-navy origin-center transition-transform duration-200 ${
              menuOpen ? 'rotate-45 translate-y-[6px]' : ''
            }`}
          />
          <span
            className={`block w-5 h-px bg-navy transition-opacity duration-200 ${
              menuOpen ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block w-5 h-px bg-navy origin-center transition-transform duration-200 ${
              menuOpen ? '-rotate-45 -translate-y-[6px]' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="sm:hidden bg-white border-t border-navy/10 px-6 py-2">
          {HUB_SECTIONS.map(({ label, slug }) => (
            <Link
              key={slug}
              href={`${base}/${slug}`}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center py-3 text-sm font-medium border-b border-navy/5 last:border-0 transition-colors ${
                isActive(slug) ? 'text-terracotta' : 'text-navy/70 hover:text-navy'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
