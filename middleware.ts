import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const { nextUrl } = request
  const hostname = request.headers.get('host') || ''

  // Strip port numbers for local dev
  const host = hostname.replace(/:\d+$/, '')

  const appDomain =
    process.env.NEXT_PUBLIC_APP_DOMAIN || 'digiihubapp.netlify.app'

  // Subdomain routing: org-slug.digiihubapp.netlify.app → /hub/[orgSlug]
  const isRootDomain = host === appDomain || host === 'localhost'
  const isSubdomain =
    !isRootDomain &&
    host !== `www.${appDomain}` &&
    host.endsWith(`.${appDomain}`)

  if (isSubdomain) {
    const orgSlug = host.replace(`.${appDomain}`, '')
    const rewriteUrl = new URL(
      `/hub/${orgSlug}${nextUrl.pathname}${nextUrl.search}`,
      request.url
    )
    return NextResponse.rewrite(rewriteUrl)
  }

  // Protect /admin routes — redirect to login if not authenticated
  if (nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if (
    user &&
    (nextUrl.pathname === '/login' || nextUrl.pathname === '/signup')
  ) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
