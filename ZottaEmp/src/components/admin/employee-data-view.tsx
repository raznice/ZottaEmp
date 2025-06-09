
// src/components/admin/employee-data-view.tsx
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { getAllWorkEntries, adminGetEmployeeListForFilter } from '@/lib/actions';
import type { WorkEntry, User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import type { Locale as DateFnsLocaleObject } from 'date-fns';
import { it as itLocaleDate, enUS as enLocaleDate } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User as UserIcon, Users, Activity, Clock, CalendarDays, FileText, Camera, Maximize, Euro, Briefcase } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Dictionary, Locale } from '@/lib/getDictionary';
import { Button } from '../ui/button';


interface EmployeeDataViewProps {
    dictionary: Pick<Dictionary,
        'AllEmployeeActivity' |
        'ViewWorkLogsAndAISummaries' | // Kept for description, though AI summaries are removed
        'FilterByEmployee' |
        'AllEmployees' |
        'NoWorkEntriesFound' |
        'TotalHours' |
        'DailyTotal' |
        'Start' |
        'End' |
        'Duration' |
        'Activity' |
        'Photo' |
        'StartPhoto' |
        'EndPhoto' |
        'InProgress' |
        'LoadingEmployeeActivity' |
        'UnknownUser' |
        'NoEntriesForEmployeeInPeriod' |
        'ErrorToastTitle' |
        'UnexpectedError' |
        'EurosLabel' |
        'CentsLabel' |
        'TotalWageLabel' |
        'SelectMonthForWageCalculation' |
        'AllMonths' |
        'NoEntriesForMonth' |
        'CalculationsForMonth' |
        'MonthlyTotalHours' |
        'MonthlyTotalWage' |
        'HourlyRateForEmployeeLabel' |
        'EnlargePhoto'
    >;
    locale: Locale;
}

interface GroupedEntriesByEmployee {
    [employeeId: string]: {
        employeeName: string;
        entriesByDate: {
            [date: string]: WorkEntry[];
        };
        displayTotalHours: string;
        totalMinutes: number;
        employeeWage?: string;
        monthlyDetails?: {
            monthYear: string;
            displayTotalHours: string;
            totalMinutes: number;
            employeeWage?: string;
        }
    };
}

interface EmployeeRates {
    [employeeId: string]: { euros: string; cents: string };
}

