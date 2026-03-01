import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { userService } from '../../services/rbacService';
import { useTenant } from '../tenants/TenantContext';
import type { IUser } from '../../types';

interface AuthContextType {
    user: IUser | null;
    setUser: (user: IUser | null) => void;
    isLoading: boolean;
    logout: () => void;
    impersonateTenant: (tenantId: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { tenant } = useTenant();
    const [user, setUser] = useState<IUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadSavedUser = async () => {
            // 1. Ensure we have an initial admin if no users exist
            if (tenant?.id) {
                await userService.seedInitialAdmin(tenant.id);
            }

            // 2. Load saved session
            const savedUserId = localStorage.getItem('mosque_user_id');
            if (savedUserId) {
                const found = await db.users.get(Number(savedUserId));
                if (found) setUser(found);
            }
            setIsLoading(false);
        };
        loadSavedUser();
    }, [tenant]);

    const logout = () => {
        localStorage.removeItem('mosque_user_id');
        setUser(null);
    };

    const handleSetUser = (u: IUser | null) => {
        if (u?.id) {
            localStorage.setItem('mosque_user_id', String(u.id));
        } else {
            localStorage.removeItem('mosque_user_id');
        }
        setUser(u);
    };

    // Implemented for SaaS Admin impersonation
    const impersonateTenant = async (tenantId: number): Promise<boolean> => {
        try {
            // Find the Super Admin or any Admin of this tenant
            const users = await db.users.where('tenant_id').equals(tenantId).toArray();
            if (users && users.length > 0) {
                // Ideally pick the owner/super-admin, for now pick the first one
                handleSetUser(users[0]);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Failed to impersonate", error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser: handleSetUser, isLoading, logout, impersonateTenant }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
