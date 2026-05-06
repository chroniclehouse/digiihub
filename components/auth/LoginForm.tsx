'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LoginFormProps {
  redirectTo: string
  initialError?: string
}

type Mode = 'password' | 'magic-link'

function mapError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Incorrect email or password.'
  if (message.includes('Email not confirmed')) return 'Confirm your email first — check your inbox.'
  if (message.includes('rate limit')) return 'Too many attempts. Wait a few minutes and try again.'
  if (message.includes('link_expired')) return 'That sign-in link has expired. Request a new one.'
  return 'Something went wrong. Try again.'
}

export default function LoginForm({ redirectTo, initialError }: LoginFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<Mode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(mapError(error.message))
      setLoading(false)
      return
    }

    router.refresh()
    router.push(redirectTo)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl },
    })

    if (error) {
      setError(mapError(error.message))
      setLoading(false)
      return
    }

    setMagicLinkSent(true)
    setLoading(false)
  }

  if (magicLinkSent) {
    return (
      <div className="bg-white rounded-xl border border-navy/10 p-8 shadow-sm text-center">
        <p className="font-display text-xl text-navy mb-2">Check your inbox</p>
        <p className="text-sm text-navy/60 mb-6">
          We sent a sign-in link to <span className="font-medium text-navy">{email}</span>.
          Click it to access your hub.
        </p>
        <button
          onClick={() => { setMagicLinkSent(false); setError(null) }}
          className="text-sm font-mono text-terracotta hover:text-terracotta/80 transition-colors"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-navy/10 p-8 shadow-sm">
      <h2 className="font-display text-xl font-semibold text-navy mb-6">
        {mode === 'password' ? 'Sign in' : 'Sign in with a magic link'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded mb-5">
          {error}
        </div>
      )}

      <form onSubmit={mode === 'password' ? handlePassword : handleMagicLink} className="space-y-4">
        <div>
          <label className="font-mono text-xs tracking-widest text-navy/50 uppercase block mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full border border-navy/20 rounded px-3 py-2 text-sm text-navy bg-white focus:outline-none focus:border-navy/50"
          />
        </div>

        {mode === 'password' && (
          <div>
            <label className="font-mono text-xs tracking-widest text-navy/50 uppercase block mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-navy/20 rounded px-3 py-2 text-sm text-navy bg-white focus:outline-none focus:border-navy/50"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy text-white py-2 rounded text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50 mt-2"
        >
          {loading
            ? 'Signing in...'
            : mode === 'password'
            ? 'Sign in'
            : 'Send magic link'}
        </button>
      </form>

      <div className="mt-5 pt-5 border-t border-navy/10 text-center">
        {mode === 'password' ? (
          <button
            onClick={() => { setMode('magic-link'); setError(null) }}
            className="text-sm text-navy/50 hover:text-navy transition-colors"
          >
            Sign in with a magic link instead
          </button>
        ) : (
          <button
            onClick={() => { setMode('password'); setError(null) }}
            className="text-sm text-navy/50 hover:text-navy transition-colors"
          >
            Sign in with password instead
          </button>
        )}
      </div>
    </div>
  )
}
