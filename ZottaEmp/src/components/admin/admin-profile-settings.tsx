// src/components/admin/admin-profile-settings.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/auth-provider';
import { initiateAdminProfileChange, confirmAdminProfileChange } from '@/lib/actions';
import { KeyRound, UserCog, ShieldAlert, CheckCircle } from 'lucide-react';
import type { Locale } from '@/lib/getDictionary';

// This type should ONLY contain the translation string keys.
type AdminProfileSettingsDictionary = {
    ErrorToastTitle: string;
    ActionNotAuthorizedError: string;
    ProvideUsernameOrPasswordError: string;
    VerificationRequestedToastTitle: string;
    CouldNotInitiateProfileChangeError: string;
    SuccessToastTitle: string;
    AdminCredsUpdatedToastMessage: string;
    VerificationFailToastTitle: string;
    CouldNotConfirmProfileChangeError: string;
    AdminProfileSettingsTitle: string;
    AdminProfileSettingsDescription: string;
    NewUsernameLabel: string;
    NewUsernamePlaceholder: string;
    NewPasswordLabel: string;
    PasswordPlaceholder: string;
    ConfirmNewPasswordLabel: string;
    PasswordsDoNotMatchError: string;
    InitiatingButton: string;
    InitiateChangesButton: string;
    VerificationRequiredMessagePart1: string;
    VerificationRequiredMessagePart2: string;
    TokenLabel: string;
    EnterVerificationTokenLabel: string;
    PasteTokenPlaceholder: string;
    ConfirmingButton: string;
    ConfirmChangesButton: string;
    CancelButton: string;
};

interface AdminProfileSettingsProps {
    dictionary: AdminProfileSettingsDictionary;
    locale: Locale;
}

// Schema definitions are outside the component
// They explicitly take `theDictionary` and `theLocale` as parameters.
const getProfileChangeSchema = (theDictionary: AdminProfileSettingsDictionary, theLocale: Locale) => z.object({
    newUsername: z.string().optional(),
    newPassword: z.string().min(6, theDictionary.NewPasswordLabel + (theLocale === 'it' ? ' deve essere di almeno 6 caratteri' : ' must be at least 6 characters')).optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: theDictionary.PasswordsDoNotMatchError,
    path: ["confirmPassword"],
}).refine(data => data.newUsername || data.newPassword, {
    message: theDictionary.ProvideUsernameOrPasswordError,
    path: ["newUsername"],
});

const getTokenSchema = (theDictionary: AdminProfileSettingsDictionary, theLocale: Locale) => z.object({
    token: z.string().min(1, theDictionary.TokenLabel + (theLocale === 'it' ? ' è obbligatorio/a' : ' is required')),
});


