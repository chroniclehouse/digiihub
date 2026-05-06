import LoginForm from '@/components/auth/LoginForm'

interface PageProps {
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { redirectTo, error } = await searchParams
  const dest = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/admin'
  const initialError = error === 'link_expired' ? 'That sign-in link has expired. Request a new one.' : undefined

  return <LoginForm redirectTo={dest} initialError={initialError} />
}
