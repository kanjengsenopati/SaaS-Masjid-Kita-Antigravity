import React, { createContext, useContext, useState, useEffect } from 'react';
import type { IInternalAdmin, IInternalRole } from '../../types';
import { db } from '../../lib/db';
import { seedDatabase } from '../../lib/dbSeeder';

interface SaaSAuthContextProps {
    admin: IInternalAdmin | null;
    role: IInternalRole | null;
    permissions: string[];
    isLoading: boolean;
    login: (email: string) => Promise<boolean>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
}

const SaaSAuthContext = createContext<SaaSAuthContextProps | undefined>(undefined);

export const SaaSAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [admin, setAdmin] = useState<IInternalAdmin | null>(null);
    const [role, setRole] = useState<IInternalRole | null>(null);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadPermissions = async (roleId: number) => {
        const rolePerms = await db.internal_role_permissions
            .where('internal_role_id').equals(roleId)
            .toArray();

        const permIds = rolePerms.map(rp => rp.internal_permission_id);
        const perms = await db.internal_permissions
            .where('id').anyOf(permIds)
            .toArray();

        setPermissions(perms.map(p => p.slug));
    };

    // Auto-login or verify session (Mocking for now to speed up development)
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                // Ensure database is seeded (admins checked independently within the seeder)
                await seedDatabase();

                // By default, try to auto-login the first Super Admin found for dev purposes
                const storedAdmin = await db.internal_admins.toCollection().first();
                if (storedAdmin) {
                    setAdmin(storedAdmin);
                    const adminRole = await db.internal_roles.get(storedAdmin.internal_role_id);
                    setRole(adminRole || null);
                    if (adminRole?.id) await loadPermissions(adminRole.id);
                }
            } catch (err) {
                console.error("Failed to init SaaS Auth", err);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    const login = async (email: string) => {
        setIsLoading(true);
        try {
            const foundAdmin = await db.internal_admins.where('email').equals(email).first();
            if (foundAdmin) {
                setAdmin(foundAdmin);
                const adminRole = await db.internal_roles.get(foundAdmin.internal_role_id);
                setRole(adminRole || null);
                if (adminRole?.id) await loadPermissions(adminRole.id);
                return true;
            }
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setAdmin(null);
        setRole(null);
        setPermissions([]);
    };

    const hasPermission = (permission: string) => {
        if (role?.name === 'Super Admin') return true;
        return permissions.includes(permission);
    };

    return (
        <SaaSAuthContext.Provider value={{ admin, role, permissions, isLoading, login, logout, hasPermission }}>
            {children}
        </SaaSAuthContext.Provider>
    );
};

export const useSaaSAuth = () => {
    const context = useContext(SaaSAuthContext);
    if (!context) {
        throw new Error('useSaaSAuth must be used within a SaaSAuthProvider');
    }
    return context;
};
