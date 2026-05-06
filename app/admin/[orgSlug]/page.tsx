interface AdminOrgPageProps {
  params: Promise<{ orgSlug: string }>
}

export default async function AdminOrgPage({ params }: AdminOrgPageProps) {
  const { orgSlug } = await params

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-navy mb-2">Dashboard</h1>
      <p className="font-mono text-sm text-navy/40">{orgSlug} — Phase 2</p>
    </div>
  )
}
