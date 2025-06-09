
'use server';

import type { User, WorkEntry, ActivityFormData, EmployeeFormData, PendingAdminUpdate } from '@/lib/types';
import * as AuthMethods from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'work-entries.data.json');

let workEntries: WorkEntry[] = [];

// Helper function to load entries from file
function loadWorkEntriesFromFile() {
    try {
        if (fs.existsSync(DATA_FILE_PATH)) {
            const fileData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
            if (fileData.trim() === "") { // Handle empty file
                console.log(`[Server Action Load] ${DATA_FILE_PATH} is empty. Initializing with empty array.`);
                workEntries = [];
                return;
            }
            const parsedData = JSON.parse(fileData);
            if (Array.isArray(parsedData)) {
                workEntries = parsedData;
                console.log(`[Server Action Load] Loaded ${workEntries.length} work entries from ${DATA_FILE_PATH}`);
            } else {
                console.warn(`[Server Action Load] Invalid data format in ${DATA_FILE_PATH}. Initializing with empty array.`);
                workEntries = [];
            }
        } else {
            console.log(`[Server Action Load] ${DATA_FILE_PATH} not found. Initializing with empty work entries array.`);
            workEntries = [];
        }
    } catch (error) {
        console.error('[Server Action Load] Error loading work entries from file:', error);
        workEntries = [];
    }
}

// Helper function to save entries to file
function saveWorkEntriesToFile() {
    try {
        const jsonData = JSON.stringify(workEntries, null, 2);
        fs.writeFileSync(DATA_FILE_PATH, jsonData, 'utf-8');
        const sampleLog = workEntries.slice(-3).map(e => ({ id: e.id, userId: e.userId, activity: e.activity?.substring(0, 10) }));
        console.log(`[Server Action Save] Saved ${workEntries.length} work entries to ${DATA_FILE_PATH}. Current workEntries (sample):`, JSON.stringify(sampleLog));
    } catch (error) {
        console.error('[Server Action Save] Error saving work entries to file:', error);
    }
}

// Load initial data when the module is first loaded by the server
loadWorkEntriesFromFile();


export async function startWork(userId: string, activity: string, photoDataUri?: string): Promise<WorkEntry> {
    console.log('[Server Action] startWork called by userId:', userId, 'Activity:', activity, 'Start Photo present:', !!photoDataUri);
    const now = new Date();
    const newEntry: WorkEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        userId,
        date: now.toISOString().split('T')[0],
        startTime: now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        activity: activity,
        startPhotoUrl: photoDataUri || undefined,
    };

    workEntries.push(newEntry);
    console.log(`[Server Action] startWork: Entry added. Total server entries: ${workEntries.length} Current workEntries:`, JSON.stringify(workEntries.slice(-3).map(e => ({ id: e.id, userId: e.userId, activity: e.activity?.substring(0, 10) }))));
    saveWorkEntriesToFile();

    revalidatePath('/[locale]/employee/dashboard', 'layout');
    revalidatePath('/[locale]/admin/dashboard', 'layout');
    return newEntry;
}

export async function endWork(entryId: string, userId: string, data: ActivityFormData, photoDataUri?: string): Promise<WorkEntry | null> {
    console.log('[Server Action] endWork called for entryId:', entryId, 'userId:', userId, 'Activity:', data.activity, 'End Photo present:', !!photoDataUri);
    const entryIndex = workEntries.findIndex(e => e.id === entryId && e.userId === userId && !e.endTime);

    if (entryIndex === -1) {
        console.error('[Server Action] endWork: No active work entry found or entry already ended for ID:', entryId);
        return null;
    }

    const entryToEnd = { ...workEntries[entryIndex] };
    const now = new Date();
    entryToEnd.endTime = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    entryToEnd.activity = data.activity;

    const [startH, startM] = entryToEnd.startTime.split(':').map(Number);
    const [endH, endM] = entryToEnd.endTime.split(':').map(Number);
    let startDate = new Date(0, 0, 0, startH, startM);
    let endDate = new Date(0, 0, 0, endH, endM);

    if (endDate < startDate) {
        endDate.setDate(endDate.getDate() + 1);
    }

    let durationMillis = endDate.getTime() - startDate.getTime();
    entryToEnd.durationMinutes = Math.round(durationMillis / (1000 * 60));

    if (photoDataUri) {
        entryToEnd.endPhotoUrl = photoDataUri;
    }

    workEntries[entryIndex] = entryToEnd;
    console.log('[Server Action] endWork: Entry updated. Total server entries:', workEntries.length, 'Updated entry (sample):', JSON.stringify({ id: workEntries[entryIndex].id, userId: workEntries[entryIndex].userId, activity: workEntries[entryIndex].activity?.substring(0, 10) }));
    saveWorkEntriesToFile();

    revalidatePath('/[locale]/employee/dashboard', 'layout');
    revalidatePath('/[locale]/admin/dashboard', 'layout');

    return entryToEnd;
}

