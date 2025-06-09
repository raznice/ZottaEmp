
// src/providers/auth-provider.tsx
'use client';

import type { User } from '@/lib/types';
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '@/lib/auth';
import type { LoginFormData } from '@/lib/types';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Locale } from '@/lib/getDictionary';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: LoginFormData, locale: Locale) => Promise<User | null>;
    logout: (locale: Locale) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const initializeAuth = () => {
            const currentUser = getCurrentUser();
            setUser(currentUser);
            setIsLoading(false);
        };
        initializeAuth();
    }, []);

    const login = useCallback(async (credentials: LoginFormData, locale: Locale) => {
        setIsLoading(true);
        const loggedInUser = apiLogin(credentials);
        setUser(loggedInUser);
        setIsLoading(false);
        if (loggedInUser) {
            const targetPath = loggedInUser.role === 'admin' ? `/${locale}/admin/dashboard` : `/${locale}/employee/dashboard`;
            router.push(targetPath);
        }
        return loggedInUser;
    }, [router]);

    const logout = useCallback((locale: Locale) => {
        apiLogout();
        setUser(null);
        router.push(`/${locale}/`);
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
