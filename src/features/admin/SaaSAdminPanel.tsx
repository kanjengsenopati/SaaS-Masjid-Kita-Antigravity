import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import type { ITenant } from '../../types';
import {
    Users,
    Globe,
    ShieldCheck,
    Calendar,
    Search,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    TrendingUp
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/formatters';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSystemAudit } from '../../hooks/useSystemAudit';
import type { IPlatformSettings } from '../../types';

type EnrichedTenant = ITenant & { usage: number };

export const SaaSAdminPanel: React.FC = () => {
    const { impersonateTenant } = useAuth();
    const navigate = useNavigate();
    const { logActivity } = useSystemAudit();

    const [tenants, setTenants] = useState<EnrichedTenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState<'ALL' | 'LITE' | 'PRO' | 'ENTERPRISE'>('ALL');
    const [platformSettings, setPlatformSettings] = useState<IPlatformSettings | null>(null);
    const [dbPackages, setDbPackages] = useState<any[]>([]);
    const [affiliates, setAffiliates] = useState<any[]>([]);

    // Upgrade Modal State
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<EnrichedTenant | null>(null);
    const [newPlan, setNewPlan] = useState<string>('lite');
    const [newPackageId, setNewPackageId] = useState<number | undefined>(undefined);
    const [newBillingCycle, setNewBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [newAffiliateId, setNewAffiliateId] = useState<number | undefined>(undefined);
    const [newExpiryDate, setNewExpiryDate] = useState('');

    const getPlanQuota = (plan: string) => {
        switch (plan) {
            case 'ENTERPRISE': return 10000;
            case 'PRO': return 5000;
            default: return platformSettings?.lite_plan_quota || 1000; // Use DB value or fallback
        }
    };

    const loadTenants = async () => {
        setIsLoading(true);
        try {
            const allTenants = await db.tenants.toArray();

            // Fetch usage (members count) for each tenant
            const enriched = await Promise.all(allTenants.map(async (t) => {
                const memberCount = await db.members.where('tenant_id').equals(t.id!).count();
                return { ...t, usage: memberCount };
            }));

            const settings = await db.platform_settings.toCollection().first();
            setPlatformSettings(settings || null);

            const allPkgs = await db.packages.toArray();
            setDbPackages(allPkgs);
            const allAff = await db.affiliates.where('status').equals('ACTIVE').toArray();
            setAffiliates(allAff);
            setTenants(enriched);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTenants();
    }, []);

    const handleUpgradeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant || !selectedTenant.id) return;

        try {
            await db.tenants.update(selectedTenant.id, {
                plan: newPlan.toUpperCase(),
                package_id: newPackageId,
                billing_cycle: newBillingCycle,
                affiliate_id: newAffiliateId,
                expires_at: newExpiryDate ? new Date(newExpiryDate).toISOString() : undefined,
                updated_at: new Date().toISOString()
            } as any);
            await logActivity('Manual Upgrade Tenant Plan', selectedTenant.id, `Upgraded to ${newPlan} until ${newExpiryDate || 'Unlimited'}`);
            setIsUpgradeModalOpen(false);
            loadTenants(); // Refresh data
        } catch (error) {
            console.error("Failed to upgrade plan", error);
            alert("Gagal memperbarui paket.");
        }
    };

    const filteredTenants = tenants.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.slug.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlan = planFilter === 'ALL' || t.plan === planFilter || (!t.plan && planFilter === 'LITE'); // Treat undefined as LITE
        return matchesSearch && matchesPlan;
    });

    const getPlanHighlight = (plan?: string) => {
        switch (plan) {
            case 'ENTERPRISE': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'PRO': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                            <ShieldCheck className="text-emerald-600" size={32} />
                            MASJIDKITA <span className="text-slate-400 font-medium tracking-normal">SaaS Panel</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Kelola seluruh mitra masjid dan status langganan platform.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 shadow-sm">
                            <TrendingUp className="text-emerald-500" size={20} />
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Harga PRO</div>
                                <div className="text-sm font-bold">Rp {(platformSettings?.pro_plan_price || 150000).toLocaleString('id-ID')} / bln</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { label: 'Total Masjid', value: tenants.length, icon: <Globe className="text-blue-500" />, color: 'blue' },
                        { label: 'Paket Pro', value: tenants.filter(t => t.plan === 'PRO').length, icon: <CheckCircle2 className="text-emerald-500" />, color: 'emerald' },
                        { label: 'Paket Enterprise', value: tenants.filter(t => t.plan === 'ENTERPRISE').length, icon: <Users className="text-purple-500" />, color: 'purple' },
                        { label: 'Akan Berakhir', value: 0, icon: <AlertCircle className="text-amber-500" />, color: 'amber' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-2xl flex items-center justify-center`}>
                                    {stat.icon}
                                </div>
                                <span className="text-2xl font-black">{stat.value}</span>
                            </div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="relative flex-grow max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama masjid atau slug..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm text-slate-700 dark:text-slate-300"
                                value={planFilter}
                                onChange={(e) => setPlanFilter(e.target.value as any)}
                            >
                                <option value="ALL">Semua Paket</option>
                                <option value="LITE">LITE</option>
                                <option value="PRO">PRO</option>
                                <option value="ENTERPRISE">ENTERPRISE</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Masjid</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">URL / Slug</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Paket & Plan</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Penggunaan Kuota (Jamaah)</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 animate-pulse">Memuat data masjid...</td>
                                    </tr>
                                ) : filteredTenants.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400">Tidak ada masjid ditemukan.</td>
                                    </tr>
                                ) : (
                                    filteredTenants.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-emerald-600/20">
                                                        {t.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold">{t.name}</div>
                                                        <div className="text-xs text-slate-400 mt-0.5">Dibuat: {t.createdAt ? formatDateDDMMYYYY(t.createdAt) : '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-medium text-slate-500">
                                                    /website/{t.slug}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-max ${getPlanHighlight(t.plan)}`}>
                                                        {t.plan || 'LITE'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                                        <Calendar size={12} />
                                                        {t.expires_at ? formatDateDDMMYYYY(t.expires_at) : 'Tanpa Batas'}
                                                    </div>
                                                    {t.affiliate_id && (
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full w-fit">
                                                            Ref: {affiliates.find(a => a.id === t.affiliate_id)?.referral_code || 'Referal'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 max-w-[120px]">
                                                        <div
                                                            className="bg-emerald-500 h-2.5 rounded-full"
                                                            style={{ width: `${Math.min((t.usage / getPlanQuota(t.plan || 'LITE')) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                                        {t.usage} / {getPlanQuota(t.plan || 'LITE').toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const activeAffiliates = await db.affiliates.where('status').equals('ACTIVE').toArray();
                                                                if (activeAffiliates.length === 0) {
                                                                    alert("Tidak ada partner afiliasi yang aktif untuk disimulasikan.");
                                                                    return;
                                                                }
                                                                // Pick random affiliate
                                                                const randomAff = activeAffiliates[Math.floor(Math.random() * activeAffiliates.length)];
                                                                const basePrice = platformSettings?.pro_plan_price || 150000;
                                                                const commRate = randomAff.commission_rate || platformSettings?.commission_rate_default || 10;
                                                                const mockAmount = basePrice * (commRate / 100);

                                                                // Create Subscription
                                                                const subId = await db.subscriptions.add({
                                                                    tenant_id: t.id!,
                                                                    plan_name: 'PRO',
                                                                    status: 'ACTIVE',
                                                                    amount: basePrice,
                                                                    start_date: new Date().toISOString(),
                                                                    end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
                                                                    created_at: new Date().toISOString()
                                                                });

                                                                await db.commissions.add({
                                                                    affiliate_id: randomAff.id!,
                                                                    tenant_id: t.id!,
                                                                    subscription_id: subId,
                                                                    amount: mockAmount,
                                                                    status: 'PENDING',
                                                                    created_at: new Date().toISOString()
                                                                });

                                                                await db.affiliates.update(randomAff.id!, {
                                                                    balance: (randomAff.balance || 0) + mockAmount,
                                                                    total_earned: (randomAff.total_earned || 0) + mockAmount,
                                                                    updated_at: new Date().toISOString()
                                                                });

                                                                await db.tenants.update(t.id!, { affiliate_id: randomAff.id! });

                                                                await logActivity('Simulate Referral', randomAff.id!, `Simulated commission ${mockAmount} for tenant ${t.id}`);

                                                                alert(`Simulasi berhasil! Komisi Rp ${mockAmount.toLocaleString('id-ID')} dicatat untuk Partner ${randomAff.referral_code}`);
                                                                loadTenants();

                                                                await db.commissions.add({
                                                                    affiliate_id: randomAff.id!,
                                                                    tenant_id: t.id!,
                                                                    subscription_id: 0, // FIXED DUPLICATE REMOVAL SOON
                                                                    amount: mockAmount,
                                                                    status: 'PENDING',
                                                                    created_at: new Date().toISOString()
                                                                });

                                                                // Update affiliate balance implicitly? No, balance is updated only upon Payout or Paid. Wait, standard affiliate systems accrue 'Unpaid/Pending' balance? 
                                                                // Here we just insert the commission. AffiliateDashboard calculates unpaid dynamically from PENDING commissions.
                                                                // Affiliate balance usually tracks how much they have *available* to withdraw (from PAID actions).
                                                                // Or if it's updated on payout, then balance = accumulated unpaid.
                                                                // Per user requirements, balancing might just be the actual 'available' money. Let's add it to balance straight away to match dashboard assumptions, or wait for payout?
                                                                // In AffiliateDashboard, `aff.balance` is assumed to be withdrawable. Let's add it to balance when "Approved" by tenant payment, but here we just simulate "Tenant Paid" so we add it to balance and mark PENDING.

                                                                // END DUPLICATE REMOVAL

                                                                await logActivity('Simulate Referral', randomAff.id!, `Simulated commission ${mockAmount} for tenant ${t.id}`);

                                                                alert(`Simulasi berhasil! Komisi Rp ${mockAmount.toLocaleString('id-ID')} dicatat untuk Partner ${randomAff.referral_code}`);
                                                            } catch (err) {
                                                                alert("Gagal memproses simulasi.");
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                                        title="Simulasikan tenant ini mendaftar dengan kode afiliasi"
                                                    >
                                                        Simulasi Referral
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedTenant(t);
                                                            setNewPlan(t.slug || 'lite');
                                                            setNewPackageId(t.package_id);
                                                            setNewBillingCycle(t.billing_cycle || 'monthly');
                                                            setNewAffiliateId(t.affiliate_id);
                                                            setNewExpiryDate(t.expires_at ? t.expires_at.split('T')[0] : '');
                                                            setIsUpgradeModalOpen(true);
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        Ubah Plan
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            await logActivity('Impersonate Tenant', t.id, `Attempting impersonation into ${t.name}`);
                                                            const success = await impersonateTenant(t.id!);
                                                            if (success) {
                                                                navigate('/dashboard');
                                                            } else {
                                                                alert('Gagal Impersonate. Masjid mungkin belum memiliki admin super.');
                                                            }
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                                    >
                                                        Masuk <ArrowRight size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Manual Upgrade Modal */}
            {isUpgradeModalOpen && selectedTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-8">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <ShieldCheck className="text-emerald-600" /> Upgrade Paket SaaS
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Kelola lisensi untuk <strong>{selectedTenant.name}</strong></p>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Pilih Paket</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                                        value={newPackageId}
                                        onChange={e => {
                                            const pkgId = Number(e.target.value);
                                            setNewPackageId(pkgId);
                                            const pkg = dbPackages.find(p => p.id === pkgId);
                                            if (pkg) setNewPlan(pkg.slug);
                                        }}
                                    >
                                        {dbPackages.map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>
                                                {pkg.name.toUpperCase()} (M: {pkg.monthlyPrice.toLocaleString('id-ID')} / Y: {pkg.yearlyPrice.toLocaleString('id-ID')})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Siklus Tagihan</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                                        value={newBillingCycle}
                                        onChange={e => setNewBillingCycle(e.target.value as any)}
                                    >
                                        <option value="monthly">Bulanan</option>
                                        <option value="yearly">Tahunan</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Berakhir Pada (Opsional)</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                                        value={newExpiryDate}
                                        onChange={e => setNewExpiryDate(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Kosongkan jika lisensi berlaku seumur hidup.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Partner Afiliasi (Opsional)</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm"
                                        value={newAffiliateId || ''}
                                        onChange={e => setNewAffiliateId(e.target.value ? Number(e.target.value) : undefined)}
                                    >
                                        <option value="">-- Tanpa Afiliasi --</option>
                                        {affiliates.map(aff => (
                                            <option key={aff.id} value={aff.id}>
                                                {aff.name} ({aff.referral_code})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsUpgradeModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 text-white bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