export function EmployeeDataView({ dictionary, locale }: EmployeeDataViewProps) {
    const [allEntries, setAllEntries] = useState<WorkEntry[]>([]);
    const [employees, setEmployees] = useState<Pick<User, 'id' | 'name'>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
    const [employeeHourlyRates, setEmployeeHourlyRates] = useState<EmployeeRates>({});
    const [selectedWageMonth, setSelectedWageMonth] = useState<string>('all');

    const [isPhotoPopupOpen, setIsPhotoPopupOpen] = useState(false);
    const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

    const fnsLocale: DateFnsLocaleObject = locale === 'it' ? itLocaleDate : enLocaleDate;

    const availableWageMonths = useMemo(() => {
        const months = new Set<string>();
        allEntries.forEach(entry => months.add(format(parseISO(entry.date), 'yyyy-MM')));
        return Array.from(months).sort((a, b) => b.localeCompare(a));
    }, [allEntries]);

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            console.log('[EmployeeDataView] Fetching data...');
            try {
                const [entriesData, usersData] = await Promise.all([
                    getAllWorkEntries(),
                    adminGetEmployeeListForFilter()
                ]);
                console.log('[EmployeeDataView] Received entriesData count:', entriesData.length);
                if (entriesData.length > 0) {
                    console.log('[EmployeeDataView] First received entry:', JSON.stringify(entriesData[0]));
                }
                setAllEntries(entriesData);

                console.log('[EmployeeDataView] Received usersData:', usersData);
                setEmployees(usersData);

                const initialRates: EmployeeRates = {};
                usersData.forEach(emp => {
                    initialRates[emp.id] = { euros: '10', cents: '00' }; // Default rate
                });
                setEmployeeHourlyRates(initialRates);

            } catch (error) {
                console.error((dictionary.UnexpectedError || 'Unexpected error') + ':', error);
            } finally {
                setIsLoading(false);
                console.log('[EmployeeDataView] Fetching complete. isLoading set to false.');
            }
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Removed dictionary.UnexpectedError to prevent re-fetch on locale change if dictionary object ref changes


    const employeeMap = useMemo(() => {
        const map = new Map<string, string>();
        employees.forEach(emp => map.set(emp.id, emp.name));
        return map;
    }, [employees]);

    const calculateTotalMinutesForEntries = (entries: WorkEntry[]): number => {
        return entries.reduce((acc, entry) => acc + (entry.durationMinutes || 0), 0);
    };

    const formatDurationFromMinutes = (totalMinutes: number): string => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    const handleEmployeeRateChange = useCallback((employeeId: string, type: 'euros' | 'cents', value: string) => {
        setEmployeeHourlyRates(prevRates => {
            const currentRate = prevRates[employeeId] || { euros: '10', cents: '00' };
            let numericValue = parseInt(value);
            let finalValue = value;

            if (type === 'cents') {
                if (value === "") {
                    finalValue = '00';
                } else if (isNaN(numericValue) || numericValue < 0) {
                    finalValue = '00';
                } else if (numericValue > 99) {
                    finalValue = '99';
                } else {
                    finalValue = numericValue.toString().padStart(2, '0');
                }
            } else { // euros
                if (value === "" || isNaN(numericValue) || numericValue < 0) {
                    finalValue = '0';
                }
            }

            return {
                ...prevRates,
                [employeeId]: {
                    ...currentRate,
                    [type]: finalValue
                }
            };
        });
    }, []);

    const getEffectiveRateForEmployee = useCallback((employeeId: string): number => {
        const rates = employeeHourlyRates[employeeId] || { euros: '10', cents: '00' }; // Default if not set
        const currentRateEuros = parseFloat(rates.euros) || 0;
        const currentRateCents = parseFloat(rates.cents) || 0;
        return currentRateEuros + (currentRateCents / 100);
    }, [employeeHourlyRates]);


    const groupedAndFilteredEntries = useMemo(() => {
        console.log('[EmployeeDataView] Recalculating groupedAndFilteredEntries. Selected Employee ID:', selectedEmployeeId, 'All entries count:', allEntries.length, 'Selected Wage Month:', selectedWageMonth);
        if (allEntries.length > 0) {
            console.log('[EmployeeDataView] allEntries for grouping (sample):', JSON.stringify(allEntries[0]));
        }


        const filteredEntries = selectedEmployeeId === 'all'
            ? allEntries
            : allEntries.filter(entry => entry.userId === selectedEmployeeId);

        const grouped: GroupedEntriesByEmployee = {};

        filteredEntries.forEach(entry => {
            if (!grouped[entry.userId]) {
                grouped[entry.userId] = {
                    employeeName: employeeMap.get(entry.userId) || (dictionary.UnknownUser || 'Unknown User'),
                    entriesByDate: {},
                    displayTotalHours: '0h 0m',
                    totalMinutes: 0,
                };
            }
            const dateKey = format(parseISO(entry.date), 'yyyy-MM-dd');
            if (!grouped[entry.userId].entriesByDate[dateKey]) {
                grouped[entry.userId].entriesByDate[dateKey] = [];
            }
            grouped[entry.userId].entriesByDate[dateKey].push(entry);
        });

        for (const userId in grouped) {
            const employeeAllEntries = Object.values(grouped[userId].entriesByDate).flat();
            const totalMinutesOverall = calculateTotalMinutesForEntries(employeeAllEntries);
            grouped[userId].totalMinutes = totalMinutesOverall;
            grouped[userId].displayTotalHours = formatDurationFromMinutes(totalMinutesOverall);

            const effectiveHourlyRate = getEffectiveRateForEmployee(userId);

            if (effectiveHourlyRate > 0) {
                const decimalHoursOverall = totalMinutesOverall / 60;
                const wageOverall = decimalHoursOverall * effectiveHourlyRate;
                grouped[userId].employeeWage = wageOverall.toLocaleString(locale === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: 'EUR' });
            } else {
                grouped[userId].employeeWage = (0).toLocaleString(locale === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: 'EUR' });
            }

            if (selectedWageMonth !== 'all') {
                const monthEntries = employeeAllEntries.filter(e => format(parseISO(e.date), 'yyyy-MM') === selectedWageMonth);
                const totalMinutesMonth = calculateTotalMinutesForEntries(monthEntries);
                const displayTotalHoursMonth = formatDurationFromMinutes(totalMinutesMonth);
                let employeeWageMonth = (0).toLocaleString(locale === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: 'EUR' });

                if (effectiveHourlyRate > 0 && totalMinutesMonth > 0) {
                    const decimalHoursMonth = totalMinutesMonth / 60;
                    const wageMonth = decimalHoursMonth * effectiveHourlyRate;
                    employeeWageMonth = wageMonth.toLocaleString(locale === 'it' ? 'it-IT' : 'en-US', { style: 'currency', currency: 'EUR' });
                }

                grouped[userId].monthlyDetails = {
                    monthYear: format(parseISO(selectedWageMonth + '-01'), 'MMMM yyyy', { locale: fnsLocale }),
                    displayTotalHours: displayTotalHoursMonth,
                    totalMinutes: totalMinutesMonth,
                    employeeWage: employeeWageMonth,
                };
            } else {
                delete grouped[userId].monthlyDetails;
            }

            // Sort entries within each date group by startTime descending
            for (const dateKey in grouped[userId].entriesByDate) {
                grouped[userId].entriesByDate[dateKey].sort((a, b) => {
                    if (a.startTime && b.startTime) return b.startTime.localeCompare(a.startTime);
                    return 0;
                });
            }

            // Sort dates descending
            const sortedDates = Object.keys(grouped[userId].entriesByDate).sort((a, b) => b.localeCompare(a));
            const sortedEntriesByDate: { [date: string]: WorkEntry[] } = {};
            sortedDates.forEach(date => {
                sortedEntriesByDate[date] = grouped[userId].entriesByDate[date];
            });
            grouped[userId].entriesByDate = sortedEntriesByDate;
        }

        console.log('[EmployeeDataView] Finished groupedAndFilteredEntries. Result keys:', Object.keys(grouped));
        if (Object.keys(grouped).length > 0) {
            console.log('[EmployeeDataView] Sample grouped data:', JSON.stringify(grouped[Object.keys(grouped)[0]]));
        }
        return grouped;
    }, [allEntries, selectedEmployeeId, employeeMap, dictionary.UnknownUser, employeeHourlyRates, selectedWageMonth, locale, getEffectiveRateForEmployee, fnsLocale]);


    const sortedEmployeeIds = useMemo(() => {
        const ids = Object.keys(groupedAndFilteredEntries);
        console.log('[EmployeeDataView] Employee IDs for sorting:', ids);
        const sorted = ids.sort((a, b) => {
            const nameA = groupedAndFilteredEntries[a]?.employeeName || '';
            const nameB = groupedAndFilteredEntries[b]?.employeeName || '';
            return nameA.localeCompare(nameB);
        });
        console.log('[EmployeeDataView] sortedEmployeeIds for rendering:', sorted);
        return sorted;
    }, [groupedAndFilteredEntries]);

    const openPhotoPopup = (url: string) => {
        setSelectedPhotoUrl(url);
        setIsPhotoPopupOpen(true);
    };

    const closePhotoPopup = () => {
        setIsPhotoPopupOpen(false);
        setSelectedPhotoUrl(null);
    };


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-60">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="ml-3 text-lg">{dictionary.LoadingEmployeeActivity || 'Loading employee activity...'}</p>
            </div>
        );
    }


    return (
        <>
            <Card className="shadow-xl w-full">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="text-3xl flex items-center"><Users className="mr-3 h-8 w-8 text-primary" /> {dictionary.AllEmployeeActivity}</CardTitle>
                            <CardDescription>{dictionary.ViewWorkLogsAndAISummaries}</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                <SelectTrigger className="w-full sm:w-[220px] text-base py-2.5">
                                    <SelectValue placeholder={dictionary.FilterByEmployee} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{dictionary.AllEmployees}</SelectItem>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={selectedWageMonth} onValueChange={setSelectedWageMonth}>
                                <SelectTrigger className="w-full sm:w-[280px] text-base py-2.5">
                                    <SelectValue placeholder={dictionary.SelectMonthForWageCalculation} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{dictionary.AllMonths}</SelectItem>
                                    {availableWageMonths.map(month => (
                                        <SelectItem key={month} value={month}>
                                            {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: fnsLocale })}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                </CardHeader>
                <CardContent>
                    {sortedEmployeeIds.length === 0 && !isLoading && <p className="text-muted-foreground text-lg p-4 text-center">{dictionary.NoWorkEntriesFound}</p>}
                    <Accordion type="multiple" className="w-full space-y-4">
                        {sortedEmployeeIds.map(employeeId => {
                            const employeeGroup = groupedAndFilteredEntries[employeeId];
                            if (!employeeGroup) return null; // Should not happen if sortedEmployeeIds is derived from this
                            const { employeeName, entriesByDate, displayTotalHours, employeeWage, monthlyDetails } = employeeGroup;
                            const sortedDateKeys = Object.keys(entriesByDate).sort((a, b) => b.localeCompare(a)); // Should already be sorted by memo
                            const currentEmployeeRate = employeeHourlyRates[employeeId] || { euros: '10', cents: '00' };

                            const hourlyRateLabelTemplate = dictionary.HourlyRateForEmployeeLabel || 'Tariffa Oraria per {employeeName}';
                            const employeeNameDisplay = employeeName || (dictionary.UnknownUser || 'Utente Sconosciuto');
                            const hourlyRateLabelText = hourlyRateLabelTemplate.replace('{employeeName}', employeeNameDisplay);

                            const calculationsForMonthTemplate = dictionary.CalculationsForMonth || 'Calcoli Mensili per {monthYear}';

                            return (
                                <AccordionItem value={employeeId} key={employeeId} className="border rounded-lg shadow-sm bg-card">
                                    <AccordionTrigger className="text-xl p-4 hover:no-underline">
                                        <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center">
                                            <span className="flex items-center mb-2 sm:mb-0"><UserIcon className="mr-2 h-6 w-6 text-primary" />{employeeNameDisplay}</span>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-right">
                                                <Badge variant="secondary" className="text-md whitespace-nowrap">{dictionary.TotalHours}: {displayTotalHours}</Badge>
                                                <Badge variant="outline" className="text-md whitespace-nowrap border-primary text-primary">
                                                    <Euro className="inline mr-1 h-4 w-4" />{dictionary.TotalWageLabel || 'Total Wage'}: {employeeWage}
                                                </Badge>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 space-y-4">
                                        <div className="p-4 border rounded-md bg-muted/30 space-y-3">
                                            <Label className="text-md font-semibold block">{hourlyRateLabelText}</Label>
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <Label htmlFor={`rateEuros-${employeeId}`}>{dictionary.EurosLabel}</Label>
                                                    <Input
                                                        id={`rateEuros-${employeeId}`}
                                                        type="number"
                                                        min="0"
                                                        value={currentEmployeeRate.euros}
                                                        onChange={(e) => handleEmployeeRateChange(employeeId, 'euros', e.target.value)}
                                                        placeholder="e.g., 10"
                                                        className="text-base bg-background"
                                                    />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <Label htmlFor={`rateCents-${employeeId}`}>{dictionary.CentsLabel}</Label>
                                                    <Input
                                                        id={`rateCents-${employeeId}`}
                                                        type="number"
                                                        min="0"
                                                        max="99"
                                                        value={currentEmployeeRate.cents}
                                                        onChange={(e) => handleEmployeeRateChange(employeeId, 'cents', e.target.value)}
                                                        onBlur={(e) => {
                                                            const val = e.target.value;
                                                            if (val.length === 1) handleEmployeeRateChange(employeeId, 'cents', val.padStart(2, '0'));
                                                            if (val === "") handleEmployeeRateChange(employeeId, 'cents', "00");
                                                        }}
                                                        placeholder="e.g., 50"
                                                        className="text-base bg-background"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {monthlyDetails && selectedWageMonth !== 'all' && (
                                            <Card className="bg-primary/5 border-primary/20">
                                                <CardHeader className="py-3 px-4">
                                                    <CardTitle className="text-lg flex items-center">
                                                        <Briefcase className="mr-2 h-5 w-5 text-primary" /> {calculationsForMonthTemplate.replace('{monthYear}', monthlyDetails.monthYear)}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="px-4 pb-3 space-y-1">
                                                    {monthlyDetails.totalMinutes > 0 ? (
                                                        <>
                                                            <p><strong>{dictionary.MonthlyTotalHours}:</strong> {monthlyDetails.displayTotalHours}</p>
                                                            <p><strong>{dictionary.MonthlyTotalWage}:</strong> {monthlyDetails.employeeWage}</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-muted-foreground">{dictionary.NoEntriesForMonth}</p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )}

                                        {sortedDateKeys.length === 0 && <p className="py-4 text-muted-foreground">{dictionary.NoEntriesForEmployeeInPeriod || 'No entries for this employee in the selected period.'}</p>}
                                        <Accordion type="single" collapsible className="w-full">
                                            {sortedDateKeys.map(dateKey => (
                                                <AccordionItem value={`${employeeId}-${dateKey}`} key={`${employeeId}-${dateKey}`} className="border-b last:border-b-0">
                                                    <AccordionTrigger className="text-md py-3 hover:no-underline">
                                                        <div className="flex justify-between w-full items-center pr-2">
                                                            <span><CalendarDays className="inline mr-2 h-5 w-5 text-primary/80" />{format(parseISO(dateKey), 'EEEE d MMMM yyyy', { locale: fnsLocale })}</span>
                                                            <Badge variant="outline">{dictionary.DailyTotal}: {formatDurationFromMinutes(calculateTotalMinutesForEntries(entriesByDate[dateKey]))}</Badge>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pt-2 pb-4">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead><Clock className="inline mr-1 h-4 w-4" />{dictionary.Start}</TableHead>
                                                                    <TableHead><Clock className="inline mr-1 h-4 w-4" />{dictionary.End}</TableHead>
                                                                    <TableHead><Activity className="inline mr-1 h-4 w-4" />{dictionary.Duration}</TableHead>
                                                                    <TableHead className="w-1/3"><FileText className="inline mr-1 h-4 w-4" />{dictionary.Activity}</TableHead>
                                                                    <TableHead className="w-1/4"><Camera className="inline mr-1 h-4 w-4" />{dictionary.Photo}</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {entriesByDate[dateKey].map(entry => (
                                                                    <TableRow key={entry.id}>
                                                                        <TableCell>{entry.startTime}</TableCell>
                                                                        <TableCell>{entry.endTime || dictionary.InProgress}</TableCell>
                                                                        <TableCell>
                                                                            {entry.durationMinutes ? formatDurationFromMinutes(entry.durationMinutes) : '-'}
                                                                        </TableCell>
                                                                        <TableCell className="whitespace-pre-wrap text-sm">{entry.activity}</TableCell>
                                                                        <TableCell>
                                                                            <div className="flex flex-col sm:flex-row gap-2 items-center">
                                                                                {entry.startPhotoUrl && typeof entry.startPhotoUrl === 'string' && entry.startPhotoUrl.startsWith('data:image') ? (
                                                                                    <Button variant="ghost" className="p-0 h-auto relative group" onClick={() => openPhotoPopup(entry.startPhotoUrl!)}>
                                                                                        <Image data-ai-hint="worker face" src={entry.startPhotoUrl} alt={dictionary.StartPhoto || 'Start Photo'} width={50} height={50} className="rounded-md object-cover cursor-pointer transition-transform transform group-hover:scale-110" />
                                                                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                                                                            <Maximize className="h-5 w-5 text-white" />
                                                                                        </div>
                                                                                    </Button>
                                                                                ) : (
                                                                                    <div className="flex flex-col items-center text-xs text-muted-foreground w-[50px] h-[50px] justify-center border rounded-md">
                                                                                        {dictionary.StartPhoto || 'Start'}<br />(-)
                                                                                    </div>
                                                                                )}
                                                                                {entry.endPhotoUrl && typeof entry.endPhotoUrl === 'string' && entry.endPhotoUrl.startsWith('data:image') ? (
                                                                                    <Button variant="ghost" className="p-0 h-auto relative group" onClick={() => openPhotoPopup(entry.endPhotoUrl!)}>
                                                                                        <Image data-ai-hint="worker face" src={entry.endPhotoUrl} alt={dictionary.EndPhoto || 'End Photo'} width={50} height={50} className="rounded-md object-cover cursor-pointer transition-transform transform group-hover:scale-110" />
                                                                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                                                                            <Maximize className="h-5 w-5 text-white" />
                                                                                        </div>
                                                                                    </Button>
                                                                                ) : (
                                                                                    <div className="flex flex-col items-center text-xs text-muted-foreground w-[50px] h-[50px] justify-center border rounded-md">
                                                                                        {dictionary.EndPhoto || 'End'}<br />(-)
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                </CardContent>
            </Card>

            {selectedPhotoUrl && (
                <Dialog open={isPhotoPopupOpen} onOpenChange={closePhotoPopup}>
                    <DialogContent className="sm:max-w-[90vw] md:max-w-[70vw] lg:max-w-[50vw] xl:max-w-[40vw] p-0">
                        <DialogHeader className="p-4">
                            <DialogTitle>{dictionary.EnlargePhoto || "Employee Photo"}</DialogTitle>
                        </DialogHeader>
                        <div className="p-4 max-h-[80vh] overflow-y-auto">
                            <Image
                                src={selectedPhotoUrl}
                                alt={dictionary.EnlargePhoto || "Enlarged employee photo"}
                                width={1200}
                                height={900}
                                className="rounded-md object-contain w-full h-auto"
                                data-ai-hint="worker face"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
