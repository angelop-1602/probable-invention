import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the authentication in localStorage
  const session = request.cookies.get('session');
  const isAuthPage = request.nextUrl.pathname.startsWith('/rec-chair/auth');
  
  // For debugging - don't interfere with the authentication flow for now
  return NextResponse.next();
}

// Only run middleware on the REC Chair paths
export const config = {
  matcher: ['/rec-chair/:path*'],
}; 