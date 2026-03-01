import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import type { IAffiliate, ICommission, IAffiliateWithdrawal, ITenant } from '../../types';
import {
    Wallet,
    Copy,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Globe,
    DollarSign
} from 'lucide-react';
import { formatCurrencyRp } from '../../utils/formatters';

export const AffiliatePortal: React.FC = () => {
    const [selectedAffiliateId, setSelectedAffiliateId] = useState<number | null>(null);
    const [affiliates, setAffiliates] = useState<IAffiliate[]>([]);
    const [currentAffiliate, setCurrentAffiliate] = useState<IAffiliate | null>(null);
    const [commissions, setCommissions] = useState<ICommission[]>([]);
    const [withdrawals, setWithdrawals] = useState<IAffiliateWithdrawal[]>([]);
    const [referredTenants, setReferredTenants] = useState<ITenant[]>([]);
    const [activeTab, setActiveTab] = useState<'REFERRALS' | 'COMMISSIONS'>('REFERRALS');

    const [wdAmount, setWdAmount] = useState<string>('');
    const [bankInfo, setBankInfo] = useState<string>('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const loadAffiliates = async () => {
        const all = await db.affiliates.where('status').equals('ACTIVE').toArray();
        setAffiliates(all);
        if (all.length > 0 && !selectedAffiliateId) {
            setSelectedAffiliateId(all[0].id!);
        }
    };

    const loadAffiliateData = async (id: number) => {
        const aff = await db.affiliates.get(id);
        if (!aff) return;
        setCurrentAffiliate(aff);

        const [comms, withs, tenants] = await Promise.all([
            db.commissions.where('affiliate_id').equals(id).toArray(),
            db.affiliate_withdrawals.where('affiliate_id').equals(id).toArray(),
            db.tenants.where('affiliate_id').equals(id).toArray()
        ]);

        setCommissions(comms);
        setWithdrawals(withs);
        setReferredTenants(tenants);

        // Pre-fill bank info if available
        if (aff.bank_name && aff.bank_account_number) {
            setBankInfo(`${aff.bank_name} ${aff.bank_account_number} a/n ${aff.bank_account_name}`);
        }
    };

    useEffect(() => {
        loadAffiliates();
    }, []);

    useEffect(() => {
        if (selectedAffiliateId) {
            loadAffiliateData(selectedAffiliateId);
        }
    }, [selectedAffiliateId]);

    const handleCopyLink = () => {
        if (!currentAffiliate) return;
        const link = `${window.location.origin}/landing?ref=${currentAffiliate.referral_code}`;
        navigator.clipboard.writeText(link);
        setMessage({ text: 'Link referal berhasil disalin!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleRequestWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentAffiliate || !selectedAffiliateId) return;

        const amount = parseInt(wdAmount);
        if (isNaN(amount) || amount <= 0) {
            setMessage({ text: 'Jumlah penarikan tidak valid.', type: 'error' });
            return;
        }

        if (amount > currentAffiliate.balance) {
            setMessage({ text: 'Saldo tidak mencukupi.', type: 'error' });
            return;
        }

        if (!bankInfo.trim()) {
            setMessage({ text: 'Harap isi informasi bank tujuan.', type: 'error' });
            return;
        }

        try {
            await db.affiliate_withdrawals.add({
                affiliate_id: selectedAffiliateId,
                amount,
                status: 'PENDING',
                bank_info: bankInfo,
                created_at: new Date().toISOString()
            });

            setMessage({ text: 'Permintaan penarikan berhasil dikirim!', type: 'success' });
            setWdAmount('');
            loadAffiliateData(selectedAffiliateId);
        } catch (err) {
            setMessage({ text: 'Gagal mengirim permintaan.', type: 'error' });
        }
        setTimeout(() => setMessage(null), 3000);
    };

    if (affiliates.length === 0) {
        return (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-[32px] m-8 border border-slate-100 dark:border-slate-800 shadow-xl">
                <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Tidak Ada Affiliate Aktif</h2>
                <p className="text-slate-500 mt-2">Mohon daftarkan atau aktifkan partner di Affiliate Center terlebih dahulu.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Simulated Login Switcher */}
                <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-white">
                        <TrendingUp size={24} />
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Simulasi Login Affiliate</div>
                            <div className="text-sm font-bold">Pilih partner untuk melihat tampilan portal mereka</div>
                        </div>
                    </div>
                    <select
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 rounded-xl border-none font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                        value={selectedAffiliateId || ''}
                        onChange={(e) => setSelectedAffiliateId(Number(e.target.value))}
                    >
                        {affiliates.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.referral_code})</option>
                        ))}
                    </select>
                </div>

                {currentAffiliate && (
                    <div className="animate-in fade-in duration-700 space-y-8">
                        {/* Header & Referral Link */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="flex-1 space-y-2">
                                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                                    Halo, {currentAffiliate.name.split(' ')[0]}! 👋
                                </h1>
                                <p className="text-slate-500 font-medium">Selamat datang di portal kemitraan Anda. Pantau komisi dan referal Anda di sini.</p>
                            </div>

                            <div className="w-full lg:w-auto bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Link Referal Anda</div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-2xl font-mono text-sm text-indigo-600 dark:text-indigo-400 font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] md:max-w-xs">
                                        {window.location.origin}/landing?ref={currentAffiliate.referral_code}
                                    </div>
                                    <button
                                        onClick={handleCopyLink}
                                        className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                    >
                                        <Copy size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {message && (
                            <div className={`${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'} border px-4 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2`}>
                                {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                <span className="font-bold text-sm text-slate-900 dark:text-white">{message.text}</span>
                            </div>
                        )}

                        {/* Stats Dashboard */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
                                    <Wallet size={20} />
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Saldo Tersedia</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrencyRp(currentAffiliate.balance)}</div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 text-blue-600">
                                    <DollarSign size={20} />
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Pendapatan</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrencyRp(currentAffiliate.total_earned || 0)}</div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-4 text-purple-600">
                                    <Globe size={20} />
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Referred Masjid</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{referredTenants.length}</div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center mb-4 text-amber-600">
                                    <TrendingUp size={20} />
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Commission Rate</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white">{currentAffiliate.commission_rate || 10}%</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Referred Tenants & Commissions List */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex items-center gap-1 p-2 bg-white dark:bg-slate-900 rounded-2xl w-fit border border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => setActiveTab('REFERRALS')}
                                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'REFERRALS' ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'text-slate-500'}`}
                                    >
                                        Daftar Masjid
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('COMMISSIONS')}
                                        className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === 'COMMISSIONS' ? 'bg-slate-900 text-white dark:bg-emerald-600' : 'text-slate-500'}`}
                                    >
                                        Riwayat Komisi
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                                    {activeTab === 'REFERRALS' ? (
                                                        <>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Masjid</th>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Paket</th>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tgl Bergabung</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tenant</th>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Jumlah</th>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {activeTab === 'REFERRALS' ? referredTenants.map((ten) => (
                                                    <tr key={ten.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-5">
                                                            <div className="font-bold text-slate-900 dark:text-white">{ten.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono uppercase">{ten.slug}.masjidkita.id</div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-[10px] font-black">{ten.plan || 'PRO'}</span>
                                                        </td>
                                                        <td className="px-6 py-5 text-xs font-bold text-emerald-600">Aktif</td>
                                                        <td className="px-6 py-5 text-xs text-slate-500 font-medium">
                                                            {new Date(ten.createdAt || Date.now()).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                    </tr>
                                                )) : commissions.map((comm) => (
                                                    <tr key={comm.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="px-6 py-5 text-sm font-bold text-slate-700 dark:text-slate-300">Tenant #{comm.tenant_id}</td>
                                                        <td className="px-6 py-5 font-black text-slate-900 dark:text-white">{formatCurrencyRp(comm.amount)}</td>
                                                        <td className="px-6 py-5">
                                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${comm.status === 'PAID' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>{comm.status}</span>
                                                        </td>
                                                        <td className="px-6 py-5 text-xs text-slate-500 font-medium">{new Date(comm.created_at || '').toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                                {activeTab === 'REFERRALS' && referredTenants.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Belum ada masjid yang bergabung lewat link Anda.</td>
                                                    </tr>
                                                )}
                                                {activeTab === 'COMMISSIONS' && commissions.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Belum ada data komisi.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Withdrawal Request Form */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <DollarSign className="text-slate-400" />
                                    Tarik Komisi
                                </h3>

                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                                    <form onSubmit={handleRequestWithdrawal} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Jumlah Penarikan (Rp)</label>
                                            <input
                                                type="number"
                                                placeholder="Minimal Rp 50.000"
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-black text-lg"
                                                value={wdAmount}
                                                onChange={(e) => setWdAmount(e.target.value)}
                                                required
                                            />
                                            <div className="text-[10px] text-slate-400 italic flex justify-between px-1">
                                                <span>Saldo Anda: {formatCurrencyRp(currentAffiliate.balance)}</span>
                                                <button type="button" onClick={() => setWdAmount(currentAffiliate.balance.toString())} className="text-indigo-600 font-bold hover:underline">Tarik Semua</button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Informasi Rekening Bank</label>
                                            <textarea
                                                placeholder="Contoh: BCA 1234567890 a/n Nama Anda"
                                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm min-h-[100px]"
                                                value={bankInfo}
                                                onChange={(e) => setBankInfo(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="w-full py-4 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                            disabled={currentAffiliate.balance === 0}
                                        >
                                            Ajukan Penarikan Dana
                                        </button>
                                    </form>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Permintaan Terakhir</div>
                                        <div className="space-y-3">
                                            {withdrawals.slice(-3).reverse().map((wd) => (
                                                <div key={wd.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                    <div>
                                                        <div className="text-xs font-black text-slate-900 dark:text-white">{formatCurrencyRp(wd.amount)}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium">{new Date(wd.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${wd.status === 'APPROVED' ? 'bg-emerald-500 text-white' :
                                                        wd.status === 'REJECTED' ? 'bg-red-500 text-white' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {wd.status}
                                                    </span>
                                                </div>
                                            ))}
                                            {withdrawals.length === 0 && <div className="text-[10px] text-slate-400 italic px-1">Belum ada riwayat penarikan.</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
