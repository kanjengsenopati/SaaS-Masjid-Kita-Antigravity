import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../lib/db';
import type { IModule, IPackage, IPackageModule } from '../../types';
import {
    LayoutDashboard,
    ShieldCheck,
    Users,
    BarChart3,
    Zap,
    Globe,
    Heart,
    CheckCircle2,
    Check,
    Lock,
    Timer,
    Smartphone,
    X,
    Package,
    Calendar,
    Handshake
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const SaaSLandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
    const [dbPackages, setDbPackages] = useState<IPackage[]>([]);
    const [dbModules, setDbModules] = useState<IModule[]>([]);
    const [dbPackageModules, setDbPackageModules] = useState<IPackageModule[]>([]);
    const [searchParams] = useSearchParams();

    React.useEffect(() => {
        const refCode = searchParams.get('ref');
        if (refCode) {
            sessionStorage.setItem('affiliate_ref', refCode);
            console.log('Affiliate referral detected:', refCode);
        }
    }, [searchParams]);

    React.useEffect(() => {
        const loadPricing = async () => {
            const [pkgs, mods, pkgMods] = await Promise.all([
                db.packages.where('is_active').equals(1).toArray(),
                db.modules.toArray(),
                db.package_modules.toArray()
            ]);
            setDbPackages(pkgs);
            setDbModules(mods);
            setDbPackageModules(pkgMods);
        };
        loadPricing();
    }, []);

    const benefits = [
        {
            icon: <ShieldCheck className="text-emerald-500" size={32} />,
            title: "Transparansi Penuh",
            desc: "Wujudkan kepercayaan jamaah dengan sistem laporan keuangan yang terbuka, otomatis, dan akurat."
        },
        {
            icon: <Timer className="text-blue-500" size={32} />,
            title: "Efisiensi Kerja",
            desc: "Pangkas waktu administrasi manual. Kelola agenda, donasi, dan aset hanya dengan beberapa klik."
        },
        {
            icon: <Lock className="text-amber-500" size={32} />,
            title: "Keamanan Data",
            desc: "Data masjid dan jamaah tersimpan dengan enkripsi standar industri, aman dari risiko kehilangan."
        },
        {
            icon: <Smartphone className="text-purple-500" size={32} />,
            title: "Akses Kapan Saja",
            desc: "Pantau kondisi masjid dari mana saja melalui smartphone, tablet, atau laptop secara real-time."
        }
    ];

    const plans = [
        {
            id: 'LITE',
            name: 'Lite',
            price: billingPeriod === 'monthly' ? '99.000' : '79.000',
            features: ['Manajemen Keuangan Dasar', 'Database Jamaah (Max 100)', 'Landing Page Standar', 'Digital Signage Sederhana'],
            notIncluded: ['Workflow Approval', 'Custom Domain', 'Laporan Tahunan Otomatis'],
            isPopular: false
        },
        {
            id: 'PRO',
            name: 'Pro',
            price: billingPeriod === 'monthly' ? '249.000' : '199.000',
            features: ['Semua fitur Lite', 'Database Jamaah Tanpa Batas', 'Workflow Approval Kas', 'Custom Website (Slug/Subdomain)', 'Manajemen Aset & Inventaris'],
            notIncluded: ['Custom Domain Sendiri'],
            isPopular: true
        },
        {
            id: 'ENTERPRISE',
            name: 'Enterprise',
            price: 'Custom',
            features: ['Semua fitur Pro', 'Custom Domain (.id / .org)', 'Multi-Masjid (Yayasan)', 'Prioritas Support 24/7', 'Integrasi API Khusus'],
            notIncluded: [] as string[],
            isPopular: false
        }
    ];

    const displayPlans = dbPackages.length > 0 ? dbPackages.map(pkg => {
        const pkgModules = dbPackageModules
            .filter(pm => pm.package_id === pkg.id)
            .map(pm => dbModules.find(m => m.id === pm.module_id)?.name || '');

        const priceValue = billingPeriod === 'yearly' ? pkg.yearlyPrice / 12 : pkg.monthlyPrice;
        const price = priceValue === 0 ? 'Custom' : Math.round(priceValue).toLocaleString('id-ID');

        return {
            id: pkg.slug,
            name: pkg.name,
            price: price,
            features: pkgModules.filter(f => f !== ''),
            notIncluded: [] as string[],
            isPopular: pkg.is_popular
        };
    }) : plans;

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 selection:bg-emerald-500/30 overflow-x-hidden">
            {/* Header / Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-[#064E3B]/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-500/20">
                            M
                        </div>
                        <span className="text-2xl font-black tracking-tight uppercase text-emerald-50">MASJID<span className="text-emerald-400">KITA</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest text-emerald-100/70">
                        <a href="#features" className="hover:text-white transition-colors">Fitur</a>
                        <a href="#benefits" className="hover:text-white transition-colors">Manfaat</a>
                        <a href="#pricing" className="hover:text-white transition-colors">Harga</a>
                        <button
                            onClick={() => navigate('/jadi-partner')}
                            className="hover:text-white transition-colors uppercase"
                        >
                            Jadi Partner
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm font-bold text-white/80 hover:text-white px-4 py-2"
                        >
                            Masuk
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all shadow-lg shadow-emerald-500/30"
                        >
                            Daftar Gratis
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden min-h-[85vh] flex items-center justify-center bg-slate-950">

                {/* Modern Emerald Gradient Overlay with 50% Opacity */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-emerald-900 to-[#064E3B] opacity-50 z-0"></div>

                {/* Islamic/Arabesque Background Pattern - Subtler */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none z-0">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="arabesque_subtle" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                                <path d="M60 0 L120 60 L60 120 L0 60 Z" fill="none" stroke="white" strokeWidth="0.5" />
                                <circle cx="60" cy="60" r="12" fill="none" stroke="white" strokeWidth="0.5" />
                                <path d="M30 30 L90 90 M90 30 L30 90" stroke="white" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#arabesque_subtle)" />
                    </svg>
                </div>

                {/* Atmospheric Glows for Depth */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-emerald-400/10 blur-[150px] rounded-full z-0"></div>
                <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-teal-500/10 blur-[120px] rounded-full z-0"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                    <div className="flex flex-col items-center text-center space-y-9 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold text-[10px] uppercase tracking-[0.2em] backdrop-blur-sm">
                            <Zap size={12} fill="currentColor" className="animate-pulse" />
                            #1 Solusi Digital Manajemen Masjid
                        </div>

                        <div className="space-y-5">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white drop-shadow-2xl">
                                Kelola Masjid Lebih <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">Amanah & Profesional</span>
                            </h1>

                            <p className="text-base lg:text-lg text-emerald-50/70 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-lg">
                                <strong>MASJIDKITA</strong> menghadirkan platform SaaS terpadu untuk manajemen keuangan, database jamaah, dan publikasi kegiatan masjid dalam satu dashboard yang elegan.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4 w-full sm:w-auto">
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full sm:w-auto px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#064E3B] rounded-2xl font-black text-lg shadow-[0_15px_40px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95"
                            >
                                Mulai Sekarang &rarr;
                            </button>
                            <button className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl font-bold text-base backdrop-blur-md transition-all">
                                Lihat Demo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating Decoration */}
                <div className="absolute bottom-20 left-20 text-emerald-400/20 blur-[1px]">
                    <svg width="60" height="60" viewBox="0 0 40 40" fill="currentColor">
                        <path d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z" />
                    </svg>
                </div>
            </section>

            <div className="pt-8 flex flex-wrap justify-center gap-8 grayscale opacity-50 dark:opacity-40 relative z-10 mix-blend-multiply dark:mix-blend-screen bg-white py-8">
                {/* Placeholder trust logos */}
                <span className="font-bold text-xl tracking-tighter">MASJID-HUB</span>
                <span className="font-bold text-xl tracking-tighter">DEWAN-MASJID</span>
                <span className="font-bold text-xl tracking-tighter">ISLAMIC-NET</span>
            </div>

            {/* Core Features */}
            <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                        <h2 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em]">Fitur Unggulan</h2>
                        <h3 className="text-4xl font-extrabold tracking-tight">Digitalisasi Masjid Bersama <strong>MASJIDKITA</strong></h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <BarChart3 className="text-blue-500" />,
                                title: "Transparansi Keuangan",
                                desc: "Laporan pemasukan dan pengeluaran otomatis yang dapat diakses jamaah secara real-time."
                            },
                            {
                                icon: <Users className="text-emerald-500" />,
                                title: "Database Jamaah",
                                desc: "Kelola data jamaah, mustahik, dan pengurus dengan aman and tertata rapi."
                            },
                            {
                                icon: <ShieldCheck className="text-amber-500" />,
                                title: "Workflow Approval",
                                desc: "Sistem persetujuan berjenjang untuk pengeluaran dana masjid demi keamanan amanah."
                            },
                            {
                                icon: <Zap className="text-purple-500" />,
                                title: "Digital Signage",
                                desc: "Tampilkan waktu shalat, agenda, dan pengumuman di TV masjid secara otomatis."
                            },
                            {
                                icon: <Globe className="text-cyan-500" />,
                                title: "Custom Website",
                                desc: "Setiap masjid mendapatkan halaman website publik khusus (slug/domain sendiri)."
                            },
                            {
                                icon: <Heart className="text-red-500" />,
                                title: "Manajemen Santunan",
                                desc: "Kelola program galang donasi dan penyaluran santunan tepat sasaran."
                            },
                            {
                                icon: <Package className="text-orange-500" />,
                                title: "Manajemen Aset",
                                desc: "Inventarisasi aset masjid mulai dari peralatan hingga kendaraan secara profesional."
                            },
                            {
                                icon: <Calendar className="text-emerald-500" />,
                                title: "Jadwal Agenda",
                                desc: "Atur jadwal pengajian, imam, dan ustadz dengan kalender kegiatan terpadu."
                            },
                            {
                                icon: <Smartphone className="text-indigo-500" />,
                                title: "Jamaah Self Service",
                                desc: "Portal mandiri jamaah untuk akses laporan infaq dan update data profil."
                            }
                        ].map((f, i) => (
                            <div key={i} className="group p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl hover:border-emerald-500/20">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-xl font-bold">{f.title}</h4>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em]">Manfaat Utama</h2>
                                <h3 className="text-4xl lg:text-5xl font-black leading-tight">Membantu Masjid Mencapai Potensi Maksimal</h3>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                                Dengan digitalisasi, pengelolaan masjid tidak lagi terasa berat dan melelahkan. Kami hadir untuk memberikan kemudahan bagi pengurus dan kenyamanan bagi jamaah.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                                {benefits.map((b, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shadow-inner flex-shrink-0">
                                                {b.icon}
                                            </div>
                                            <h4 className="text-lg font-bold">{b.title}</h4>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{b.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 blur-[100px] -z-10 animate-pulse"></div>
                            <div className="relative mx-auto w-full max-w-lg lg:max-w-xl hover:scale-105 transition-transform duration-500">
                                <img
                                    src="/assets/images/mockups/jamaah_app_real.png"
                                    alt="MASJIDKITA Mobile App"
                                    className="w-full h-auto object-contain z-10 relative"
                                />
                            </div>
                            <div className="absolute -top-6 -right-6 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 animate-bounce delay-75">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="text-emerald-500" size={16} />
                                    <span className="text-xs font-bold">100% Amanah</span>
                                </div>
                            </div>
                            <div className="absolute bottom-10 -left-10 p-4 bg-emerald-600 rounded-2xl shadow-xl animate-bounce">
                                <Zap className="text-white" size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
                        <h2 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em]">Pilihan Paket</h2>
                        <h3 className="text-4xl lg:text-5xl font-black">Investasi untuk Masa Depan Masjid</h3>

                        <div className="flex items-center justify-center gap-4 pt-4">
                            <span className={cn("text-sm font-bold transition-colors", billingPeriod === 'monthly' ? "text-slate-900 dark:text-white" : "text-slate-400")}>Bulanan</span>
                            <button
                                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                                className="w-14 h-8 bg-slate-200 dark:bg-slate-800 rounded-full p-1 relative transition-colors"
                            >
                                <div className={cn(
                                    "w-6 h-6 bg-emerald-600 rounded-full shadow-lg transition-transform",
                                    billingPeriod === 'yearly' ? "translate-x-6" : "translate-x-0"
                                )}></div>
                            </button>
                            <span className={cn("text-sm font-bold transition-colors flex items-center gap-2", billingPeriod === 'yearly' ? "text-slate-900 dark:text-white" : "text-slate-400")}>
                                Tahunan
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 text-[10px] rounded-full uppercase tracking-tighter font-black">Diskon 20%</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {displayPlans.map((plan: any) => (
                            <div
                                key={plan.id}
                                className={cn(
                                    "relative p-10 bg-white dark:bg-slate-950 rounded-[48px] border-2 transition-all hover:-translate-y-2 flex flex-col",
                                    plan.isPopular ? "border-emerald-600 shadow-2xl shadow-emerald-600/10 scale-105 z-10" : "border-slate-100 dark:border-slate-800 hover:border-emerald-500/30"
                                )}
                            >
                                {plan.isPopular && (
                                    <div className="absolute top-0 right-10 -translate-y-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                        Paling Populer
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h4 className="text-xl font-black mb-4 uppercase tracking-wider">{plan.name}</h4>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-slate-400 text-sm font-bold">Rp</span>
                                        <span className="text-4xl font-black tracking-tighter">{plan.price}</span>
                                        {plan.price !== 'Custom' && (
                                            <span className="text-slate-400 text-sm font-bold">/ bln</span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10 flex-grow">
                                    {plan.features.map((f: string, i: number) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{f}</span>
                                        </div>
                                    ))}
                                    {plan.notIncluded.map((f: string, i: number) => (
                                        <div key={i} className="flex items-start gap-3 opacity-40">
                                            <div className="w-5 h-5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <X size={12} strokeWidth={4} />
                                            </div>
                                            <span className="text-sm font-medium text-slate-500">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => navigate('/login')}
                                    className={cn(
                                        "w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all",
                                        plan.isPopular
                                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/40"
                                            : "bg-slate-100 dark:bg-slate-900 hover:bg-emerald-600 hover:text-white text-slate-600 dark:text-slate-400"
                                    )}
                                >
                                    Pilih Paket {plan.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-slate-400 text-xs font-bold mt-12 uppercase tracking-widest">
                        * Semua paket sudah termasuk Free Trial 14 Hari tanpa kartu kredit
                    </p>
                </div>
            </section>

            {/* Platform Snapshot */}
            <section className="py-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-slate-950 rounded-[48px] p-8 md:p-16 lg:p-24 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-600/20 blur-[120px] -z-0"></div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                            <div className="space-y-8">
                                <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                                    Pantau Perkembangan <br />
                                    Masjid dalam Sekejap
                                </h2>
                                <p className="text-slate-400 text-lg">
                                    Dashboard admin yang intuitif memberikan gambaran menyeluruh tentang saldo kas, jumlah jamaah per kriteria, hingga status program sosial yang sedang berjalan.
                                </p>
                                <div className="space-y-4">
                                    {[
                                        "Laporan Keuangan Otomatis",
                                        "Integrasi Waktu Shalat Akurat",
                                        "Keamanan Data Terjamin",
                                        "Multi-user dengan Hak Akses Berbeda"
                                    ].map((t, i) => (
                                        <div key={i} className="flex items-center gap-3 text-white font-bold">
                                            <CheckCircle2 size={20} className="text-emerald-500" />
                                            {t}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black transition-all"
                                >
                                    Coba Sekarang
                                </button>
                            </div>

                            <div className="relative">
                                <div className="bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
                                    <LayoutDashboard size={80} className="text-emerald-500 opacity-20" />
                                    <div className="absolute inset-x-8 top-8 h-4 bg-white/5 rounded-full"></div>
                                    <div className="absolute inset-x-8 top-16 h-4 w-2/3 bg-white/5 rounded-full"></div>
                                    <div className="absolute inset-x-8 bottom-8 h-20 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"></div>
                                </div>
                                <div className="absolute -bottom-6 -left-6 p-6 bg-emerald-600 rounded-3xl shadow-2xl animate-bounce">
                                    <Zap size={32} className="text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                                M
                            </div>
                            <span className="text-xl font-black tracking-tight uppercase">MASJID<span className="text-emerald-600">KITA</span></span>
                        </div>

                        <p className="text-slate-500 text-sm font-bold">
                            &copy; 2026 MASJIDKITA Digital &bull; Platform Terpercaya Manajemen Rumah Ibadah
                        </p>

                        <div className="flex gap-6 mt-4 md:mt-0">
                            <button
                                onClick={() => navigate('/jadi-partner')}
                                className="text-slate-500 hover:text-emerald-600 text-sm font-bold flex items-center gap-2"
                            >
                                <Handshake size={18} />
                                Jadi Partner
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
