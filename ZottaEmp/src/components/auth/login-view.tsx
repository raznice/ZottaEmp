
// src/components/auth/login-view.tsx
'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { Dictionary, Locale } from '@/lib/getDictionary';

// Using Pick for a more specific dictionary type
type LoginViewDictionary = Pick<Dictionary,
    'Loading' |
    'LoginPageDescription' | // For image alt
    // Props for LoginForm
    'ZottaEmpLogin' |
    'EmailLabel' |
    'EmailPlaceholder' |
    'PasswordLabel' |
    'PasswordPlaceholder' |
    'LoginButton' |
    'LoggingInButton' |
    'LoginFailedError' |
    'UnexpectedError' |
    'ShowPassword' |
    'HidePassword'
>;

interface LoginViewProps {
    dictionary: LoginViewDictionary;
    locale: Locale;
}

export function LoginView({ dictionary, locale }: LoginViewProps) {
    const { user, isLoading: authIsLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authIsLoading && user) {
            const targetPath = user.role === 'admin' ? `/${locale}/admin/dashboard` : `/${locale}/employee/dashboard`;
            router.replace(targetPath);
        }
    }, [user, authIsLoading, router, locale]);

    if (authIsLoading || (!authIsLoading && user)) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">{dictionary.Loading}</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-primary/20 p-4">
            <div className="absolute inset-0 opacity-50">
                <Image
                    src="https://placehold.co/1920x1080.png"
                    alt={dictionary.LoginPageDescription}
                    layout="fill"
                    objectFit="cover"
                    quality={75}
                    data-ai-hint="agriculture landscape"
                />
            </div>
            <div className="relative z-10 flex flex-col items-center">
                <div className="mb-6">
                    <Image
                        src="/zotta-logo.png"
                        alt={dictionary.ZottaEmpLogin} // Use a relevant dictionary key for alt
                        width={120}
                        height={104}
                        className="object-contain"
                        data-ai-hint="company logo"
                    />
                </div>
                <LoginForm dictionary={dictionary} locale={locale} />
            </div>
        </div>
    );
}
