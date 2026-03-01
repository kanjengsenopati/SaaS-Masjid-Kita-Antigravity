import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import { useTenant } from '../tenants/TenantContext';
import { useAuth } from '../auth/AuthContext';
import {
    CreditCard,
    ShieldCheck,
    ShieldAlert,
    Clock,
    Package,
    History,
    Share2,
    CheckCircle2,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import { formatCurrencyRp, formatDateDDMMYYYY } from '../../utils/formatters';
import type { IPackage, ISubscription, IAffiliate } from '../../types';

export const SubscriptionModule: React.FC = () => {
    const { tenant } = useTenant();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'history' | 'affiliate'>('overview');
    const [packages, setPackages] = useState<IPackage[]>([]);
    const [subscriptions, setSubscriptions] = useState<ISubscription[]>([]);
    const [affiliate, setAffiliate] = useState<IAffiliate | null>(null);
    const [currentPackage, setCurrentPackage] = useState<IPackage | null>(null);
    const [allModules, setAllModules] = useState<Record<number, string[]>>({}); // package_id -> module names
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (!tenant) return;
            setLoading(true);
            try {
                // Load all packages
                const allPackages = await db.packages.where('is_active').equals(1).toArray();
                setPackages(allPackages);

                // Load all package modules for comparison
                const allPkgModules = await db.package_modules.toArray();
                const modulesMetadata = await db.modules.toArray();

                const moduleMap: Record<number, string[]> = {};
                allPkgModules.forEach(pm => {
                    const mod = modulesMetadata.find(m => m.id === pm.module_id);
                    if (mod) {
                        if (!moduleMap[pm.package_id]) moduleMap[pm.package_id] = [];
                        moduleMap[pm.package_id].push(mod.name);
                    }
                });
                setAllModules(moduleMap);

                // Load current package details
                if (tenant.package_id) {
                    const pkg = await db.packages.get(tenant.package_id);
                    if (pkg) setCurrentPackage(pkg);
                }

                // Load subscription history
                const history = await db.subscriptions
                    .where('tenant_id')
                    .equals(tenant.id!)
                    .reverse()
                    .sortBy('created_at');
                setSubscriptions(history);

                // Load affiliate data if available
                if (tenant.affiliate_id) {
                    const aff = await db.affiliates.get(tenant.affiliate_id);
                    if (aff) setAffiliate(aff);
                } else {
                    // Search for affiliate by email if not linked in tenant
                    const aff = await db.affiliates.where('email').equals(user?.email || '').first();
                    if (aff) setAffiliate(aff);
                }
            } catch (err) {
                console.error("Failed to load subscription data", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [tenant, user]);

    if (!tenant) return null;

    const isExpired = tenant.expires_at ? new Date(tenant.expires_at) < new Date() : false;
    const isBlocked = tenant.is_blocked;

    const tabs = [
        { id: 'overview', name: 'Ringkasan', icon: Clock },
        { id: 'plans', name: 'Paket & Harga', icon: Package },
        { id: 'history', name: 'Riwayat Pembayaran', icon: History },
        { id: 'affiliate', name: 'Program Affiliate', icon: Share2 },
    ];

    const getStatusBadge = () => {
        if (isBlocked) {
            return (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-bold animate-pulse">
                    <ShieldAlert size={16} /> AKUN TERBLOKIR
                </div>
            );
        }
        if (isExpired) {
            return (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                    <AlertCircle size={16} /> MASA AKTIF HABIS
                </div>
            );
        }
        return (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                <ShieldCheck size={16} /> AKTIF
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <CreditCard size={180} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight mb-2">Manajemen Berlangganan</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Kelola paket, perpanjang layanan, dan pantau status akun Anda.</p>
                    </div>
                    {getStatusBadge()}
                </div>

                <div className="mt-12 flex flex-wrap gap-2 p-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-2xl w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white dark:bg-gray-800 shadow-md text-emerald-600'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Section */}
            {loading ? (
                <div className="h-64 flex items-center justify-center text-emerald-600 animate-pulse font-bold">
                    Memuat data...
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-xl font-black mb-8">Paket Saat Ini</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Nama Paket</p>
                                        <p className="text-2xl font-black text-emerald-600">{currentPackage?.name || tenant.plan || 'BELUM ADA'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Masa Berlaku</p>
                                        <p className="text-xl font-bold">
                                            {tenant.expires_at ? formatDateDDMMYYYY(tenant.expires_at) : 'Selamanya'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Siklus Tagihan</p>
                                        <p className="text-xl font-bold capitalize">{tenant.billing_cycle || 'Bulanan'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Harga Terakhir</p>
                                        <p className="text-xl font-bold">
                                            {currentPackage
                                                ? formatCurrencyRp(tenant.billing_cycle === 'yearly' ? currentPackage.yearlyPrice : currentPackage.monthlyPrice)
                                                : '-'}
                                        </p>
                                    </div>
                                </div>

                                {isExpired && (
                                    <div className="mt-12 p-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-2xl flex items-center gap-4">
                                        <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-full text-orange-600 dark:text-orange-400">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-orange-800 dark:text-orange-300">Layanan Anda Telah Berakhir</p>
                                            <p className="text-sm text-orange-700 dark:text-orange-400">Segera perpanjang untuk tetap mengakses fitur-fitur premium.</p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('plans')}
                                            className="ml-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors"
                                        >
                                            Perpanjang
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-emerald-600 dark:bg-emerald-700 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between">
                                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                    <ShieldCheck size={120} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black mb-2 tracking-tight">Status Keanggotaan</h3>
                                    <p className="text-emerald-100 text-sm font-medium leading-relaxed">
                                        Terima kasih telah bersama kami. Akun Anda didukung oleh paket profesional.
                                    </p>
                                </div>
                                <div className="mt-8">
                                    <p className="text-[10px] font-black uppercase text-emerald-200 tracking-widest mb-2">Fitur Unggulan Aktif:</p>
                                    <div className="space-y-2">
                                        {(allModules[tenant.package_id!] || ['Laporan Keuangan', 'Database Jamaah', 'Custom Website']).slice(0, 3).map(f => (
                                            <div key={f} className="flex items-center gap-2 text-sm font-bold">
                                                <CheckCircle2 size={16} className="text-emerald-300" />
                                                {f}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'plans' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
                            {packages.map(pkg => (
                                <div
                                    key={pkg.id}
                                    className={`bg-white dark:bg-gray-800 rounded-[2.5rem] p-4 border-2 transition-all hover:scale-[1.02] cursor-default flex flex-col ${tenant.package_id === pkg.id
                                        ? 'border-emerald-500 shadow-xl shadow-emerald-500/10'
                                        : 'border-transparent shadow-sm'
                                        }`}
                                >
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-[2rem] p-8 flex-1">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h4 className="text-2xl font-black tracking-tight">{pkg.name}</h4>
                                                {pkg.is_popular && (
                                                    <span className="inline-block mt-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                                                        Populer
                                                    </span>
                                                )}
                                            </div>
                                            {tenant.package_id === pkg.id && (
                                                <div className="p-2 bg-emerald-500 text-white rounded-full">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-gray-400 text-[10px] font-black uppercase">Bulanan:</span>
                                                    <span className="text-xl font-black tracking-tighter ml-auto text-emerald-600">
                                                        {pkg.monthlyPrice > 0 ? formatCurrencyRp(pkg.monthlyPrice) : 'Gratis'}
                                                    </span>
                                                </div>
                                                <div className="flex items-baseline gap-1 pt-2 border-t border-gray-50 dark:border-gray-700 mt-2">
                                                    <span className="text-gray-400 text-[10px] font-black uppercase">Tahunan:</span>
                                                    <span className="text-2xl font-black tracking-tighter ml-auto text-emerald-600">
                                                        {pkg.yearlyPrice > 0 ? formatCurrencyRp(pkg.yearlyPrice) : 'Gratis'}
                                                    </span>
                                                </div>
                                                {pkg.monthlyPrice > 0 && pkg.yearlyPrice > 0 && (
                                                    <p className="text-[10px] font-black text-red-500 text-right mt-1">
                                                        Hemat {Math.round((1 - (pkg.yearlyPrice / (pkg.monthlyPrice * 12))) * 100)}%
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-8 min-h-[60px]">
                                            {pkg.description}
                                        </p>

                                        <div className="space-y-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Fitur Termasuk:</p>
                                            {(allModules[pkg.id!] || ['Manajemen Keuangan', 'Database Jamaah', 'Signage Digital']).map(f => (
                                                <div key={f} className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300">
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                    {f}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        disabled={tenant.package_id === pkg.id}
                                        className={`w-full mt-4 py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-widest transition-all ${tenant.package_id === pkg.id
                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                                            }`}
                                    >
                                        {tenant.package_id === pkg.id ? 'Paket Aktif' : `Pilih ${pkg.name}`}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                            <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-xl font-black">Riwayat Pembayaran</h3>
                                <button className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 px-4 py-2 border-2 border-emerald-600 rounded-xl transition-all">
                                    <ExternalLink size={16} /> Hubungi Support
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900/50">
                                            <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">Tanggal</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">Paket</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">Jumlah</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">Status</th>
                                            <th className="px-8 py-4 text-left text-[10px] font-black uppercase text-gray-400 tracking-widest whitespace-nowrap">Bukti</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {subscriptions.length > 0 ? subscriptions.map((sub, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                                <td className="px-8 py-5 text-sm font-bold whitespace-nowrap">{formatDateDDMMYYYY(sub.created_at || '')}</td>
                                                <td className="px-8 py-5 text-sm font-black whitespace-nowrap">{sub.plan_name}</td>
                                                <td className="px-8 py-5 text-sm font-black text-emerald-600 whitespace-nowrap">{formatCurrencyRp(sub.amount)}</td>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                                        sub.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {sub.status === 'ACTIVE' ? 'Selesai' : sub.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-sm text-gray-500 whitespace-nowrap">
                                                    {sub.payment_proof ? (
                                                        <a href={sub.payment_proof} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                            <ExternalLink size={14} /> Lihat Bukti
                                                        </a>
                                                    ) : '-'}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold italic">Belum ada riwayat pembayaran.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'affiliate' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-xl font-black mb-6">Link Affiliate Anda</h3>
                                <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">
                                    Bagikan link ini ke pengurus masjid lain. Dapatkan komisi setiap ada masjid yang berlangganan melalui referensi Anda.
                                </p>
                                {affiliate ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 relative group cursor-pointer"
                                            onClick={() => {
                                                const url = `${window.location.origin}/?ref=${affiliate.referral_code}`;
                                                navigator.clipboard.writeText(url);
                                                alert("Link disalin!");
                                            }}
                                        >
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Salin Link Referensi</p>
                                            <p className="text-lg font-black text-emerald-600 truncate pr-8">
                                                {window.location.origin}/?ref={affiliate.referral_code}
                                            </p>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-600 transition-colors">
                                                <ExternalLink size={20} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-6">
                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl">
                                                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mb-1">Total Komisi</p>
                                                <p className="text-xl font-black">{formatCurrencyRp(affiliate.balance || 0)}</p>
                                            </div>
                                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                                                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Status Partner</p>
                                                <p className="text-xl font-black italic">{affiliate.status}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                            <AlertCircle size={32} />
                                        </div>
                                        <p className="font-bold text-gray-700 dark:text-gray-300 mb-2">Anda Belum Terdaftar Jadi Partner</p>
                                        <p className="text-sm text-gray-500 mb-6 px-8">Hubungi admin atau daftar diprogram affiliate di halaman depan untuk mulai mendapatkan komisi.</p>
                                        <a href="/" target="_blank" className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-black rounded-xl text-sm uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all">
                                            Daftar Sekarang
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between">
                                <div className="absolute -bottom-10 -right-10 p-12 opacity-10 pointer-events-none rotate-12">
                                    <ShieldCheck size={240} />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black mb-4 tracking-tight">Kenapa Menjadi Partner?</h3>
                                    <div className="space-y-6 mt-8">
                                        {[
                                            { title: 'Komisi Menarik', desc: 'Dapatkan bagi hasil menarik dari setiap transaksi.', color: 'text-emerald-400' },
                                            { title: 'Bantu Sesama Masjid', desc: 'Membantu masjid lain mengelola keuangan lebih baik.', color: 'text-blue-400' },
                                            { title: 'Pencairan Mudah', desc: 'Tarik komisi kapan pun Anda inginkan.', color: 'text-orange-400' }
                                        ].map(item => (
                                            <div key={item.title}>
                                                <p className={`font-black tracking-tight ${item.color}`}>{item.title}</p>
                                                <p className="text-slate-400 text-sm font-medium">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-12 relative z-10">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Tingkat Komisi Anda:</p>
                                    <p className="text-3xl font-black tracking-tighter">{affiliate?.commission_rate || 10}% <span className="text-sm font-bold text-slate-500">Per Referensi</span></p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