export function AdminProfileSettings({ dictionary, locale }: AdminProfileSettingsProps) {
    const { user, logout } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'initial' | 'verify'>('initial');
    const [verificationToken, setVerificationToken] = useState('');

    // Schemas are instantiated using the `dictionary` and `locale` props passed to the component.
    const profileChangeSchemaInstance = getProfileChangeSchema(dictionary, locale);
    const tokenSchemaInstance = getTokenSchema(dictionary, locale);

    const profileForm = useForm<z.infer<typeof profileChangeSchemaInstance>>({
        resolver: zodResolver(profileChangeSchemaInstance),
        defaultValues: { newUsername: '', newPassword: '', confirmPassword: '' },
    });

    const tokenForm = useForm<z.infer<typeof tokenSchemaInstance>>({
        resolver: zodResolver(tokenSchemaInstance),
        defaultValues: { token: '' },
    });

    const handleInitiateChange = async (values: z.infer<typeof profileChangeSchemaInstance>) => {
        if (!user || user.role !== 'admin') {
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.ActionNotAuthorizedError, variant: 'destructive' });
            return;
        }
        if (!values.newUsername && !values.newPassword) {
            profileForm.setError("root", { message: dictionary.ProvideUsernameOrPasswordError });
            return;
        }

        setIsLoading(true);
        try {
            const result = await initiateAdminProfileChange(user.id, values.newUsername, values.newPassword);
            if (result.success && result.token) {
                toast({ title: dictionary.VerificationRequestedToastTitle, description: result.message });
                setVerificationToken(result.token);
                setStep('verify');
            } else {
                toast({ title: dictionary.ErrorToastTitle, description: result.message, variant: 'destructive' });
            }
        } catch (error) {
            console.error("Failed to initiate profile change:", error);
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.CouldNotInitiateProfileChangeError, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmChange = async (values: z.infer<typeof tokenSchemaInstance>) => {
        if (!user || user.role !== 'admin') {
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.ActionNotAuthorizedError, variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        try {
            const result = await confirmAdminProfileChange(user.id, values.token);
            if (result.success) {
                toast({
                    title: dictionary.SuccessToastTitle,
                    description: dictionary.AdminCredsUpdatedToastMessage,
                    className: "bg-green-100 border-green-300 text-green-700",
                    action: <CheckCircle className="text-green-500" />
                });
                setStep('initial');
                profileForm.reset();
                tokenForm.reset();
                if (result.updatedUser && user.email !== result.updatedUser.email) {
                    setTimeout(() => logout(locale), 3000);
                }
            } else {
                toast({ title: dictionary.VerificationFailToastTitle, description: result.message, variant: 'destructive' });
            }
        } catch (error) {
            console.error("Failed to confirm profile change:", error);
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.CouldNotConfirmProfileChangeError, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <Card className="shadow-xl">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center"><UserCog className="mr-2 h-7 w-7 text-primary" />{dictionary.AdminProfileSettingsTitle}</CardTitle>
                <CardDescription>{dictionary.AdminProfileSettingsDescription}</CardDescription>
            </CardHeader>
            <CardContent>
                {step === 'initial' && (
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(handleInitiateChange)} className="space-y-6">
                            <FormField
                                control={profileForm.control}
                                name="newUsername"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dictionary.NewUsernameLabel}</FormLabel>
                                        <FormControl>
                                            <Input placeholder={dictionary.NewUsernamePlaceholder} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dictionary.NewPasswordLabel}</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder={dictionary.PasswordPlaceholder} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={profileForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dictionary.ConfirmNewPasswordLabel}</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder={dictionary.PasswordPlaceholder} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {profileForm.formState.errors.root && (
                                <p className="text-sm font-medium text-destructive">{profileForm.formState.errors.root.message}</p>
                            )}
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                                {isLoading ? dictionary.InitiatingButton : dictionary.InitiateChangesButton} <KeyRound className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </Form>
                )}

                {step === 'verify' && (
                    <div className="space-y-6">
                        <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-md">
                            <div className="flex items-start">
                                <ShieldAlert className="h-5 w-5 text-yellow-500 mr-2 shrink-0" />
                                <div>
                                    <h3 className="text-md font-semibold text-yellow-700">{dictionary.VerificationRequestedToastTitle}</h3>
                                    <p className="text-sm text-yellow-600">
                                        {dictionary.VerificationRequiredMessagePart1}
                                        <br />
                                        {dictionary.VerificationRequiredMessagePart2}
                                    </p>
                                    <p className="mt-2 text-sm font-mono bg-yellow-100 p-2 rounded break-all">
                                        <strong>{dictionary.TokenLabel}:</strong> {verificationToken}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Form {...tokenForm}>
                            <form onSubmit={tokenForm.handleSubmit(handleConfirmChange)} className="space-y-4">
                                <FormField
                                    control={tokenForm.control}
                                    name="token"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{dictionary.EnterVerificationTokenLabel}</FormLabel>
                                            <FormControl>
                                                <Input placeholder={dictionary.PasteTokenPlaceholder} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                                        {isLoading ? dictionary.ConfirmingButton : dictionary.ConfirmChangesButton} <CheckCircle className="ml-2 h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" onClick={() => { setStep('initial'); setVerificationToken(''); profileForm.reset(); tokenForm.reset(); }} className="w-full sm:w-auto">
                                        {dictionary.CancelButton}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
