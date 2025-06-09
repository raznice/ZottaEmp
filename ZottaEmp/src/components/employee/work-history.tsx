
// src/components/employee/work-history.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { getWorkHistoryForUser } from '@/lib/actions';
import type { WorkEntry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format, parseISO } from 'date-fns';
import { it as itLocaleDateFns, enUS as enLocaleDateFns } from 'date-fns/locale';
import type { Locale as DateFnsLocaleObject } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Info, Activity, Clock, CalendarDays, FileText, Camera } from 'lucide-react';
import Image from 'next/image';
import type { Dictionary, Locale } from '@/lib/getDictionary';

// Using Pick for a more specific dictionary type
type WorkHistoryDictionary = Pick<Dictionary,
    'Loading' |
    'MyWorkLogTitle' |
    'MyWorkLogDescription' |
    'NoWorkEntriesRecorded' |
    'FilterBy' |
    'AllDays' |
    'Month' |
    'Year' |
    'SelectMonth' |
    'SelectYear' |
    'TotalHoursPeriod' |
    'AllTime' |
    'NoEntriesForPeriod' |
    'TotalHours' |
    'Start' |
    'End' |
    'Duration' |
    'Activity' |
    'Photo' |
    'StartPhoto' | // For alt text if needed
    'EndPhoto' |   // For alt text if needed
    'InProgress'
>;

interface GroupedEntries {
    [key: string]: WorkEntry[];
}

interface WorkHistoryProps {
    dictionary: WorkHistoryDictionary;
    locale: Locale;
    refreshKey?: number;
    showPhotoColumn?: boolean; // Prop to control photo column visibility
}

