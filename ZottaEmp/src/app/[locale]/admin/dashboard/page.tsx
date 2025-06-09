
// src/app/[locale]/admin/dashboard/page.tsx
import { AppLayout } from '@/components/layout/app-layout';
import { EmployeeDataView } from '@/components/admin/employee-data-view';
import { EmployeeManagementTable } from '@/components/admin/employee-management-table';
import { AdminProfileSettings } from '@/components/admin/admin-profile-settings';
import { Separator } from '@/components/ui/separator';
import { getDictionary, type Locale, type Dictionary } from '@/lib/getDictionary';

export default async function AdminDashboardPage({
    params,
}: {
    params: { locale: string }; // Use string here
}) {
    const currentLocale = params.locale as Locale;
    const dictionary = await getDictionary(currentLocale) as Dictionary;

    return (
        <AppLayout allowedRoles={['admin']} dictionary={dictionary} locale={currentLocale}>
            <div className="space-y-8">
                <EmployeeDataView dictionary={dictionary} locale={currentLocale} />
                <Separator />
                <EmployeeManagementTable dictionary={dictionary} locale={currentLocale} />
                <Separator />
                <AdminProfileSettings dictionary={dictionary} locale={currentLocale} />
            </div>
        </AppLayout>
    );
}
