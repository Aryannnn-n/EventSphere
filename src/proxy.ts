import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './lib/auth.config';

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  // Protect dashboards
  const rolePaths: Record<string, string> = {
    '/admin': 'ADMIN',
    '/hod': 'HOD',
    '/host': 'HOST',
    '/principal': 'PRINCIPAL',
    '/student': 'STUDENT',
  };

  const userRole = (req.auth?.user?.role || (req.auth as any)?.role)?.toUpperCase();

  for (const [path, requiredRole] of Object.entries(rolePaths)) {
    if (pathname.startsWith(path)) {
      if (!isLoggedIn) {
        return pathname.startsWith('/api') 
          ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
          : NextResponse.redirect(new URL('/login', req.nextUrl));
      }
      if (userRole !== requiredRole) {
        // Redirect unauthorized users to their own dashboard, or home if unknown
        const correctPath = Object.keys(rolePaths).find(key => rolePaths[key] === userRole) || '/';
        return pathname.startsWith('/api')
          ? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          : NextResponse.redirect(new URL(correctPath, req.nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
