export default function HubLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Hub nav — Phase 1 */}
      <header className="bg-navy text-white px-6 py-4">
        <p className="font-mono text-xs text-white/40">
          Hub nav — Phase 1
        </p>
      </header>
      <main>{children}</main>
    </div>
  )
}
