import { useState, useEffect } from 'react';
import { useTenant } from '../tenants/TenantContext';
import { memberService } from '../../services/memberService';
import { disbursementService } from '../../services/socialService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Users, Heart, Receipt, TrendingUp, CheckCircle2, Box } from 'lucide-react';
import { db } from '../../lib/db';
import type { IModule } from '../../types';

export function DashboardHome() {
    const { tenant: currentTenant } = useTenant();
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalMustahik: 0,
        totalDisbursements: 0,
        amountDisbursed: 0
    });
    const [activeModules, setActiveModules] = useState<IModule[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!currentTenant) return;
            setIsLoading(true);

            try {
                const [membersRes, disbRes] = await Promise.all([
                    memberService.getAllForTenant(currentTenant.id!),
                    disbursementService.getAllForTenant(currentTenant.id!)
                ]);

                // Fetch Active Modules
                if (currentTenant.package_id) {
                    const pkgModules = await db.package_modules.where('package_id').equals(currentTenant.package_id).toArray();
                    const moduleIds = pkgModules.map(pm => pm.module_id);
                    const modules = await db.modules.where('id').anyOf(moduleIds).toArray();
                    setActiveModules(modules);
                }

                let totalMembers = 0;
                let totalMustahik = 0;
                let totalDisbursements = 0;
                let amountDisbursed = 0;

                if (membersRes.data) {
                    totalMembers = membersRes.data.length;
                    totalMustahik = membersRes.data.filter(m => m.is_mustahik).length;
                }

                if (disbRes.data) {
                    totalDisbursements = disbRes.data.length;
                    amountDisbursed = disbRes.data.reduce((sum, d) => sum + d.amount, 0);
                }

                setStats({
                    totalMembers,
                    totalMustahik,
                    totalDisbursements,
                    amountDisbursed
                });
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentTenant]);

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ringkasan Aktivitas</h1>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl flex-1"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ringkasan Aktivitas</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Pantau statistik utama dari {currentTenant?.name || 'Sistem Informasi Manajemen Masjid'} Anda.
                    </p>
                </div>
                {currentTenant?.plan && (
                    <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                        <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest leading-none mb-1">Paket Aktif</p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 leading-none">{currentTenant.plan}</p>
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Jamaah Terdaftar</CardTitle>
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.totalMembers}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Data jamaah di database</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Mustahik</CardTitle>
                        <Heart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.totalMustahik}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Penerima ZISWAF terverifikasi</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Dana Disalurkan</CardTitle>
                        <TrendingUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            Rp {stats.amountDisbursed.toLocaleString('id-ID')}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total donasi tersalurkan</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Riwayat Penyaluran</CardTitle>
                        <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {stats.totalDisbursements}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total transaksi penyaluran</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Box className="w-5 h-5 text-emerald-600" />
                                Modul Terpasang
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-1">Semua fitur yang aktif sesuai paket Anda.</p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {activeModules.map((mod) => (
                                <div key={mod.id} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 transition-all hover:border-emerald-200 dark:hover:border-emerald-800 group">
                                    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow-sm group-hover:text-emerald-600 transition-colors">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{mod.name}</span>
                                </div>
                            ))}
                            {activeModules.length === 0 && (
                                <p className="col-span-full py-8 text-center text-gray-400 font-medium italic">Belum ada modul tambahan terpasang.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">Butuh Bantuan?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Jika Anda mengalami kendala atau membutuhkan aktivasi modul tambahan, silakan hubungi tim dukungan kami.
                        </p>
                        <button className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-900 dark:text-white text-sm font-bold rounded-xl transition-all">
                            Pusat Bantuan
                        </button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
