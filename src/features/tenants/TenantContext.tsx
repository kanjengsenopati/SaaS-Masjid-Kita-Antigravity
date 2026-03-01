import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { ITenant } from '../../types';
import { tenantService } from '../../services/tenantService';
import { seedDatabase } from '../../lib/dbSeeder';
import { db } from '../../lib/db';

interface TenantContextProps {
    tenant: ITenant | null;
    isLoading: boolean;
    refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tenant, setTenant] = useState<ITenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    const resolveTenant = useCallback(async () => {
        setIsLoading(true);
        const host = window.location.host;
        const path = location.pathname;

        let activeTenant: ITenant | null = null;

        // 1. Try Slug-based resolution if path starts with /website/ or /login/
        if (path.startsWith('/website/') || path.startsWith('/login/')) {
            const pathParts = path.split('/');
            // for /website/:slug or /login/:slug, slug is at index 2
            const slug = pathParts[2];
            if (slug) {
                const res = await tenantService.getBySlug(slug);
                activeTenant = res.data || null;
            }
        }

        // 2. Fallback to host-based resolution
        // Skip host-based resolution if we're on the root path of the main platform host
        // (Assuming localhost is the main platform host for now)
        const isMainPlatform = (host.includes('localhost') || host.includes('mosqueapp') || host.includes('masjidkita')) && (path === '/' || path === '/login');

        if (!activeTenant && !isMainPlatform) {
            const res = await tenantService.getByHost(host);
            activeTenant = res.data || null;
        }

        // 3. Special Case: Seeding for new installs or missing system data on localhost
        if (!activeTenant && host.includes('localhost')) {
            try {
                const tenantsTable = db.table('tenants');
                const modulesTable = db.table('modules');

                if (tenantsTable && modulesTable) {
                    const tenantCount = await tenantsTable.count();
                    const moduleCount = await modulesTable.count();

                    if (tenantCount === 0 || moduleCount === 0) {
                        console.log("Missing critical data on localhost, running seeder...");
                        await seedDatabase();
                        const res = await tenantService.getByHost(host);
                        activeTenant = res.data || null;
                    }
                } else {
                    console.warn("Required tables 'tenants' or 'modules' not found in schema yet.");
                }
            } catch (err) {
                console.error("Seeding check failed:", err);
            }
        }

        setTenant(activeTenant);
        setIsLoading(false);
    }, [location.pathname]);

    useEffect(() => {
        resolveTenant();
    }, [resolveTenant]);

    return (
        <TenantContext.Provider value={{ tenant, isLoading, refreshTenant: resolveTenant }}>
            {isLoading ? (
                <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 text-emerald-600">
                    <span className="text-xl animate-pulse">Menghubungkan ke Sistem...</span>
                </div>
            ) : (
                children
            )}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
};
