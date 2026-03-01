import React, { useState } from 'react';
import { useTenant } from '../tenants/TenantContext';
import { GeneralSettings } from './components/GeneralSettings';
import { UserManagement } from './components/UserManagement';
import { RoleManagement } from './components/RoleManagement';
import { FinanceCategoryManagement } from './components/FinanceCategoryManagement';
import { UserProfile } from './components/UserProfile';
import { Settings, Users, Shield, Receipt, User as UserIcon } from 'lucide-react';
import clsx from 'clsx';

export const SettingsModule: React.FC = () => {
    const { tenant } = useTenant();
    const [activeTab, setActiveTab] = useState<'general' | 'users' | 'roles' | 'finance' | 'profile'>('general');

    if (!tenant) return null;

    const tabs = [
        { id: 'general', label: 'Pengaturan Umum', icon: Settings },
        { id: 'users', label: 'Manajemen Pengguna', icon: Users },
        { id: 'roles', label: 'Roles & Hak Akses', icon: Shield },
        { id: 'finance', label: 'Kategori Keuangan', icon: Receipt },
        { id: 'profile', label: 'Profil Saya', icon: UserIcon },
    ] as const;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Pengaturan Sistem</h2>
                <p className="text-gray-500 py-1">Kelola konfigurasi layanan, pengguna, dan hak akses masjid.</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={clsx(
                                    "flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                                    isActive
                                        ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300 dark:hover:border-gray-600"
                                )}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="pt-2">
                {activeTab === 'general' && <GeneralSettings />}
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'roles' && <RoleManagement />}
                {activeTab === 'finance' && <FinanceCategoryManagement />}
                {activeTab === 'profile' && <UserProfile />}
            </div>
        </div>
    );
};
