export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-paper">
      {/* Sidebar — Phase 2 */}
      <aside className="w-64 bg-navy text-white flex-shrink-0">
        <div className="p-6 border-b border-white/10">
          <p className="font-mono text-xs tracking-widest text-terracotta uppercase mb-1">
            Chronicle House
          </p>
          <p className="font-display text-lg font-semibold text-cream">
            DigiiHub
          </p>
        </div>
        <nav className="p-4">
          <p className="font-mono text-xs text-white/30 mt-4">
            Admin nav — Phase 2
          </p>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
