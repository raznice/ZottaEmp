
import { NextResponse, type NextRequest } from 'next/server';
import type { Locale } from '@/lib/getDictionary'; // Assuming Locale is 'en' | 'it'

const PUBLIC_FILE = /\.(.*)$/; // Matches files with extensions like .jpg, .svg, etc.
const DEFAULT_LOCALE: Locale = 'it';
const SUPPORTED_LOCALES: Locale[] = ['en', 'it'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for public files, API routes, and Next.js internals
    if (
        PUBLIC_FILE.test(pathname) ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('/favicon.ico')
    ) {
        return NextResponse.next();
    }

    // Check if the pathname already has a supported locale prefix
    const pathnameHasLocale = SUPPORTED_LOCALES.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    if (pathnameHasLocale) {
        return NextResponse.next();
    }

    // If no locale, redirect to the default locale
    // Prepend the default locale to the pathname
    const newPathname = `/${DEFAULT_LOCALE}${pathname.startsWith('/') ? '' : '/'}${pathname}`.replace(/\/\//g, '/');
    const url = request.nextUrl.clone();
    url.pathname = newPathname;

    return NextResponse.redirect(url);
}

export const config = {
    matcher: [
        // Match all paths except API routes, Next.js static files, Next.js image optimization files, and files with extensions (e.g., .ico, .png)
        '/((?!api|_next/static|_next/image|.*\\..*).*)',
    ],
};
