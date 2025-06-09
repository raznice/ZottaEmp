
// src/components/admin/employee-management-table.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { MoreHorizontal, PlusCircle, Edit2, Trash2, Users, Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';
import { EmployeeForm } from './employee-form';
import { adminGetAllEmployees, adminAddEmployee, adminUpdateEmployee, adminDeleteEmployee } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { it as itLocaleDateFns, enUS as enLocaleDateFns } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import type { Dictionary, Locale } from '@/lib/getDictionary';

// Using Pick for a more specific dictionary type
type EmployeeManagementTableDictionary = Pick<Dictionary,
    'ErrorToastTitle' |
    'CouldNotDeleteEmployeeError' |
    'LoadingEmployees' |
    'EmployeeManagementTitle' |
    'EmployeeManagementDescription' |
    'AddEmployeeButton' |
    'NoEmployeesFoundMessage' |
    'NameColumn' |
    'UsernameEmailColumn' |
    'AgeColumn' |
    'PhoneColumn' |
    'AddressColumn' |
    'JoinDateColumn' |
    'ActionsColumn' |
    'OpenMenuSr' |
    'EditAction' |
    'DeleteAction' |
    'ConfirmDeleteTitle' |
    'ConfirmDeleteDescription' |
    'CancelButton' |
    'ContinueButton' |
    'SuccessToastTitle' |
    'EmployeeDeletedToastMessage' |
    // Props for EmployeeForm
    'EditEmployee' |
    'AddEmployee' |
    'FullNameLabel' |
    'FullNamePlaceholder' |
    'UsernameEmailLabel' |
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
    'PasswordLabel' |
    'PasswordPlaceholder' |
    'SaveEmployeeButton' |
    'SavingEmployeeButton' |
    'EmployeeUpdatedToastMessage' |
    'EmployeeAddedToastMessage' |
    'CouldNotSaveEmployeeError'
>;

interface EmployeeManagementTableProps {
    dictionary: EmployeeManagementTableDictionary;
    locale: Locale;
}

export function EmployeeManagementTable({ dictionary, locale }: EmployeeManagementTableProps) {
    const [employees, setEmployees] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<User | null>(null);
    const { toast } = useToast();

    const fnsLocale: DateFnsLocale = locale === 'it' ? itLocaleDateFns : enLocaleDateFns;

    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminGetAllEmployees();
            setEmployees(data);
        } catch (error) {
            console.error('Failed to fetch employees:', error);
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.LoadingEmployees, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [toast, dictionary]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleAddEmployee = () => {
        setEmployeeToEdit(null);
        setIsFormOpen(true);
    };

    const handleEditEmployee = (employee: User) => {
        setEmployeeToEdit(employee);
        setIsFormOpen(true);
    };

    const handleDeleteEmployee = async (userId: string) => {
        try {
            await adminDeleteEmployee(userId);
            toast({ title: dictionary.SuccessToastTitle, description: dictionary.EmployeeDeletedToastMessage });
            fetchEmployees();
        } catch (error) {
            console.error('Failed to delete employee:', error);
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.CouldNotDeleteEmployeeError, variant: 'destructive' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">{dictionary.LoadingEmployees}</p>
            </div>
        );
    }

    return (
        <>
            <Card className="shadow-xl mt-8">
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl flex items-center"><Users className="mr-2 h-7 w-7 text-primary" />{dictionary.EmployeeManagementTitle}</CardTitle>
                        <CardDescription>{dictionary.EmployeeManagementDescription}</CardDescription>
                    </div>
                    <Button onClick={handleAddEmployee}>
                        <PlusCircle className="mr-2 h-5 w-5" /> {dictionary.AddEmployeeButton}
                    </Button>
                </CardHeader>
                <CardContent>
                    {employees.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">{dictionary.NoEmployeesFoundMessage}</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{dictionary.NameColumn}</TableHead>
                                    <TableHead>{dictionary.UsernameEmailColumn}</TableHead>
                                    <TableHead>{dictionary.AgeColumn}</TableHead>
                                    <TableHead>{dictionary.PhoneColumn}</TableHead>
                                    <TableHead>{dictionary.AddressColumn}</TableHead>
                                    <TableHead>{dictionary.JoinDateColumn}</TableHead>
                                    <TableHead className="text-right">{dictionary.ActionsColumn}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {employees.map((employee) => (
                                    <TableRow key={employee.id}>
                                        <TableCell className="font-medium">{employee.name}</TableCell>
                                        <TableCell>{employee.email}</TableCell>
                                        <TableCell>{employee.age || '-'}</TableCell>
                                        <TableCell>{employee.phoneNumber || '-'}</TableCell>
                                        <TableCell className="max-w-xs truncate">{employee.address || '-'}</TableCell>
                                        <TableCell>
                                            {employee.joinDate ? format(parseISO(employee.joinDate), 'd MMM yyyy', { locale: fnsLocale }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">{dictionary.OpenMenuSr}</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                                                            <Edit2 className="mr-2 h-4 w-4" /> {dictionary.EditAction}
                                                        </DropdownMenuItem>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                                                <Trash2 className="mr-2 h-4 w-4" /> {dictionary.DeleteAction}
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>{dictionary.ConfirmDeleteTitle}</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {dictionary.ConfirmDeleteDescription}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>{dictionary.CancelButton}</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteEmployee(employee.id)}
                                                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                                        >
                                                            {dictionary.ContinueButton}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <EmployeeForm
                employeeToEdit={employeeToEdit}
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onFormSubmit={fetchEmployees}
                addEmployeeAction={adminAddEmployee}
                updateEmployeeAction={adminUpdateEmployee}
                dictionary={dictionary}
                locale={locale}
            />
        </>
    );
}
