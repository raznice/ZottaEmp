
import type { User, LoginFormData, EmployeeFormData, PendingAdminUpdate } from '@/lib/types';

const USER_STORAGE_KEY = 'zottaemp_user'; // Changed key to avoid conflict
const PENDING_ADMIN_UPDATE_KEY = 'zottaemp_pending_admin_update'; // Changed key
const MOCK_USERS_STORAGE_KEY = 'zottaemp_mock_users'; // Changed key

const ADMIN_EMAIL = 'ZottaRossoRaj';
const ADMIN_PASSWORD = 'Zotta!STS@RR25';

let mockUsers: User[] = [
    { id: 'admin001', email: ADMIN_EMAIL, name: 'Admin User', role: 'admin', password: ADMIN_PASSWORD },
    {
        id: 'emp001',
        email: 'employee1@example.com',
        name: 'John Doe',
        role: 'employee',
        age: 30,
        phoneNumber: '123-456-7890',
        address: '123 Main St, Anytown',
        joinDate: '2023-01-15',
        password: 'password1'
    },
    {
        id: 'emp002',
        email: 'employee2@example.com',
        name: 'Jane Smith',
        role: 'employee',
        age: 28,
        phoneNumber: '987-654-3210',
        address: '456 Oak Ave, Otherville',
        joinDate: '2022-11-01',
        password: 'password2'
    },
];

function saveUsersToLocalStorage() {
    if (typeof window !== 'undefined') {
        localStorage.setItem(MOCK_USERS_STORAGE_KEY, JSON.stringify(mockUsers));
    }
}

function loadUsersFromLocalStorage() {
    if (typeof window !== 'undefined') {
        const storedUsers = localStorage.getItem(MOCK_USERS_STORAGE_KEY);
        if (storedUsers) {
            try {
                const parsedUsers = JSON.parse(storedUsers);
                if (Array.isArray(parsedUsers)) {
                    mockUsers = parsedUsers;
                } else {
                    console.warn("Invalid user data in localStorage, re-initializing.");
                    saveUsersToLocalStorage(); // Save default if stored is invalid
                }
            } catch (e) {
                console.error("Error parsing users from localStorage:", e);
                saveUsersToLocalStorage(); // Save default if parsing fails
            }
        } else {
            saveUsersToLocalStorage(); // Initialize if not present
        }
    }
}

if (typeof window !== 'undefined') {
    loadUsersFromLocalStorage();
}


export function login(credentials: LoginFormData): User | null {
    if (typeof window !== 'undefined') loadUsersFromLocalStorage();

    const user = mockUsers.find(u => u.email === credentials.email);

    if (!user) {
        if (typeof window !== 'undefined') console.warn('Login attempt: User not found -', credentials.email);
        return null;
    }

    if (user.role === 'admin') {
        if (credentials.password !== user.password) {
            if (typeof window !== 'undefined') console.warn('Login attempt: Invalid admin credentials for -', user.email);
            return null;
        }
    } else if (user.role === 'employee') {
        if (!user.password || credentials.password !== user.password) {
            if (typeof window !== 'undefined') console.warn('Login attempt: Invalid employee credentials for -', user.email);
            return null;
        }
    } else {
        // Should not happen with current roles
        if (typeof window !== 'undefined') console.warn('Login attempt: Unknown user role for -', user.email);
        return null;
    }

    if (typeof window !== 'undefined') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    return user;
}

export function logout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(PENDING_ADMIN_UPDATE_KEY);
    }
}

export function getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
        const userJson = localStorage.getItem(USER_STORAGE_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }
    return null;
}

// --- Employee Management Functions ---
export function getAllEmployees(): User[] {
    if (typeof window !== 'undefined') loadUsersFromLocalStorage();
    return mockUsers.filter(user => user.role === 'employee');
}

