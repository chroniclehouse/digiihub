import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface AdminOrgLayoutProps {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}

export default async function AdminOrgLayout({ children, params }: AdminOrgLayoutProps) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single()

  if (!org) redirect('/admin')

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('organization_id', org.id)
    .in('role', ['admin', 'collaborator'])
    .eq('status', 'active')
    .single()

  if (!membership) redirect('/admin')

  const navLinks = [
    { href: `/admin/${orgSlug}`, label: 'Dashboard' },
    { href: `/admin/${orgSlug}/speakers`, label: 'Speakers' },
    { href: `/admin/${orgSlug}/sessions`, label: 'Sessions' },
  ]

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="w-64 bg-navy text-white flex-shrink-0">
        <div className="p-6 border-b border-white/10">
          <p className="font-mono text-xs tracking-widest text-terracotta uppercase mb-1">
            {org.name}
          </p>
          <p className="font-display text-lg font-semibold text-cream">Admin</p>
        </div>
        <nav className="p-4 space-y-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2 rounded text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
