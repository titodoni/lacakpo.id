import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from './lib/auth';

// Auth middleware for Project tracking
// Note: Next.js 16+ shows a deprecation warning but this pattern still works
// The "proxy" alternative requires different architecture

export async function middleware(request: NextRequest) {
  const session = await getIronSession(request.cookies, sessionOptions);

  const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout'];
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Allow public assets and API routes that handle their own auth
  if (
    request.nextUrl.pathname.startsWith('/_next') || 
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/api/') && isPublicPath
  ) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated and not on public path
  if (!session.isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if already logged in and trying to access login
  if (session.isLoggedIn && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Config uses the matcher pattern
// This is still the recommended way despite the deprecation warning
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
