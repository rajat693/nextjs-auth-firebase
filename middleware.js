import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get session cookie
  const session = request.cookies.get('session');
  
  // Public paths that don't require authentication
  const isPublicPath = pathname === '/login';
  
  // If accessing login page and already has session, redirect to dashboard
  if (isPublicPath && session) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If accessing protected route without session, redirect to login
  if (!isPublicPath && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // For protected routes with session, verify the session cookie
  if (!isPublicPath && session) {
    try {
      // Verify session cookie with Firebase Admin (optional but recommended)
      // Note: This requires calling an API route since we can't use Firebase Admin directly in middleware
      const verifyResponse = await fetch(new URL('/api/auth/verify', request.url), {
        headers: {
          Cookie: `session=${session.value}`,
        },
      });
      
      if (!verifyResponse.ok) {
        // Invalid session, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      // On error, allow request to continue (fail open) or redirect to login (fail closed)
      // For security, we'll redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};