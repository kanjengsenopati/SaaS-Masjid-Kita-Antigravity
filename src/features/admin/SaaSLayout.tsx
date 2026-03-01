import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useSaaSAuth } from './SaaSAuthContext';
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, ShieldCheck, Globe, Package, TrendingUp } from 'lucide-react';

export const SaaSLayout: React.FC = () => {
    const { admin, role, logout, isLoading } = useSaaSAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !admin) {
            navigate('/saas-login', { replace: true });
        }
    }, [isLoading, admin, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/saas-login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 text-emerald-600">
                <span className="animate-pulse font-bold text-xl">Memuat Sesi Admin SaaS...</span>
            </div>
        );
    }

    if (!admin) {
        return null; // Will redirect via useEffect
    }

    const isSuperAdmin = role?.name === 'Super Admin';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <h1 className="text-xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-white uppercase">
                        <ShieldCheck className="text-emerald-600" size={24} />
                        MASJID<span className="text-emerald-600">KITA</span> Admin
                    </h1>
                </div>

                <div className="p-4 flex-grow space-y-2">
                    <div className="px-4 py-2 mb-4 text-xs font-black uppercase tracking-widest text-slate-400">Main Menu</div>
                    <NavLink
                        to="/saas-admin"
                        end
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                    >
                        <LayoutDashboard size={20} /> Overview
                    </NavLink>
                    <NavLink
                        to="/saas-admin/tenants"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                    >
                        <Globe size={20} /> Daftar Masjid
                    </NavLink>
                    <NavLink
                        to="/saas-admin/staff"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                    >
                        <Users size={20} /> Staff Management
                    </NavLink>

                    {/* Role Guarded Menus */}
                    {isSuperAdmin && (
                        <>
                            <div className="px-4 py-2 mt-6 mb-2 text-xs font-black uppercase tracking-widest text-emerald-600/50">Restricted</div>
                            <NavLink
                                to="/saas-admin/revenue"
                                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                            >
                                <CreditCard size={20} /> Affiliate Center
                            </NavLink>
                            <NavLink
                                to="/saas-admin/affiliate-portal"
                                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                            >
                                <TrendingUp size={20} /> Affiliate Portal
                            </NavLink>
                            <NavLink
                                to="/saas-admin/packages"
                                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                            >
                                <Package size={20} /> Paket & Pricing
                            </NavLink>
                            <NavLink
                                to="/saas-admin/settings"
                                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                            >
                                <Settings size={20} /> System Settings
                            </NavLink>
                        </>
                    )}
                </div>

                {/* Profile Widget */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex items-center justify-between">
                        <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{admin.name}</div>
                            <div className="text-xs text-slate-500 font-medium">{role?.name || 'Staff'}</div>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 overflow-y-auto w-full">
                <Outlet />
            </main>
        </div>
    );
};
