
// src/components/auth/login-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/providers/auth-provider';
import { useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import type { Dictionary, Locale } from '@/lib/getDictionary';

// Using Pick for a more specific dictionary type
type LoginFormDictionary = Pick<Dictionary,
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

interface LoginFormProps {
    dictionary: LoginFormDictionary;
    locale: Locale;
}

const getLoginSchema = (dictionary: LoginFormDictionary, locale: Locale) => z.object({
    email: z.string().min(1, { message: dictionary.EmailLabel + (locale === 'it' ? " è obbligatorio/a." : " is required.") }),
    password: z.string().min(1, { message: dictionary.PasswordLabel + (locale === 'it' ? " è obbligatorio/a." : " is required.") }),
});

type LoginFormValues = z.infer<ReturnType<typeof getLoginSchema>>;

export function LoginForm({ dictionary, locale }: LoginFormProps) {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const loginSchema = getLoginSchema(dictionary, locale);

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            const user = await login(data, locale);
            if (!user) {
                form.setError('root', { type: 'manual', message: dictionary.LoginFailedError });
            }
            // Navigation is handled by AuthProvider
        } catch (error) {
            form.setError('root', { type: 'manual', message: dictionary.UnexpectedError });
            console.error('Login error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-xl">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-center text-primary">{dictionary.ZottaEmpLogin}</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dictionary.EmailLabel}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={dictionary.EmailPlaceholder} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dictionary.PasswordLabel}</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type={showPassword ? 'text' : 'password'} placeholder={dictionary.PasswordPlaceholder} {...field} />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute inset-y-0 right-0 h-full px-3"
                                                onClick={() => setShowPassword(!showPassword)}
                                                title={showPassword ? dictionary.HidePassword : dictionary.ShowPassword}
                                            >
                                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                <span className="sr-only">{showPassword ? dictionary.HidePassword : dictionary.ShowPassword}</span>
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {form.formState.errors.root && (
                            <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? dictionary.LoggingInButton : dictionary.LoginButton}
                            {!isLoading && <LogIn className="ml-2 h-4 w-4" />}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
