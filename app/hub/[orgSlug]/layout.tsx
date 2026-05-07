import { notFound } from 'next/navigation'
import HubNav from '@/components/hub/HubNav'
import { getHubOrg, getHubBranding } from '@/lib/queries/hub'

interface HubLayoutProps {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}

export default async function HubLayout({ children, params }: HubLayoutProps) {
  const { orgSlug } = await params

  const org = await getHubOrg(orgSlug)
  if (!org) notFound()

  const branding = await getHubBranding(org.id)

  return (
    <div className="min-h-screen bg-paper">
      <HubNav org={org} branding={branding} />
      <main>{children}</main>
    </div>
  )
}
