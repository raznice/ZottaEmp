
// src/app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css'; // Global styles imported here
import { AuthProvider } from '@/providers/auth-provider';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'ZottaEmp', // Default title, can be overridden by locale layout
    description: 'Employee Management System for Agrotourism ZottaEmp', // Default description
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: 'white' },
        { media: '(prefers-color-scheme: dark)', color: 'black' },
    ],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // This layout now renders <html> and <body> tags.
    // The lang attribute is set to 'it' as a default, assuming Italian is primary.
    // The [locale]/layout.tsx can override page-specific metadata like title and description.
    return (
        <html lang="it" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
            <body>
                <AuthProvider>
                    {children}
                    <Toaster />
                </AuthProvider>
            </body>
        </html>
    );
}
