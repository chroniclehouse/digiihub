import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getHubOrg, getHubBranding } from '@/lib/queries/hub'
import { HUB_SECTIONS } from '@/lib/hub-sections'

interface PageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function HubPage({ params }: PageProps) {
  const { orgSlug } = await params

  const org = await getHubOrg(orgSlug)
  if (!org) notFound()

  const branding = await getHubBranding(org.id)
  const headline = branding?.eyebrow_text || org.name
  const subline = branding?.eyebrow_secondary

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">

      {/* Hero */}
      <div className="mb-14">
        {branding?.logo_primary_url && (
          <img
            src={branding.logo_primary_url}
            alt={org.name}
            className="h-14 w-auto object-contain mb-8"
          />
        )}
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-navy leading-tight mb-3">
          {headline}
        </h1>
        {subline && (
          <p className="text-lg text-navy/60">{subline}</p>
        )}
      </div>

      {/* Section links */}
      <div>
        <p className="font-mono text-xs tracking-widest text-navy/40 uppercase mb-5">Explore</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HUB_SECTIONS.map(({ label, slug, description }) => (
            <Link
              key={slug}
              href={`/hub/${orgSlug}/${slug}`}
              className="group bg-white border border-navy/10 rounded-lg p-6 hover:border-terracotta/40 hover:shadow-sm transition-all"
            >
              <p className="font-semibold text-navy group-hover:text-terracotta transition-colors mb-1">
                {label}
              </p>
              <p className="text-sm text-navy/50">{description}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
