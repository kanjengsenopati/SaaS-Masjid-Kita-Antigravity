import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../tenants/TenantContext';
import { agendaService } from '../../services/agendaService';
import { donationProgramService } from '../../services/socialService';
import type { IAgenda, IDonationProgram } from '../../types';
import {
    LayoutDashboard,
    Tv,
    Calendar,
    HeartHandshake,
    ArrowRight,
    Clock,
    ChevronRight,
    TrendingUp
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/formatters';

export const LandingPage: React.FC = () => {
    const { tenant } = useTenant();
    const navigate = useNavigate();
    const [agendas, setAgendas] = useState<IAgenda[]>([]);
    const [programs, setPrograms] = useState<IDonationProgram[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPublicData = async () => {
            if (!tenant) return;
            setIsLoading(true);
            try {
                const [agendaRes, programRes] = await Promise.all([
                    agendaService.getAllForTenant(tenant.id!),
                    donationProgramService.getAllForTenant(tenant.id!)
                ]);

                if (agendaRes.data) {
                    const today = new Date().toISOString().split('T')[0];
                    const upcoming = agendaRes.data
                        .filter(a => (a.end_date || a.start_date) >= today)
                        .sort((a, b) => a.start_date.localeCompare(b.start_date))
                        .slice(0, 3);
                    setAgendas(upcoming);
                }

                if (programRes.data) {
                    setPrograms(programRes.data.filter(p => p.is_active !== false).slice(0, 3));
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadPublicData();
    }, [tenant]);

    if (!tenant) return null;

    const formatRp = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-500/30">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-slate-900 pt-16 pb-32 lg:pt-32 lg:pb-48">
                {/* Background Pattern & Gradients */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-blue-600/10"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider">Sistem Digital Masjid Terpadu</span>
                    </div>

                    <h1 className="text-4xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
                        Selamat Datang di <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                            {tenant.name}
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg lg:text-xl text-slate-400 mb-10">
                        Platform digital untuk transparansi keuangan, manajemen kegiatan, dan pelayanan jamaah yang lebih baik dan amanah.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="group flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all"
                        >
                            <LayoutDashboard size={20} />
                            Masuk Dashboard
                            <ArrowRight size={18} />
                        </button>
                        <button
                            onClick={() => navigate('/signage')}
                            className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold backdrop-blur-sm transition-all"
                        >
                            <Tv size={20} />
                            Digital Signage
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Access Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="group p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 transition-all hover:border-emerald-500/50">
                        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                            <Calendar size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Agenda & Kegiatan</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                            Pantau semua jadwal kajian, shalat berjamaah, dan kegiatan sosial masjid secara real-time.
                        </p>
                        <button onClick={() => navigate('/profile')} className="text-emerald-500 font-bold text-sm flex items-center gap-1">
                            Lihat Semua <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="group p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 transition-all hover:border-blue-500/50">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                            <HeartHandshake size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Sosial & Infaq</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                            Salurkan donasi Anda untuk program santunan dan pembangunan masjid dengan transparansi penuh.
                        </p>
                        <button onClick={() => navigate('/dashboard')} className="text-blue-500 font-bold text-sm flex items-center gap-1">
                            Berdonasi <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="group p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800/50 transition-all hover:border-amber-500/50">
                        <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
                            <TrendingUp size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3">Transparansi Dana</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                            Kami menyajikan laporan keuangan yang dapat diakses oleh seluruh jamaah kapan saja.
                        </p>
                        <button onClick={() => navigate('/dashboard')} className="text-amber-500 font-bold text-sm flex items-center gap-1">
                            Laporan Keuangan <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Upcoming Agendas */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <h2 className="text-3xl font-extrabold mb-12">Agenda Mendatang</h2>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse"></div>
                        ))}
                    </div>
                ) : agendas.length === 0 ? (
                    <div className="text-center py-20 bg-slate-100 dark:bg-slate-900 rounded-3xl">
                        <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">Belum ada agenda yang dijadwalkan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {agendas.map(agenda => (
                            <div key={agenda.id} className="group bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800 p-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4">
                                    <Clock size={12} />
                                    {formatDateDDMMYYYY(agenda.start_date)}
                                </div>
                                <h4 className="text-xl font-bold mb-3">{agenda.title}</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-3">
                                    {agenda.description || 'Tidak ada deskripsi tambahan.'}
                                </p>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 font-bold rounded-xl"
                                >
                                    Detail Kegiatan
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Donation Programs */}
            <div className="bg-slate-100 dark:bg-slate-900/50 py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-extrabold text-center mb-16">Gerakan Kebaikan</h2>

                    {programs.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100">
                            <HeartHandshake size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">Belum ada program donasi aktif.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {programs.map(p => (
                                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-slate-100 p-8 flex flex-col">
                                    <h4 className="text-xl font-bold mb-4">{p.name}</h4>

                                    {p.funding_source === 'GALANG_DONASI' && (
                                        <div className="mb-8 flex-grow">
                                            <div className="flex justify-between text-xs font-bold mb-2">
                                                <span className="text-slate-400">Terkumpul</span>
                                                <span className="text-emerald-500">{Math.round(((p.current_amount || 0) / (p.target_amount || 1)) * 100)}%</span>
                                            </div>
                                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
                                                <div
                                                    className="h-full bg-emerald-500 rounded-full"
                                                    style={{ width: `${Math.min(Math.round(((p.current_amount || 0) / (p.target_amount || 1)) * 100), 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-lg font-extrabold">{formatRp(p.current_amount || 0)}</span>
                                                <span className="text-xs text-slate-400">dari {formatRp(p.target_amount || 0)}</span>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl"
                                    >
                                        Infaq Sekarang
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-950 text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
                        <div className="space-y-4 max-w-xs">
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-xl">
                                    {tenant.name.charAt(0)}
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">{tenant.name}</h2>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Mewujudkan manajemen masjid yang modern, transparan, dan akuntabel melalui teknologi digital.
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-12">
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold uppercase tracking-widest text-emerald-500">Akses Cepat</h4>
                                <ul className="space-y-2 text-slate-400 text-sm">
                                    <li><button onClick={() => navigate('/profile')} className="hover:text-white transition-colors">Profil Masjid</button></li>
                                    <li><button onClick={() => navigate('/signage')} className="hover:text-white transition-colors">Digital Signage</button></li>
                                    <li><button onClick={() => navigate('/dashboard')} className="hover:text-white transition-colors">Dashboard Admin</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="mt-16 pt-8 border-t border-slate-900 text-center text-xs text-slate-600 uppercase tracking-widest font-bold">
                        &copy; 2026 {tenant.name} &bull; Powered by MASJIDKITA Digital
                    </div>
                </div>
            </footer>
        </div>
    );
};
