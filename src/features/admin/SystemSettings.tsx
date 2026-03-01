import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import type { IPlatformSettings } from '../../types';
import { useSaaSAuth } from './SaaSAuthContext';
import { useSystemAudit } from '../../hooks/useSystemAudit';
import {
    Settings,
    Save,
    Globe,
    Mail,
    AlertTriangle,
    ShieldCheck,
    Zap,
    RefreshCcw,
    CheckCircle2
} from 'lucide-react';

export const SystemSettings: React.FC = () => {
    const { role, hasPermission } = useSaaSAuth();
    const isSuperAdmin = role?.name === 'Super Admin';
    const canUpdate = hasPermission('settings:update');
    const { logActivity } = useSystemAudit();

    const [settings, setSettings] = useState<IPlatformSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const current = await db.platform_settings.toCollection().first();
            if (current) {
                setSettings(current);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings || !isSuperAdmin) return;

        setIsSaving(true);
        try {
            if (settings.id) {
                await db.platform_settings.update(settings.id, {
                    ...settings,
                    updated_at: new Date().toISOString()
                });
            } else {
                await db.platform_settings.add({
                    ...settings,
                    updated_at: new Date().toISOString()
                });
            }

            await logActivity('Update System Settings', settings.id || 0, 'Modified global platform configuration');
            setSuccessMsg('Pengaturan sistem berhasil diperbarui!');
            setTimeout(() => setSuccessMsg(null), 3000);
            loadSettings();
        } catch (err) {
            console.error("Failed to save settings", err);
            alert("Gagal menyimpan pengaturan.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400 animate-pulse font-bold">Memuat Konfigurasi Sistem...</div>;
    }

    if (!isSuperAdmin) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-black text-slate-900">Akses Ditolak</h2>
                <p className="text-slate-500 max-w-sm">Anda tidak memiliki izin untuk mengakses atau mengubah pengaturan sistem utama.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <Settings className="text-slate-400" size={32} />
                        System Settings
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Konfigurasi global platform MASJIDKITA SaaS.</p>
                </div>
                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2 rounded-xl flex items-center gap-2 animate-in slide-in-from-right-4 font-bold text-sm">
                        <CheckCircle2 size={18} /> {successMsg}
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                {/* General Branding */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Globe size={20} className="text-blue-500" /> Identitas Platform
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Platform</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                    value={settings?.platform_name || ''}
                                    onChange={e => setSettings(s => s ? { ...s, platform_name: e.target.value } : null)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Dukungan (Support)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="email"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                        value={settings?.support_email || ''}
                                        onChange={e => setSettings(s => s ? { ...s, support_email: e.target.value } : null)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-3">
                            <AlertTriangle className="text-amber-500 mt-1 shrink-0" size={20} />
                            <div>
                                <div className="text-sm font-bold text-amber-800 dark:text-amber-400">Mode Pemeliharaan (Maintenance Mode)</div>
                                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 mb-3">Jika diaktifkan, seluruh pengguna kecuali Super Admin akan diarahkan ke halaman pemeliharaan.</p>
                                <button
                                    type="button"
                                    onClick={() => setSettings(s => s ? { ...s, is_maintenance_mode: !s.is_maintenance_mode } : null)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${settings?.is_maintenance_mode ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'}`}
                                >
                                    {settings?.is_maintenance_mode ? 'AKTIF (Platform Terkunci)' : 'NON-AKTIF'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Financial Config */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Zap size={20} className="text-amber-500" /> Konfigurasi Ekonomi SaaS
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Harga Paket PRO (Per Bulan)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                                    <input
                                        type="number"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold"
                                        value={settings?.pro_plan_price || 0}
                                        onChange={e => setSettings(s => s ? { ...s, pro_plan_price: parseInt(e.target.value) } : null)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Komisi Afiliasi (%)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="w-full pr-12 pl-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold text-right"
                                        value={settings?.commission_rate_default || 0}
                                        onChange={e => setSettings(s => s ? { ...s, commission_rate_default: parseInt(e.target.value) } : null)}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Limit Kuota Paket LITE (Jamaah)</label>
                            <input
                                type="number"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 font-bold text-indigo-600"
                                value={settings?.lite_plan_quota || 0}
                                onChange={e => setSettings(s => s ? { ...s, lite_plan_quota: parseInt(e.target.value) } : null)}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Actions */}
                <div className="space-y-6">
                    <div className="bg-emerald-600 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-500/20 space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                        <h3 className="text-xl font-black flex items-center gap-2">
                            <ShieldCheck size={24} /> Administrator Control
                        </h3>
                        <p className="text-emerald-100 text-sm leading-relaxed">
                            Pastikan data benar sebelum menyimpan. Perubahan pada konfigurasi ekonomi akan berdampak langsung pada kalkulasi profitabilitas.
                        </p>

                        {canUpdate && (
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 bg-white text-emerald-600 font-black rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                {isSaving ? <RefreshCcw size={20} className="animate-spin" /> : <Save size={20} />}
                                SIMPAN PENGATURAN
                            </button>
                        )}
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Database Snapshot</div>
                        <div className="space-y-3 text-xs font-mono text-slate-500">
                            <div>Table: platform_settings</div>
                            <div>Docs: 1 Entry</div>
                            <div>Last Sync: {settings?.updated_at ? new Date(settings.updated_at).toLocaleString() : 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
