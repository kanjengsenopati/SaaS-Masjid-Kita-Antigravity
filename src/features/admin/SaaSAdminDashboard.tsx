import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import type { ITenant, IAffiliate, ICommission, ISystemAuditLog } from '../../types';
import {
    TrendingUp,
    Wallet,
    Globe,
    Award,
    Activity,
    DownloadCloud,
    RefreshCw
} from 'lucide-react';
import { resetAndSeedDatabase } from '../../lib/dbSeeder';
import { formatCurrencyRp } from '../../utils/formatters';
import { downloadDatabaseExport } from '../../utils/exporter';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export const SaaSAdminDashboard: React.FC = () => {
    const [tenants, setTenants] = useState<ITenant[]>([]);
    const [affiliates, setAffiliates] = useState<IAffiliate[]>([]);
    const [commissions, setCommissions] = useState<ICommission[]>([]);
    const [auditLogs, setAuditLogs] = useState<(ISystemAuditLog & { adminName?: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const allTenants = await db.tenants.toArray();
                const allAffiliates = await db.affiliates.toArray();
                const allCommissions = await db.commissions.toArray();

                // Fetch recent logs
                const logs = await db.system_audit_logs.orderBy('created_at').reverse().limit(15).toArray();
                const admins = await db.internal_admins.toArray();
                const enrichedLogs = logs.map(log => {
                    const admin = admins.find(a => a.id === log.admin_id);
                    return { ...log, adminName: admin?.name || 'Unknown' };
                });

                setTenants(allTenants);
                setAffiliates(allAffiliates);
                setCommissions(allCommissions);
                setAuditLogs(enrichedLogs);
            } finally {
                setIsLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    const handleForceReset = async () => {
        if (window.confirm('PERINGATAN: Ini akan MENGHAPUS SEMUA DATA di database dan mengembalikannya ke pengaturan awal (Seeding Baru). Apakah Anda yakin?')) {
            setIsLoading(true);
            try {
                await resetAndSeedDatabase();
                alert('Database berhasil di-reset dan di-seed ulang. Mengalihkan...');
                window.location.reload();
            } catch (err) {
                console.error(err);
                alert('Gagal melakukan reset database.');
                setIsLoading(false);
            }
        }
    };

    // 1. Total MRR Calculation
    // Only ACTIVE tenants (or those with valid plans without expiry, or expiry > today) count towards MRR
    const calculateMRR = () => {
        let total = 0;
        const now = new Date();
        tenants.forEach(t => {
            if (t.plan === 'PRO' || t.plan === 'ENTERPRISE') {
                const isExpired = t.expires_at ? new Date(t.expires_at) < now : false;
                if (!isExpired) {
                    // For demo purposes: PRO = 150k, Enterprise = Custom (Assume 500k for calculation)
                    total += t.plan === 'PRO' ? 150000 : 500000;
                }
            }
        });
        return total;
    };
    const currentMRR = calculateMRR();

    // 2. Growth Chart (Last 30 Days)
    const generateGrowthData = () => {
        const labels: string[] = [];
        const data: number[] = [];

        // Setup 30 day range
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));

            // Count tenants created on this date
            const count = tenants.filter(t => {
                if (!t.createdAt) return false;
                const created = new Date(t.createdAt);
                return created.getDate() === date.getDate() &&
                    created.getMonth() === date.getMonth() &&
                    created.getFullYear() === date.getFullYear();
            }).length;

            // Convert to cumulative or just daily. Let's do Cumulative.
            const prevTotal = data.length > 0 ? data[data.length - 1] : 0;
            data.push(prevTotal + count);
        }

        return { labels, data };
    };

    const growthData = generateGrowthData();
    const chartData = {
        labels: growthData.labels,
        datasets: [
            {
                label: 'Total Pertumbuhan Masjid',
                data: growthData.data,
                borderColor: '#10b981', // emerald-500
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#ffffff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#10b981',
            }
        ]
    };
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
            tooltip: { mode: 'index' as const, intersect: false, backgroundColor: '#1e293b', titleColor: '#fff', bodyColor: '#fff', borderColor: '#334155', borderWidth: 1 }
        },
        scales: {
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1, precision: 0 } },
            x: { grid: { display: false } }
        },
        interaction: { mode: 'nearest' as const, axis: 'x' as const, intersect: false }
    };

    // 3. Top Affiliates
    const getTopAffiliates = () => {
        const affiliateStats = affiliates.map(aff => {
            const myCommissions = commissions.filter(c => c.affiliate_id === aff.id && c.status !== 'REJECTED');
            return {
                ...aff,
                referralCount: myCommissions.length,
                totalEarnings: myCommissions.reduce((sum, c) => sum + c.amount, 0)
            };
        });
        // Sort by earnings then count
        return affiliateStats.sort((a, b) => b.totalEarnings - a.totalEarnings).slice(0, 5);
    };
    const topAffiliates = getTopAffiliates();


    if (isLoading) {
        return <div className="p-8 text-center text-slate-400 animate-pulse font-bold">Memuat Dasbor Eksekutif...</div>;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white ringkasan">
                        Executive Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Rangkuman performa sistem MASJIDKITA hari ini.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => downloadDatabaseExport(`masjidkita-backup-${new Date().toISOString().split('T')[0]}.json`)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors text-sm border border-slate-200 dark:border-slate-700"
                    >
                        <DownloadCloud size={18} className="text-blue-500" />
                        Unduh JSON Backup
                    </button>
                    <button
                        onClick={handleForceReset}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl font-bold transition-colors text-sm border border-amber-200 dark:border-amber-800"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                        Force Update Seeding
                    </button>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                                <TrendingUp size={28} />
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest rounded-full">Bulanan</span>
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Total Monthly Recurring Revenue (MRR)</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrencyRp(currentMRR)}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                                <Globe size={28} />
                            </div>
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest rounded-full">Kumulatif</span>
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Total Mitra Masjid Aktif</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{tenants.length}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                                <Wallet size={28} />
                            </div>
                            <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-widest rounded-full">Mitra</span>
                        </div>
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Total Partner Afiliasi Aktif</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{affiliates.filter(a => a.status === 'ACTIVE').length}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <TrendingUp className="text-emerald-500" /> Pertumbuhan Tenant (30 Hari)
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Akumulasi masjid yang bergabung menggunakan platform MASJIDKITA</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Top Affiliates */}
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Award className="text-amber-500" /> Top Afiliator
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Partner dengan revenue tertinggi</p>
                        </div>
                    </div>

                    <div className="flex-grow space-y-4">
                        {topAffiliates.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                                Belum ada data referral tercatat.
                            </div>
                        ) : (
                            topAffiliates.map((aff, i) => (
                                <div key={aff.id} className="group p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-4">
                                    <div className="w-10 h-10 shrink-0 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center font-black text-amber-500 shadow-sm border border-slate-100 dark:border-slate-600">
                                        #{i + 1}
                                    </div>
                                    <div className="flex-grow overflow-hidden">
                                        <div className="font-bold text-slate-700 dark:text-slate-300 truncate">{aff.name || aff.referral_code}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{aff.referralCount} Tenant Terdaftar</div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrencyRp(aff.totalEarnings)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Platform Audit Logs Section */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl mt-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Activity className="text-blue-500" /> Platform Audit Trail
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">Catatan aktivitas dan perubahan sistem oleh admin SaaS.</p>
                    </div>
                </div>

                <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-3 space-y-6">
                    {auditLogs.length === 0 ? (
                        <div className="ml-6 text-sm text-slate-400 font-medium">Belum ada catatan aktivitas sistem.</div>
                    ) : (
                        auditLogs.map(log => (
                            <div key={log.id} className="relative pl-6">
                                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-slate-900 z-10 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-col md:flex-row gap-2 md:gap-4 md:items-center justify-between w-full max-w-4xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700/50">
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{log.adminName}</span>
                                            <span className="text-xs text-slate-400 font-medium">dieksekusi</span>
                                            <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-600">
                                                {log.action}
                                            </span>
                                        </div>
                                        {log.details && (
                                            <div className="text-sm text-slate-500 dark:text-slate-400 italic">"{log.details}"</div>
                                        )}
                                    </div>
                                    <div className="shrink-0 text-xs font-bold text-slate-400 text-right">
                                        {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};