export async function getWorkHistoryForUser(userId: string): Promise<WorkEntry[]> {
    console.log(`[Server Action] getWorkHistoryForUser CALLED for userId: ${userId}.`);
    loadWorkEntriesFromFile(); // Ensure we have the latest from file
    const userEntries = workEntries.filter(entry => entry.userId === userId);
    const sortedEntries = userEntries.sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) return dateComparison;
        if (a.startTime && b.startTime) {
            return b.startTime.localeCompare(a.startTime);
        }
        return 0;
    });
    console.log(`[Server Action] getWorkHistoryForUser for userId ${userId} returning ${sortedEntries.length} entries.`);
    return sortedEntries;
}


export async function getAllWorkEntries(): Promise<WorkEntry[]> {
    console.log('[Server Action] getAllWorkEntries CALLED. Reading from file for admin view.');
    loadWorkEntriesFromFile(); // Ensure we read the latest from the file
    const entriesToReturn = [...workEntries]; // Return a copy
    console.log(`[Server Action] getAllWorkEntries: All entries on server: ${entriesToReturn.length}`, JSON.stringify(entriesToReturn.map(e => ({ id: e.id, userId: e.userId, activity: e.activity?.substring(0, 10) }))));
    return entriesToReturn.sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);
        if (dateComparison !== 0) return dateComparison;
        if (a.startTime && b.startTime) {
            return b.startTime.localeCompare(a.startTime);
        }
        return 0;
    });
}


export async function getWorkEntryById(entryId: string): Promise<WorkEntry | undefined> {
    console.log(`[Server Action] getWorkEntryById CALLED for entryId: ${entryId}`);
    loadWorkEntriesFromFile(); // Ensure latest data
    return workEntries.find(e => e.id === entryId);
}

export async function adminGetAllEmployees(): Promise<User[]> {
    return AuthMethods.getAllEmployees();
}

export async function adminGetEmployeeById(userId: string): Promise<User | undefined> {
    return AuthMethods.getEmployeeById(userId);
}

export async function adminAddEmployee(data: EmployeeFormData): Promise<User> {
    const newEmployee = AuthMethods.addEmployee(data);
    revalidatePath('/[locale]/admin/dashboard', 'layout');
    return newEmployee;
}

export async function adminUpdateEmployee(userId: string, data: Partial<EmployeeFormData>): Promise<User | null> {
    const updatedEmployee = AuthMethods.updateEmployee(userId, data);
    revalidatePath('/[locale]/admin/dashboard', 'layout');
    return updatedEmployee;
}

export async function adminDeleteEmployee(userId: string): Promise<boolean> {
    const success = AuthMethods.deleteEmployee(userId);
    revalidatePath('/[locale]/admin/dashboard', 'layout');
    return success;
}

export async function adminGetEmployeeListForFilter(): Promise<Pick<User, 'id' | 'name'>[]> {
    return AuthMethods.getAllMockUsersForFilter();
}

export async function initiateAdminProfileChange(
    adminUserId: string,
    newUsername?: string,
    newPassword?: string
): Promise<{ success: boolean; message: string; token?: string }> {
    if (!adminUserId) {
        return { success: false, message: 'Admin user ID is required.' };
    }
    if (!newUsername && !newPassword) {
        return { success: false, message: 'No changes requested. Provide new username or password.' };
    }

    const token = `mock_token_${Date.now()}`;
    const expiresAt = Date.now() + 15 * 60 * 1000;

    const pendingUpdate: PendingAdminUpdate = {
        adminUserId,
        newUsername,
        newPassword,
        token,
        expiresAt,
    };
    AuthMethods.storePendingAdminUpdate(pendingUpdate);

    return {
        success: true,
        message: `Mock verification initiated. Use this token to confirm: ${token}`, // Updated message
        token
    };
}

export async function confirmAdminProfileChange(
    adminUserId: string,
    token: string
): Promise<{ success: boolean; message: string; updatedUser?: User }> {
    if (!adminUserId || !token) {
        return { success: false, message: 'Admin user ID and token are required.' };
    }

    const pendingUpdate = AuthMethods.getPendingAdminUpdate();

    if (!pendingUpdate) {
        return { success: false, message: 'No pending update found or it has expired.' };
    }

    if (pendingUpdate.adminUserId !== adminUserId || pendingUpdate.token !== token) {
        return { success: false, message: 'Invalid token or user ID mismatch.' };
    }

    if (Date.now() > pendingUpdate.expiresAt) {
        AuthMethods.clearPendingAdminUpdate();
        return { success: false, message: 'Verification token expired.' };
    }

    const updatedUser = AuthMethods.updateAdminCredentials(
        adminUserId,
        pendingUpdate.newUsername,
        pendingUpdate.newPassword
    );

    if (updatedUser) {
        AuthMethods.clearPendingAdminUpdate();
        revalidatePath('/[locale]/admin/dashboard', 'layout');
        const currentUser = AuthMethods.getCurrentUser();
        if (currentUser && updatedUser.email !== currentUser.email) {
            revalidatePath('/[locale]/', 'layout');
        }
        return { success: true, message: 'Admin credentials updated successfully.', updatedUser };
    } else {
        return { success: false, message: 'Failed to update admin credentials.' };
    }
}
