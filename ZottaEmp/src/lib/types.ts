
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'employee' | 'admin';
    age?: number;
    phoneNumber?: string;
    address?: string;
    joinDate?: string;
    password?: string;
}

export interface WorkEntry {
    id: string;
    userId: string;
    date: string;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
    activity: string;
    startPhotoUrl?: string;
    endPhotoUrl?: string;
}

export type ActivityFormData = {
    activity: string;
};

export type LoginFormData = {
    email: string;
    password?: string;
};

export type EmployeeFormData = Omit<User, 'id' | 'role' | 'password'> & { // Exclude password here
    newPassword?: string; // For setting/changing password
};


export interface PendingAdminUpdate {
    adminUserId: string;
    newUsername?: string;
    newPassword?: string;
    token: string;
    expiresAt: number;
}
