// src/components/admin/employee-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { User, EmployeeFormData } from '@/lib/types';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Dictionary, Locale } from '@/lib/getDictionary';

// Using Pick for a more specific dictionary type
type EmployeeFormDictionary = Pick<Dictionary,
    'FullNameLabel' |
    'UsernameEmailLabel' |
    'PasswordLabel' | // Used in schema
    'EditEmployee' |
    'AddEmployee' |
    'FullNamePlaceholder' |
    'EmployeeEmailPlaceholder' |
    'AgeLabel' |
    'AgePlaceholder' |
    'PhoneNumberLabel' |
    'PhoneNumberPlaceholder' |
    'AddressLabel' |
    'AddressPlaceholder' |
    'JoinDateLabel' |
    'NewPasswordOptionalLabel' |
    'PasswordPlaceholderOptional' |
    'PasswordLabelRequired' |
    'PasswordPlaceholder' |
    'CancelButton' |
    'SaveEmployeeButton' |
    'SavingEmployeeButton' |
    'SuccessToastTitle' |
    'EmployeeUpdatedToastMessage' |
    'EmployeeAddedToastMessage' |
    'ErrorToastTitle' |
    'CouldNotSaveEmployeeError'
>;

interface EmployeeFormProps {
    employeeToEdit?: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFormSubmit: () => void;
    addEmployeeAction: (data: EmployeeFormData) => Promise<User>;
    updateEmployeeAction: (id: string, data: Partial<EmployeeFormData>) => Promise<User | null>;
    dictionary: EmployeeFormDictionary;
    locale: Locale;
}

const getEmployeeFormSchema = (dictionary: EmployeeFormDictionary, locale: Locale) => z.object({
    name: z.string().min(1, dictionary.FullNameLabel + (locale === 'it' ? ' è obbligatorio/a.' : ' is required.')),
    email: z.string().min(1, dictionary.UsernameEmailLabel + (locale === 'it' ? ' è obbligatorio/a.' : ' is required.')),
    age: z.coerce.number().int().positive().optional().nullable(),
    phoneNumber: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    joinDate: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
        message: locale === 'it' ? "Formato data non valido" : "Invalid date format",
    }).optional().nullable(),
    newPassword: z.string().min(6, dictionary.PasswordLabel + (locale === 'it' ? ' deve contenere almeno 6 caratteri' : ' must be at least 6 characters')).optional().or(z.literal('')),
});


export function EmployeeForm({
    employeeToEdit,
    open,
    onOpenChange,
    onFormSubmit,
    addEmployeeAction,
    updateEmployeeAction,
    dictionary,
    locale,
}: EmployeeFormProps) {
    const { toast } = useToast();
    const employeeFormSchema = getEmployeeFormSchema(dictionary, locale);

    const form = useForm<z.infer<typeof employeeFormSchema>>({
        resolver: zodResolver(employeeFormSchema),
        defaultValues: {
            name: '',
            email: '',
            age: undefined,
            phoneNumber: '',
            address: '',
            joinDate: '',
            newPassword: '',
        },
    });

    useEffect(() => {
        if (employeeToEdit) {
            form.reset({
                name: employeeToEdit.name || '',
                email: employeeToEdit.email || '',
                age: employeeToEdit.age ?? undefined, // Use nullish coalescing
                phoneNumber: employeeToEdit.phoneNumber || '',
                address: employeeToEdit.address || '',
                joinDate: employeeToEdit.joinDate || '',
                newPassword: '',
            });
        } else {
            form.reset({
                name: '',
                email: '',
                age: undefined,
                phoneNumber: '',
                address: '',
                joinDate: '',
                newPassword: '',
            });
        }
    }, [employeeToEdit, form, open]);

    const onSubmit = async (values: z.infer<typeof employeeFormSchema>) => {
        try {
            const formData: EmployeeFormData = {
                name: values.name,
                email: values.email,
                age: values.age ?? undefined,
                phoneNumber: values.phoneNumber || undefined,
                address: values.address || undefined,
                joinDate: values.joinDate || undefined,
            };
            if (values.newPassword) {
                formData.newPassword = values.newPassword;
            }

            if (employeeToEdit) {
                await updateEmployeeAction(employeeToEdit.id, formData);
                toast({ title: dictionary.SuccessToastTitle, description: dictionary.EmployeeUpdatedToastMessage });
            } else {
                await addEmployeeAction(formData);
                toast({ title: dictionary.SuccessToastTitle, description: dictionary.EmployeeAddedToastMessage });
            }
            onFormSubmit();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to save employee:', error);
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.CouldNotSaveEmployeeError, variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{employeeToEdit ? dictionary.EditEmployee : dictionary.AddEmployee}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dictionary.FullNameLabel}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={dictionary.FullNamePlaceholder} {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dictionary.UsernameEmailLabel}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={dictionary.EmployeeEmailPlaceholder} {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="age"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dictionary.AgeLabel}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder={dictionary.AgePlaceholder}
                                            {...field}
                                            value={field.value === null || field.value === undefined ? '' : String(field.value)}
                                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dictionary.PhoneNumberLabel}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={dictionary.PhoneNumberPlaceholder} {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dictionary.AddressLabel}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={dictionary.AddressPlaceholder} {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="joinDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dictionary.JoinDateLabel}</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} value={field.value || ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{employeeToEdit ? dictionary.NewPasswordOptionalLabel : dictionary.PasswordLabelRequired}</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder={employeeToEdit ? dictionary.PasswordPlaceholderOptional : dictionary.PasswordPlaceholder} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">{dictionary.CancelButton}</Button>
                            </DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? dictionary.SavingEmployeeButton : dictionary.SaveEmployeeButton}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
