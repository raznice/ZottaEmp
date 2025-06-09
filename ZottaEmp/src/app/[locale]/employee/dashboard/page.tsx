
// src/app/[locale]/employee/dashboard/page.tsx
import { AppLayout } from '@/components/layout/app-layout';
import { EmployeeDashboardClientPage } from '@/components/employee/employee-dashboard-client-page';
import { getDictionary, type Locale, type Dictionary } from '@/lib/getDictionary';

export default async function EmployeeDashboardPage({
    params,
}: {
    params: { locale: string }; // Use string here
}) {
    const currentLocale = params.locale as Locale;
    const dictionary = await getDictionary(currentLocale) as Dictionary;

    return (
        <AppLayout allowedRoles={['employee']} dictionary={dictionary} locale={currentLocale}>
            <EmployeeDashboardClientPage dictionary={dictionary} locale={currentLocale} />
        </AppLayout>
    );
}
