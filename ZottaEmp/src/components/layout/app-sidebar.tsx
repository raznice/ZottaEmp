
// src/components/layout/app-sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Users, History } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import type { Dictionary, Locale } from '@/lib/getDictionary';

// Using Pick for a more specific dictionary type
type AppSidebarDictionary = Pick<Dictionary,
    'AllEmployeesNav' |
    'MyDashboard' |
    'MyWorkLogLink' |
    'Copyright'
>;

interface AppSidebarProps {
    dictionary: AppSidebarDictionary;
    locale: Locale;
}

interface NavItem {
    href: string;
    labelKey: keyof AppSidebarDictionary;
    icon: React.ElementType;
}

export function AppSidebar({ dictionary, locale }: AppSidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();

    if (!user) return null;

    const roleSpecificNavItems: NavItem[] = user.role === 'admin' ? [
        { href: `/${locale}/admin/dashboard`, labelKey: "AllEmployeesNav", icon: Users },
    ] : [
        { href: `/${locale}/employee/dashboard`, labelKey: "MyDashboard", icon: Home },
    ];

    return (
        <aside className="fixed top-16 left-0 z-30 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r bg-background md:sticky md:block">
            <div className="flex h-full flex-col p-4">
                <nav className="flex-grow">
                    <ul className="space-y-2">
                        {roleSpecificNavItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                                        pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-foreground/70'
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{dictionary[item.labelKey]}</span>
                                </Link>
                            </li>
                        ))}
                        {user.role === 'employee' && (
                            <li>
                                <Link
                                    href={`/${locale}/employee/dashboard#work-history`}
                                    className={cn(
                                        'flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                                        pathname.endsWith('#work-history') ? 'bg-accent text-accent-foreground' : 'text-foreground/70'
                                    )}
                                >
                                    <History className="h-5 w-5" />
                                    <span>{dictionary.MyWorkLogLink}</span>
                                </Link>
                            </li>
                        )}
                    </ul>
                </nav>
                <div className="mt-auto p-2 text-center text-xs text-muted-foreground">
                    {dictionary.Copyright.replace('{year}', new Date().getFullYear().toString())}
                </div>
            </div>
        </aside>
    );
}
