export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="font-mono text-xs tracking-widest text-terracotta uppercase mb-2">
            Chronicle House
          </p>
          <h1 className="font-display text-3xl font-semibold text-navy">
            DigiiHub
          </h1>
        </div>
        {children}
      </div>
    </div>
  )
}
