
// src/app/[locale]/layout.tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getDictionary, type Locale, type Dictionary } from '@/lib/getDictionary';

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
    const dictionary = await getDictionary(params.locale as Locale) as Dictionary;
    return {
        title: dictionary.TimeWiseAgro || 'ZottaEmp',
        description: dictionary.EmployeeManagementSystem || 'Employee Management System',
    };
}

export async function generateStaticParams(): Promise<{ locale: string }[]> {
    return [{ locale: 'en' }, { locale: 'it' }];
}

export default function LocaleLayout({
    children,
    params,
}: {
    children: ReactNode;
    params: { locale: string }; // Use string here
}) {
    // The `params.locale` (which will be 'en' or 'it') is available here.
    // We cast to Locale type if passing to functions/components that strictly expect it.
    return <>{children}</>;
}
