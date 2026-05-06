interface HubPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function HubPage({ params }: HubPageProps) {
  const { orgSlug } = await params

  return (
    <div className="px-6 py-12 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl font-semibold text-navy mb-2">
        Hub
      </h1>
      <p className="font-mono text-sm text-navy/40">
        org: {orgSlug} — Hub sections — Phase 1
      </p>
    </div>
  )
}