export function getEmployeeById(userId: string): User | undefined {
    if (typeof window !== 'undefined') loadUsersFromLocalStorage();
    return mockUsers.find(user => user.id === userId && user.role === 'employee');
}

export function addEmployee(data: EmployeeFormData): User {
    if (typeof window !== 'undefined') loadUsersFromLocalStorage();

    const newEmployee: User = {
        id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        ...data,
        role: 'employee',
        password: data.newPassword || `defaultPass${Math.random().toString(36).substring(2, 7)}`,
    };
    if ('newPassword' in (newEmployee as any)) {
        delete (newEmployee as any).newPassword;
    }


    mockUsers.push(newEmployee);
    if (typeof window !== 'undefined') saveUsersToLocalStorage();
    return newEmployee;
}

export function updateEmployee(userId: string, data: Partial<EmployeeFormData>): User | null {
    if (typeof window !== 'undefined') loadUsersFromLocalStorage();
    const employeeIndex = mockUsers.findIndex(user => user.id === userId && user.role === 'employee');
    if (employeeIndex === -1) return null;

    const updatedEmployeeData = { ...mockUsers[employeeIndex], ...data };

    if (data.newPassword) {
        updatedEmployeeData.password = data.newPassword;
    }
    if ('newPassword' in (updatedEmployeeData as any)) {
        delete (updatedEmployeeData as any).newPassword;
    }


    mockUsers[employeeIndex] = updatedEmployeeData;
    if (typeof window !== 'undefined') saveUsersToLocalStorage();
    return updatedEmployeeData;
}

export function deleteEmployee(userId: string): boolean {
    if (typeof window !== 'undefined') loadUsersFromLocalStorage();
    const initialLength = mockUsers.length;
    mockUsers = mockUsers.filter(user => user.id !== userId);
    const success = mockUsers.length < initialLength;
    if (success && typeof window !== 'undefined') {
        saveUsersToLocalStorage();
    }
    return success;
}

export function getAllMockUsersForFilter(): Pick<User, 'id' | 'name'>[] {
    if (typeof window !== 'undefined') loadUsersFromLocalStorage();
    return mockUsers.filter(user => user.role === 'employee').map(emp => ({ id: emp.id, name: emp.name }));
}

// --- Admin Profile Management Functions ---

export function storePendingAdminUpdate(pendingUpdate: PendingAdminUpdate): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(PENDING_ADMIN_UPDATE_KEY, JSON.stringify(pendingUpdate));
    }
}

export function getPendingAdminUpdate(): PendingAdminUpdate | null {
    if (typeof window !== 'undefined') {
        const data = localStorage.getItem(PENDING_ADMIN_UPDATE_KEY);
        return data ? JSON.parse(data) : null;
    }
    return null;
}

export function clearPendingAdminUpdate(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(PENDING_ADMIN_UPDATE_KEY);
    }
}

export function updateAdminCredentials(adminId: string, newUsername?: string, newPassword?: string): User | null {
    if (typeof window !== 'undefined') loadUsersFromLocalStorage();
    const adminIndex = mockUsers.findIndex(u => u.id === adminId && u.role === 'admin');
    if (adminIndex === -1) {
        console.error("Admin user not found for update.");
        return null;
    }

    const adminUser = { ...mockUsers[adminIndex] }; // Create a copy to modify
    let updated = false;

    if (newUsername && adminUser.email !== newUsername) {
        adminUser.email = newUsername;
        updated = true;
    }
    if (newPassword && adminUser.password !== newPassword) {
        adminUser.password = newPassword;
        updated = true;
    }

    if (updated) {
        mockUsers[adminIndex] = adminUser;
        if (typeof window !== 'undefined') {
            saveUsersToLocalStorage();
            const currentUserSession = getCurrentUser();
            if (currentUserSession && currentUserSession.id === adminId) {
                // Update the current session user if it's the admin being changed
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
            }
        }
        return adminUser;
    }
    return adminUser; // Return user even if not updated, for consistency
}
