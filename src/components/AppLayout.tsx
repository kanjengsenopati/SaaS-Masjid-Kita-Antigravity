import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTenant } from '../features/tenants/TenantContext';
import { useAuth } from '../features/auth/AuthContext';
import { db } from '../lib/db';
import { LayoutDashboard, Users, HeartHandshake, Settings, Building2, Wallet, CalendarDays, BookOpen, Archive, Tv, Globe, CreditCard } from 'lucide-react';
import clsx from 'clsx';

export const AppLayout: React.FC = () => {
    const { tenant } = useTenant();
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!tenant) return null;

    const [allowedModuleSlugs, setAllowedModuleSlugs] = React.useState<string[]>([]);
    const [isModulesLoading, setIsModulesLoading] = React.useState(true);

    React.useEffect(() => {
        const loadAllowedModules = async () => {
            if (!tenant || !tenant.package_id) {
                // For Lite plan without specific package_id (old data) or no package
                // Default to basic modules: finance, congregation, website, signage
                setAllowedModuleSlugs(['finance', 'congregation', 'website', 'signage']);
                setIsModulesLoading(false);
                return;
            }

            try {
                const pkgMods = await db.package_modules.where('package_id').equals(tenant.package_id).toArray();
                const modIds = pkgMods.map(pm => pm.module_id);
                const mods = await db.modules.where('id').anyOf(modIds).toArray();
                setAllowedModuleSlugs(mods.map(m => m.slug));
            } catch (err) {
                console.error("Failed to load modules", err);
            } finally {
                setIsModulesLoading(false);
            }
        };

        loadAllowedModules();
    }, [tenant]);

    if (!tenant) return null;

    const allGroups = [
        {
            title: 'Menu Utama',
            items: [
                { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, slug: 'dashboard' },
            ]
        },
        {
            title: 'Dakwah & Kegiatan',
            items: [
                { name: 'Agenda & Kegiatan', path: '/agenda', icon: CalendarDays, slug: 'agenda' },
                { name: 'Data Asatidz', path: '/asatidz', icon: BookOpen, slug: 'asatidz' },
            ]
        },
        {
            title: 'Umat & Sosial',
            items: [
                { name: 'Jamaah & Mustahik', path: '/congregation', icon: Users, slug: 'congregation' },
                { name: 'Sosial & Santunan', path: '/social', icon: HeartHandshake, slug: 'social' },
            ]
        },
        {
            title: 'Operasional',
            items: [
                { name: 'Keuangan', path: '/finance', icon: Wallet, slug: 'finance' },
                { name: 'Aset Masjid', path: '/assets', icon: Archive, slug: 'assets' },
            ]
        },
        {
            title: 'Sistem',
            items: [
                { name: 'Yayasan & Takmir', path: '/organization', icon: Building2, slug: 'organization' },
                { name: 'Halaman Depan', path: `/website/${tenant.slug}`, icon: Globe, slug: 'website' },
                { name: 'Digital Signage', path: '/signage', icon: Tv, slug: 'signage' },
                { name: 'Berlangganan', path: '/dashboard/subscription', icon: CreditCard, slug: 'subscription' },
                { name: 'Program Affiliate', path: '/dashboard/subscription', icon: HeartHandshake, slug: 'affiliate' },
                { name: 'Pengaturan', path: '/settings', icon: Settings, slug: 'settings' },
            ]
        }
    ];

    // Filter items based on allowedModuleSlugs
    const navGroups = allGroups.map(group => ({
        ...group,
        items: group.items.filter(item =>
            item.slug === 'dashboard' ||
            item.slug === 'organization' ||
            item.slug === 'settings' ||
            allowedModuleSlugs.includes(item.slug)
        )
    })).filter(group => group.items.length > 0);

    // Flatten items for route matching (e.g., getting the current page title)
    const flatNavItems = navGroups.flatMap(group => group.items);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <aside className="w-64 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <div
                    className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 text-white font-bold text-lg px-4 truncate shadow-sm transition-colors duration-300"
                    style={{ backgroundColor: tenant.primaryColor }}
                >
                    {tenant.name}
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-gray-400">
                                {group.title}
                            </h3>
                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                                    return (
                                        <Link
                                            key={item.name}
                                            to={item.path}
                                            className={clsx(
                                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-emerald-50 text-emerald-700 dark:bg-gray-700 dark:text-emerald-400"
                                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                            )}
                                            style={isActive ? { borderLeft: `3px solid ${tenant.primaryColor}` } : {}}
                                        >
                                            <Icon size={18} className={clsx(isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400")} />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                    <h1 className="text-xl font-semibold text-gray-800 dark:text-white truncate">
                        {flatNavItems.find(n => n.path === location.pathname)?.name || 'Mosque Dashboard'}
                    </h1>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user.username}</p>
                                    <button onClick={logout} className="text-[10px] text-gray-400 hover:text-red-500 transition-colors font-medium">Keluar</button>
                                </div>
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                                    {user.avatar_base64 ? (
                                        <img src={user.avatar_base64} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-gray-400 italic">Belum Login</div>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 relative">
                    {isModulesLoading ? (
                        <div className="flex items-center justify-center h-full text-emerald-600 animate-pulse font-bold">
                            Menyiapkan Modul...
                        </div>
                    ) : (
                        <Outlet />
                    )}
                </div>
            </main>
        </div>
    );
};
