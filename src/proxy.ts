import { NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get('next-auth.session-token') ??
    request.cookies.get('__Secure-next-auth.session-token');

  const protectedRoutes = ['/admin', '/host', '/hod', '/principal', '/student'];
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/host/:path*',
    '/hod/:path*',
    '/principal/:path*',
    '/student/:path*',
  ],
};
