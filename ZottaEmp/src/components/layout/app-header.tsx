
// src/components/layout/app-header.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { LogOut, UserCircle, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { LanguageSwitcher } from '../layout/language-switcher';
import type { Dictionary, Locale } from '@/lib/getDictionary';

// Using Pick for a more specific dictionary type
type AppHeaderDictionary = Pick<Dictionary,
    'TimeWiseAgro' |
    'UserRoleAdmin' |
    'UserRoleEmployee' |
    'ToggleTheme' |
    'Logout' |
    'LanguageLabel' |
    'LanguageSwitcherEnglish' |
    'LanguageSwitcherItalian'
>;

interface AppHeaderProps {
    dictionary: AppHeaderDictionary;
    locale: Locale;
}

export function AppHeader({ dictionary, locale }: AppHeaderProps) {
    const { user, logout } = useAuth();
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;
        const currentThemeIsDark = root.classList.contains('dark');
        setIsDarkMode(currentThemeIsDark);
    }, []);

    const toggleTheme = () => {
        const root = window.document.documentElement;
        root.classList.toggle('dark');
        root.classList.toggle('light', !root.classList.contains('dark'));
        setIsDarkMode(!isDarkMode);
    };

    const baseDashboardPath = user?.role === 'admin' ? `/${locale}/admin/dashboard` : `/${locale}/employee/dashboard`;

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href={baseDashboardPath} className="flex items-center space-x-2">
                    <Image src="/zotta-logo.png" alt={dictionary.TimeWiseAgro} width={40} height={35} className="object-contain" data-ai-hint="company logo" />
                    <span className="text-2xl font-bold text-primary hidden sm:inline">
                        {dictionary.TimeWiseAgro}
                    </span>
                </Link>
                <div className="flex items-center space-x-2 md:space-x-4">
                    {user && (
                        <div className="flex items-center space-x-2 text-sm">
                            <UserCircle className="h-5 w-5 text-muted-foreground" />
                            <span>{user.name} ({user.role === 'admin' ? dictionary.UserRoleAdmin : dictionary.UserRoleEmployee})</span>
                        </div>
                    )}
                    <LanguageSwitcher
                        currentLocale={locale}
                        dictionary={{
                            LanguageLabel: dictionary.LanguageLabel,
                            LanguageSwitcherEnglish: dictionary.LanguageSwitcherEnglish,
                            LanguageSwitcherItalian: dictionary.LanguageSwitcherItalian,
                        }}
                    />
                    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label={dictionary.ToggleTheme} title={dictionary.ToggleTheme}>
                        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => logout(locale)}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {dictionary.Logout}
                    </Button>
                </div>
            </div>
        </header>
    );
}