export function WorkHistory({ dictionary, locale, refreshKey, showPhotoColumn = true }: WorkHistoryProps) {
    const { user } = useAuth();
    const [history, setHistory] = useState<WorkEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'day' | 'month' | 'year'>('month');
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
    const [selectedYear, setSelectedYear] = useState<string>(format(new Date(), 'yyyy'));

    const fnsLocale: DateFnsLocaleObject = locale === 'it' ? itLocaleDateFns : enLocaleDateFns;

    const fetchWorkHistory = async () => {
        if (user) {
            setIsLoading(true);
            try {
                const data = await getWorkHistoryForUser(user.id);
                setHistory(data); // Data should already be sorted by server action
            } catch (error) {
                console.error('Failed to fetch work history:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchWorkHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, refreshKey]);

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        history.forEach(entry => months.add(format(parseISO(entry.date), 'yyyy-MM')));
        return Array.from(months).sort((a, b) => b.localeCompare(a));
    }, [history]);

    const availableYears = useMemo(() => {
        const years = new Set<string>();
        history.forEach(entry => years.add(format(parseISO(entry.date), 'yyyy')));
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [history]);

    const filteredAndGroupedEntries = useMemo(() => {
        let filtered = history;
        if (filter === 'month') {
            filtered = history.filter(entry => format(parseISO(entry.date), 'yyyy-MM') === selectedMonth);
        } else if (filter === 'year') {
            filtered = history.filter(entry => format(parseISO(entry.date), 'yyyy') === selectedYear);
        }

        const grouped: GroupedEntries = {};
        filtered.forEach(entry => {
            const groupKey = format(parseISO(entry.date), 'yyyy-MM-dd');
            if (!grouped[groupKey]) {
                grouped[groupKey] = [];
            }
            // Sort entries within each date group by startTime descending
            const existingEntries = grouped[groupKey];
            const newEntries = [...existingEntries, entry].sort((a, b) => {
                if (a.startTime && b.startTime) return b.startTime.localeCompare(a.startTime);
                return 0;
            });
            grouped[groupKey] = newEntries;
        });
        return grouped;
    }, [history, filter, selectedMonth, selectedYear]);

    const calculateTotalHoursForGroup = (entries: WorkEntry[]) => {
        const totalMinutes = entries.reduce((acc, entry) => acc + (entry.durationMinutes || 0), 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    const totalHoursForPeriod = useMemo(() => {
        let entriesToSum = history;
        let periodName = dictionary.AllTime;
        if (filter === 'month') {
            entriesToSum = history.filter(entry => format(parseISO(entry.date), 'yyyy-MM') === selectedMonth);
            periodName = format(parseISO(selectedMonth + '-01'), 'MMMM yyyy', { locale: fnsLocale });
        } else if (filter === 'year') {
            entriesToSum = history.filter(entry => format(parseISO(entry.date), 'yyyy') === selectedYear);
            periodName = selectedYear;
        }
        return { hours: calculateTotalHoursForGroup(entriesToSum), periodName };
    }, [history, filter, selectedMonth, selectedYear, fnsLocale, dictionary.AllTime]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">{dictionary.Loading}</p>
            </div>
        );
    }

    if (!history.length && !isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{dictionary.MyWorkLogTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground flex items-center"><Info className="mr-2 h-5 w-5" /> {dictionary.NoWorkEntriesRecorded}</p>
                </CardContent>
            </Card>
        );
    }

    const sortedGroupKeys = Object.keys(filteredAndGroupedEntries).sort((a, b) => b.localeCompare(a));

    return (
        <Card className="shadow-lg" id="work-history">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                        <CardTitle className="text-2xl">{dictionary.MyWorkLogTitle}</CardTitle>
                        <CardDescription>{dictionary.MyWorkLogDescription}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Select value={filter} onValueChange={(value: 'day' | 'month' | 'year') => setFilter(value)}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder={dictionary.FilterBy} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">{dictionary.AllDays}</SelectItem>
                                <SelectItem value="month">{dictionary.Month}</SelectItem>
                                <SelectItem value="year">{dictionary.Year}</SelectItem>
                            </SelectContent>
                        </Select>
                        {filter === 'month' && (
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={dictionary.SelectMonth} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableMonths.map(month => (
                                        <SelectItem key={month} value={month}>
                                            {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: fnsLocale })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {filter === 'year' && (
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder={dictionary.SelectYear} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
                <div className="mt-4 text-lg font-semibold">
                    {dictionary.TotalHoursPeriod.replace('{period}', totalHoursForPeriod.periodName)}: <Badge variant="secondary" className="text-lg">{totalHoursForPeriod.hours}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                {sortedGroupKeys.length === 0 && <p className="text-muted-foreground">{dictionary.NoEntriesForPeriod}</p>}
                <Accordion type="single" collapsible className="w-full">
                    {sortedGroupKeys.map(dateKey => (
                        <AccordionItem value={dateKey} key={dateKey}>
                            <AccordionTrigger className="text-lg hover:no-underline">
                                <div className="flex justify-between w-full items-center pr-2">
                                    <span><CalendarDays className="inline mr-2 h-5 w-5 text-primary" />{format(parseISO(dateKey), 'EEEE d MMMM yyyy', { locale: fnsLocale })}</span>
                                    <Badge variant="outline">{dictionary.TotalHours}: {calculateTotalHoursForGroup(filteredAndGroupedEntries[dateKey])}</Badge>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead><Clock className="inline mr-1 h-4 w-4" />{dictionary.Start}</TableHead>
                                            <TableHead><Clock className="inline mr-1 h-4 w-4" />{dictionary.End}</TableHead>
                                            <TableHead><Activity className="inline mr-1 h-4 w-4" />{dictionary.Duration}</TableHead>
                                            <TableHead><FileText className="inline mr-1 h-4 w-4" />{dictionary.Activity}</TableHead>
                                            {showPhotoColumn && <TableHead><Camera className="inline mr-1 h-4 w-4" />{dictionary.Photo}</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAndGroupedEntries[dateKey].map(entry => (
                                            <TableRow key={entry.id}>
                                                <TableCell>{entry.startTime}</TableCell>
                                                <TableCell>{entry.endTime || dictionary.InProgress}</TableCell>
                                                <TableCell>
                                                    {entry.durationMinutes ? `${Math.floor(entry.durationMinutes / 60)}h ${entry.durationMinutes % 60}m` : '-'}
                                                </TableCell>
                                                <TableCell className="max-w-xs whitespace-pre-wrap">{entry.activity}</TableCell>
                                                {showPhotoColumn && (
                                                    <TableCell>
                                                        <div className="flex flex-col sm:flex-row gap-1 items-center">
                                                            {entry.startPhotoUrl && typeof entry.startPhotoUrl === 'string' && entry.startPhotoUrl.startsWith('data:image') && (
                                                                <Image data-ai-hint="worker face" src={entry.startPhotoUrl} alt={dictionary.StartPhoto} width={30} height={30} className="rounded-md object-cover" />
                                                            )}
                                                            {entry.endPhotoUrl && typeof entry.endPhotoUrl === 'string' && entry.endPhotoUrl.startsWith('data:image') && (
                                                                <Image data-ai-hint="worker face" src={entry.endPhotoUrl} alt={dictionary.EndPhoto} width={30} height={30} className="rounded-md object-cover" />
                                                            )}
                                                            {(!entry.startPhotoUrl && !entry.endPhotoUrl) && '-'}
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    );
}
