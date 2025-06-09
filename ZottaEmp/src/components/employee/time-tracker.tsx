// src/components/employee/time-tracker.tsx
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/providers/auth-provider';
import { startWork, endWork, getWorkEntryById, getWorkHistoryForUser } from '@/lib/actions'; // Added getWorkHistoryForUser
import type { WorkEntry, ActivityFormData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PlayCircle, StopCircle, Loader2, VideoOff } from 'lucide-react';
import { format as formatDateFns } from 'date-fns';
import type { Locale as DateFnsLocaleObject } from 'date-fns';
import { it as itLocaleDate, enUS as enLocaleDate } from 'date-fns/locale';
import type { Dictionary, Locale } from '@/lib/getDictionary';

type TimeTrackerDictionary = Pick<Dictionary,
    'TimeTrackerTitle' |
    'TimeTrackerDescription' |
    'StartWork' |
    'ActiveSessionStartedAt' |
    // 'AISummarizingActivity' | // Removed as AI summary is removed
    'ActivityDescriptionLabel' |
    'ActivityDescriptionPlaceholder' |
    'EndWorkSubmit' |
    'WorkStartedToast' |
    'ClockedInAtToast' |
    'ErrorToastTitle' |
    'CouldNotStartWorkErrorToast' |
    'PleaseEnterActivityDescriptionForStartErrorToast' |
    // 'PleaseEnterActivityDescriptionErrorToast' | // General error for activity description - covered by specific
    'WorkEndedToast' |
    'ClockedOutAtToast' |
    'CouldNotEndWorkErrorToast' |
    'UnexpectedError' |
    'CameraAccessRequired' |
    'CameraAccessDeniedMessage' |
    'CameraFeatureNotSupportedError'
>;

interface TimeTrackerProps {
    dictionary: TimeTrackerDictionary;
    locale: Locale;
    onWorkSessionEnded?: () => void;
}

