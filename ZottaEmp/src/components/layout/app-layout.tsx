// src/components/layout/app-layout.tsx
'use client';

import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AppHeader } from './app-header';
import { AppSidebar } from './app-sidebar';
import type { Dictionary, Locale } from '@/lib/getDictionary';

interface AppLayoutProps {
    children: React.ReactNode;
    allowedRoles: Array<'employee' | 'admin'>;
    locale: Locale;
    dictionary: Dictionary; // Accept dictionary as a prop
}

export function AppLayout({ children, allowedRoles, locale, dictionary }: AppLayoutProps) {
    const { user, isLoading: authIsLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authIsLoading && (!user || (user && !allowedRoles.includes(user.role)))) {
            router.replace(`/${locale}/`);
        }
    }, [user, authIsLoading, router, allowedRoles, locale]);

    if (authIsLoading || !dictionary || !user || (user && !allowedRoles.includes(user.role))) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    // Pass dictionary and locale to children if they are client components needing it
    const childrenWithProps = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            // @ts-ignore - Attempt to pass props; child components should be robust
            return React.cloneElement(child, { dictionary, locale });
        }
        return child;
    });

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <AppHeader dictionary={dictionary} locale={locale} />
            <div className="flex flex-1">
                <AppSidebar dictionary={dictionary} locale={locale} />
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {childrenWithProps}
                </main>
            </div>
        </div>
    );
}
