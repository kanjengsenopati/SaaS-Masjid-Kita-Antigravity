import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import type { IAffiliate, ICommission, IAffiliateWithdrawal, IPlatformSettings } from '../../types';
import { useSystemAudit } from '../../hooks/useSystemAudit';
import {
    Users,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Search,
    Wallet,
    History,
    Check,
    X,
    Banknote,
    ExternalLink,
    Filter
} from 'lucide-react';
import { formatCurrencyRp } from '../../utils/formatters';

export const AffiliateDashboard: React.FC = () => {
    const { logActivity } = useSystemAudit();

    const [activeTab, setActiveTab] = useState<'PARTNERS' | 'WITHDRAWALS' | 'COMMISSIONS' | 'SETTINGS'>('PARTNERS');
    const [affiliates, setAffiliates] = useState<IAffiliate[]>([]);
    const [commissions, setCommissions] = useState<ICommission[]>([]);
    const [withdrawals, setWithdrawals] = useState<IAffiliateWithdrawal[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED'>('ALL');
    const [platformSettings, setPlatformSettings] = useState<IPlatformSettings | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const loadData = async () => {
        try {
            const [allAff, allComm, allWith, settings] = await Promise.all([
                db.affiliates.toArray(),
                db.commissions.toArray(),
                db.affiliate_withdrawals.toArray(),
                db.platform_settings.toCollection().first()
            ]);
            setAffiliates(allAff);
            setCommissions(allComm);
            setWithdrawals(allWith);
            setPlatformSettings(settings || null);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const showMessage = (msg: string, type: 'error' | 'success') => {
        if (type === 'error') setError(msg);
        else setSuccess(msg);
        setTimeout(() => {
            setError(null);
            setSuccess(null);
        }, 3000);
    };

    // Stats
    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
    const totalPaidCommissions = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.amount, 0);
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING').reduce((sum, w) => sum + w.amount, 0);

    const handleApproveAffiliate = async (id: number) => {
        try {
            await db.affiliates.update(id, {
                status: 'ACTIVE',
                updated_at: new Date().toISOString()
            });
            await logActivity('Approve Affiliate', id, `Approved affiliate partnership for ID ${id}`);
            showMessage('Partner berhasil di-approve!', 'success');
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Gagal approve partner.', 'error');
        }
    };

    const handleProcessWithdrawal = async (withdrawal: IAffiliateWithdrawal, status: 'APPROVED' | 'REJECTED') => {
        try {
            const aff = await db.affiliates.get(withdrawal.affiliate_id);
            if (!aff) throw new Error("Partner tidak ditemukan.");

            if (status === 'APPROVED') {
                if (aff.balance < withdrawal.amount) throw new Error("Saldo partner tidak mencukupi.");

                await db.affiliates.update(withdrawal.affiliate_id, {
                    balance: aff.balance - withdrawal.amount,
                    total_withdrawn: (aff.total_withdrawn || 0) + withdrawal.amount,
                    updated_at: new Date().toISOString()
                });
            }

            await db.affiliate_withdrawals.update(withdrawal.id!, {
                status,
                processed_at: new Date().toISOString()
            });

            await logActivity(`${status} Withdrawal`, withdrawal.id!, `${status} withdrawal request of ${withdrawal.amount} for affiliate ${withdrawal.affiliate_id}`);
            showMessage(`Penarikan ${status === 'APPROVED' ? 'disetujui' : 'ditolak'}.`, 'success');
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Gagal memproses penarikan.', 'error');
        }
    };

    const filteredAffiliates = affiliates.filter(a => {
        const matchesSearch = a.referral_code.toLowerCase().includes(searchTerm.toLowerCase()) || a.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                            <TrendingUp className="text-emerald-600" size={32} />
                            Affiliate Center
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manajemen mitra, komisi transaksi, dan antrean penarikan dana.</p>
                    </div>
                </div>

                {/* Notifications */}
                {success && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <CheckCircle2 size={20} /> <span className="font-bold">{success}</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3 animate-shake">
                        <AlertCircle size={20} /> <span className="font-bold">{error}</span>
                    </div>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center shrink-0 text-emerald-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Komisi Terbit</div>
                            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{formatCurrencyRp(totalCommissions)}</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0 text-blue-600">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Komisi Dibayar</div>
                            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{formatCurrencyRp(totalPaidCommissions)}</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md border-amber-200 dark:border-amber-900/30 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center shrink-0 text-amber-600">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Antrean Penarikan</div>
                            <div className="text-xl font-black text-amber-600 mt-0.5">{formatCurrencyRp(pendingWithdrawals)}</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center shrink-0 text-purple-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Mitra Aktif</div>
                            <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{affiliates.filter(a => a.status === 'ACTIVE').length} Partner</div>
                        </div>
                    </div>
                </div>

                {/* Tabs & Content */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800/50 m-4 rounded-2xl w-fit">
                        <button
                            onClick={() => setActiveTab('PARTNERS')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'PARTNERS' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            <Users size={16} className="inline mr-2" /> Daftar Partner
                        </button>
                        <button
                            onClick={() => setActiveTab('WITHDRAWALS')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'WITHDRAWALS' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            <Banknote size={16} className="inline mr-2" /> Antrean WD {withdrawals.filter(w => w.status === 'PENDING').length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{withdrawals.filter(w => w.status === 'PENDING').length}</span>}
                        </button>
                        <button
                            onClick={() => setActiveTab('COMMISSIONS')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'COMMISSIONS' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            <History size={16} className="inline mr-2" /> Riwayat Komisi
                        </button>
                        <button
                            onClick={() => setActiveTab('SETTINGS')}
                            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'SETTINGS' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                        >
                            <TrendingUp size={16} className="inline mr-2" /> Pengaturan Komisi
                        </button>
                    </div>

                    {activeTab === 'PARTNERS' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="relative flex-grow max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Cari partner (Nama / Kode Referal)..."
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <Filter size={18} className="text-slate-400" />
                                    <select
                                        className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm text-slate-700 dark:text-slate-300"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                    >
                                        <option value="ALL">Semua Status</option>
                                        <option value="PENDING">Menunggu Persetujuan</option>
                                        <option value="ACTIVE">Aktif</option>
                                        <option value="SUSPENDED">Ditangguhkan</option>
                                    </select>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Partner & Kode</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Kontak</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Statistik Komisi</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Saldo</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredAffiliates.map((aff) => {
                                            const affCommissions = commissions.filter(c => c.affiliate_id === aff.id);
                                            return (
                                                <tr key={aff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                                                                {aff.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{aff.name}</div>
                                                                <div className="font-mono text-[10px] font-black p-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded w-fit mt-1">{aff.referral_code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm">
                                                        <div className="text-slate-700 dark:text-slate-300 font-medium">{aff.email}</div>
                                                        <div className="text-slate-400 font-bold">{aff.phone_number || '-'}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{affCommissions.length} Referal</div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">Rate: {aff.commission_rate || platformSettings?.commission_rate_default || 10}%</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-emerald-600 dark:text-emerald-400 font-black">{formatCurrencyRp(aff.balance)}</div>
                                                        <div className="text-[10px] text-slate-400 mt-0.5">Total Earned: {formatCurrencyRp(aff.total_earned || 0)}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${aff.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                            aff.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {aff.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        {aff.status === 'PENDING' && (
                                                            <button
                                                                onClick={() => handleApproveAffiliate(aff.id!)}
                                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                                            >
                                                                Approve Partner
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredAffiliates.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold italic">Tidak ada partner ditemukan dalam kriteria.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'WITHDRAWALS' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Partner</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Jumlah Penarikan</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Tujuan Bank</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Tanggal Pengajuan</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {withdrawals.filter(w => w.status === 'PENDING').map((wd) => {
                                            const aff = affiliates.find(a => a.id === wd.affiliate_id);
                                            return (
                                                <tr key={wd.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{aff?.name || 'Unknown'}</div>
                                                        <div className="text-[10px] font-black text-slate-400">Bal: {formatCurrencyRp(aff?.balance || 0)}</div>
                                                    </td>
                                                    <td className="px-8 py-6 font-black text-amber-600">{formatCurrencyRp(wd.amount)}</td>
                                                    <td className="px-8 py-6 text-sm font-medium text-slate-600 dark:text-slate-400">{wd.bank_info}</td>
                                                    <td className="px-8 py-6 text-xs text-slate-400">
                                                        {new Date(wd.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleProcessWithdrawal(wd, 'REJECTED')}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                            >
                                                                <X size={20} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleProcessWithdrawal(wd, 'APPROVED')}
                                                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                                            >
                                                                <Check size={16} /> Lakukan Transfer
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {withdrawals.filter(w => w.status === 'PENDING').length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">Belum ada antrean penarikan dana baru.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'COMMISSIONS' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Referal Tenant</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Affiliate</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Komisi</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800 text-right">Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {commissions.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()).map((c) => {
                                            const aff = affiliates.find(a => a.id === c.affiliate_id);
                                            return (
                                                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Tenant #{c.tenant_id}</div>
                                                        <div className="text-[10px] text-slate-400">Sub ID: {c.subscription_id}</div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{aff?.name || 'Partner'}</div>
                                                        <div className="text-[10px] font-mono text-indigo-500 font-black">{aff?.referral_code}</div>
                                                    </td>
                                                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white">{formatCurrencyRp(c.amount)}</td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${c.status === 'PAID' ? 'bg-emerald-500 text-white' :
                                                            c.status === 'REJECTED' ? 'bg-red-500 text-white' :
                                                                'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button className="text-slate-400 hover:text-indigo-500 transition-colors"><ExternalLink size={14} /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {commissions.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">Belum ada riwayat komisi terekam.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'SETTINGS' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
                            <div className="max-w-2xl space-y-8">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Pengaturan Global Afiliasi</h3>
                                    <p className="text-slate-500 text-sm font-medium mt-1">Konfigurasi persentase bagi hasil dan promo yang berlaku untuk semua mitra.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Komisi Default (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-black text-lg"
                                                value={platformSettings?.commission_rate_default || 0}
                                                onChange={(e) => setPlatformSettings(prev => prev ? { ...prev, commission_rate_default: Number(e.target.value) } : null)}
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400">%</div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 px-1 italic">Diterapkan jika tidak ada promo aktif atau rate khusus mitra.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 px-1 font-black">Komisi Promo (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                className="w-full px-5 py-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-black text-lg text-indigo-700 dark:text-indigo-400"
                                                value={platformSettings?.commission_promo_rate || 0}
                                                onChange={(e) => setPlatformSettings(prev => prev ? { ...prev, commission_promo_rate: Number(e.target.value) } : null)}
                                            />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-indigo-400">%</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Masa Berlaku Promo</label>
                                    <input
                                        type="date"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
                                        value={platformSettings?.commission_promo_expires_at?.split('T')[0] || ''}
                                        onChange={(e) => setPlatformSettings(prev => prev ? { ...prev, commission_promo_expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined } : null)}
                                    />
                                    <div className="flex items-center gap-2 mt-2 px-1">
                                        <div className={`w-2 h-2 rounded-full ${platformSettings?.commission_promo_expires_at && new Date(platformSettings.commission_promo_expires_at) > new Date() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                        <span className="text-[10px] font-bold text-slate-500">
                                            Status Promo: {platformSettings?.commission_promo_expires_at && new Date(platformSettings.commission_promo_expires_at) > new Date() ? 'SEDANG AKTIF' : 'TIDAK AKTIF / EXPIRED'}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button
                                        onClick={async () => {
                                            if (!platformSettings?.id) return;
                                            try {
                                                await db.platform_settings.update(platformSettings.id, {
                                                    ...platformSettings,
                                                    updated_at: new Date().toISOString()
                                                });
                                                alert('Pengaturan berhasil disimpan!');
                                            } catch (err) {
                                                alert('Gagal menyimpan pengaturan.');
                                            }
                                        }}
                                        className="px-10 py-4 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95"
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