export function TimeTracker({ dictionary, locale, onWorkSessionEnded }: TimeTrackerProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [activeWorkEntry, setActiveWorkEntry] = useState<WorkEntry | null>(null);
    const [activityDescription, setActivityDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEndingWork, setIsEndingWork] = useState(false);
    const [currentTime, setCurrentTime] = useState<string>('');
    const reminderIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const fnsLocale: DateFnsLocaleObject = locale === 'it' ? itLocaleDate : enLocaleDate;

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString(locale === 'it' ? 'it-IT' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }, 1000);
        return () => clearInterval(timer);
    }, [locale]);

    useEffect(() => {
        const getCameraPermission = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.warn('getUserMedia not supported on this browser.');
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: dictionary.ErrorToastTitle,
                    description: dictionary.CameraFeatureNotSupportedError,
                });
                return;
            }
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
                setStream(mediaStream);
                setHasCameraPermission(true);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: dictionary.CameraAccessRequired,
                    description: dictionary.CameraAccessDeniedMessage,
                });
            }
        };

        getCameraPermission();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const playReminderSound = () => {
        console.log("BEEP! Work session in progress reminder.");
    };

    const startReminderInterval = () => {
        if (reminderIntervalRef.current) {
            clearInterval(reminderIntervalRef.current);
        }
        playReminderSound();
        reminderIntervalRef.current = setInterval(playReminderSound, 30 * 60 * 1000);
    };

    const stopReminderInterval = () => {
        if (reminderIntervalRef.current) {
            clearInterval(reminderIntervalRef.current);
            reminderIntervalRef.current = null;
        }
    };

    const capturePhoto = (): string | undefined => {
        if (!videoRef.current || !canvasRef.current || !videoRef.current.srcObject || videoRef.current.readyState < HTMLMediaElement.HAVE_METADATA) {
            console.warn("Cannot capture photo: video element or stream not fully ready or permission denied.");
            return undefined;
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video.videoWidth === 0 || video.videoHeight === 0) {
            console.warn("Cannot capture photo: video dimensions are 0. Video might not be playing or stream not ready.");
            return undefined;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.8);
        }
        console.warn("Cannot capture photo: canvas context not available.");
        return undefined;
    };

    const fetchTodaysEntries = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const allUserHistory = await getWorkHistoryForUser(user.id);
            const today = new Date().toISOString().split('T')[0];
            const openEntry = allUserHistory.find((entry: WorkEntry) => entry.date === today && !entry.endTime); // Added WorkEntry type

            if (openEntry) {
                setActiveWorkEntry(openEntry);
                setActivityDescription(openEntry.activity || '');
                startReminderInterval();
            } else {
                setActiveWorkEntry(null);
                setActivityDescription('');
                stopReminderInterval();
            }
        } catch (error) {
            console.error(dictionary.UnexpectedError, error);
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.UnexpectedError, variant: 'destructive' });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchTodaysEntries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    useEffect(() => {
        return () => {
            stopReminderInterval();
        };
    }, []);


    const handleStartWork = async () => {
        if (!user) return;

        if (!activityDescription.trim()) {
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.PleaseEnterActivityDescriptionForStartErrorToast, variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        const photoDataUri = capturePhoto();
        console.log("Start work photo captured:", photoDataUri ? "Yes" : "No");


        try {
            const newEntry = await startWork(user.id, activityDescription, photoDataUri);
            setActiveWorkEntry(newEntry);
            setActivityDescription(newEntry.activity || '');
            startReminderInterval();
            toast({ title: dictionary.WorkStartedToast, description: dictionary.ClockedInAtToast.replace('{time}', newEntry.startTime) });
        } catch (error) {
            console.error(dictionary.CouldNotStartWorkErrorToast, error);
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.CouldNotStartWorkErrorToast, variant: 'destructive' });
        }
        setIsLoading(false);
    };

    const handleEndWork = async () => {
        if (!user || !activeWorkEntry) return;

        setIsEndingWork(true);
        const photoDataUri = capturePhoto();
        console.log("End work photo captured:", photoDataUri ? "Yes" : "No");

        try {
            const formData: ActivityFormData = { activity: activityDescription };
            const endedEntry = await endWork(activeWorkEntry.id, user.id, formData, photoDataUri);
            if (endedEntry) {
                setActiveWorkEntry(null);
                stopReminderInterval();
                setActivityDescription('');
                toast({ title: dictionary.WorkEndedToast, description: dictionary.ClockedOutAtToast.replace('{time}', endedEntry.endTime || '') });
                onWorkSessionEnded?.();
            } else {
                toast({ title: dictionary.ErrorToastTitle, description: dictionary.CouldNotEndWorkErrorToast, variant: 'destructive' });
            }
        } catch (error) {
            console.error(dictionary.CouldNotEndWorkErrorToast, error);
            toast({ title: dictionary.ErrorToastTitle, description: dictionary.CouldNotEndWorkErrorToast, variant: 'destructive' });
        }
        setIsEndingWork(false);
    };

    const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setActivityDescription(e.target.value);
    };

    return (
        <div className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{dictionary.TimeTrackerTitle}</span>
                        <span className="text-lg font-normal text-muted-foreground">{currentTime}</span>
                    </CardTitle>
                    <CardDescription>
                        {dictionary.TimeTrackerDescription.replace('{date}', formatDateFns(new Date(), 'EEEE d MMMM yyyy', { locale: fnsLocale }))}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <video ref={videoRef} className="hidden w-full aspect-video rounded-md" playsInline autoPlay muted />
                    <canvas ref={canvasRef} className="hidden" />

                    {hasCameraPermission === false && (
                        <Alert variant="destructive" className="mb-4">
                            <VideoOff className="h-4 w-4" />
                            <AlertTitle>{dictionary.CameraAccessRequired}</AlertTitle>
                            <AlertDescription>
                                {dictionary.CameraAccessDeniedMessage}
                            </AlertDescription>
                        </Alert>
                    )}
                    {hasCameraPermission === null && (
                        <Alert variant="default" className="mb-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertTitle>{dictionary.CameraAccessRequired}</AlertTitle>
                            <AlertDescription>
                                {locale === 'it' ? 'Tentativo di accedere alla fotocamera...' : 'Attempting to access camera...'}
                            </AlertDescription>
                        </Alert>
                    )}

                    {!activeWorkEntry ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="activityDescriptionStart" className="text-base">{dictionary.ActivityDescriptionLabel}</Label>
                                <Textarea
                                    id="activityDescriptionStart"
                                    placeholder={dictionary.ActivityDescriptionPlaceholder}
                                    value={activityDescription}
                                    onChange={handleDescriptionChange}
                                    rows={3}
                                    className="text-base"
                                />
                            </div>
                            <Button onClick={handleStartWork} disabled={isLoading || hasCameraPermission !== true} className="w-full text-lg py-6">
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
                                {dictionary.StartWork}
                            </Button>
                        </>
                    ) : (
                        <div className="space-y-4 p-4 border rounded-md bg-primary/5">
                            <h3 className="text-lg font-semibold">
                                {dictionary.ActiveSessionStartedAt.replace('{time}', activeWorkEntry.startTime)}
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="activityDescriptionActive" className="text-base">{dictionary.ActivityDescriptionLabel}</Label>
                                <Textarea
                                    id="activityDescriptionActive"
                                    placeholder={dictionary.ActivityDescriptionPlaceholder}
                                    value={activityDescription}
                                    onChange={handleDescriptionChange}
                                    rows={4}
                                    className="text-base"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    onClick={handleEndWork}
                                    disabled={isEndingWork || hasCameraPermission !== true}
                                    className="w-full text-lg py-6 sm:flex-1"
                                >
                                    {isEndingWork ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <StopCircle className="mr-2 h-5 w-5" />}
                                    {dictionary.EndWorkSubmit}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
