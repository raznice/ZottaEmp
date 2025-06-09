// src/components/employee/employee-dashboard-client-page.tsx
'use client';

import { useState } from 'react';
import { TimeTracker } from '@/components/employee/time-tracker';
import { WorkHistory } from '@/components/employee/work-history';
import { Separator } from '@/components/ui/separator';
import type { Dictionary, Locale } from '@/lib/getDictionary';

interface EmployeeDashboardClientPageProps {
    dictionary: Dictionary;
    locale: Locale;
}

export function EmployeeDashboardClientPage({ dictionary, locale }: EmployeeDashboardClientPageProps) {
    const [workHistoryRefreshKey, setWorkHistoryRefreshKey] = useState(0);

    const triggerWorkHistoryRefresh = () => {
        setWorkHistoryRefreshKey(prevKey => prevKey + 1);
    };

    return (
        <div className="space-y-8">
            <TimeTracker
                dictionary={dictionary}
                locale={locale}
                onWorkSessionEnded={triggerWorkHistoryRefresh}
            />
            <Separator />
            <WorkHistory
                dictionary={dictionary}
                locale={locale}
                refreshKey={workHistoryRefreshKey}
                showPhotoColumn={false}
            />
        </div>
    );
}
