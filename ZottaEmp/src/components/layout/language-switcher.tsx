
// src/components/layout/language-switcher.tsx
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import type { Dictionary, Locale } from '@/lib/getDictionary';

interface LanguageSwitcherProps {
    currentLocale: Locale;
    dictionary: Pick<Dictionary, 'LanguageLabel' | 'LanguageSwitcherEnglish' | 'LanguageSwitcherItalian'>;
}

export function LanguageSwitcher({ currentLocale, dictionary }: LanguageSwitcherProps) {
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (newLocale: Locale) => {
        if (!pathname) return;
        // Remove current locale prefix if present
        const pathWithoutLocale = pathname.startsWith(`/${currentLocale}`)
            ? pathname.substring(`/${currentLocale}`.length) || '/'
            : pathname;

        const newPath = `/${newLocale}${pathWithoutLocale}`;
        router.push(newPath);
        // router.refresh(); // Not always needed if server components re-fetch dictionary on path change
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label={dictionary.LanguageLabel} title={dictionary.LanguageLabel}>
                    <Languages className="h-5 w-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleLocaleChange('en')}
                    disabled={currentLocale === 'en'}
                >
                    {dictionary.LanguageSwitcherEnglish}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleLocaleChange('it')}
                    disabled={currentLocale === 'it'}
                >
                    {dictionary.LanguageSwitcherItalian}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
