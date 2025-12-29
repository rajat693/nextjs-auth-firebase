import { NextResponse } from 'next/server';

export async function proxy(request) {
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
  
  // Allow request to continue
  // Verification will happen in API routes
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