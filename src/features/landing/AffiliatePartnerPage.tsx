import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Handshake,
    TrendingUp,
    Wallet,
    ShieldCheck,
    MessageCircle,
    Plus,
    Minus,
    ChevronRight,
    Award
} from 'lucide-react';
import { AffiliateRegistrationForm } from './AffiliateRegistrationForm';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-100 dark:border-slate-800 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group transition-all"
            >
                <span className="text-lg font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {question}
                </span>
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isOpen ? "bg-emerald-600 text-white rotate-0" : "bg-slate-50 dark:bg-slate-800 text-slate-400 rotate-0"
                )}>
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                </div>
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-300",
                isOpen ? "max-h-96 pb-6" : "max-h-0"
            )}>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {answer}
                </p>
            </div>
        </div>
    );
};

export const AffiliatePartnerPage: React.FC = () => {
    const navigate = useNavigate();

    const benefits = [
        {
            icon: <TrendingUp className="text-emerald-500" size={32} />,
            title: "Komisi 25% Recurring",
            desc: "Dapatkan bagi hasil 25% dari setiap biaya langganan yang dibayarkan oleh masjid referal Anda, berlaku selamanya selama mereka aktif."
        },
        {
            icon: <Wallet className="text-blue-500" size={32} />,
            title: "Min. Withdraw Rp 250rb",
            desc: "Proses penarikan komisi yang cepat dan mudah dengan ambang batas rendah hanya Rp 250.000 saja langsung ke rekening bank Anda."
        },
        {
            icon: <Award className="text-amber-500" size={32} />,
            title: "Dashboard Transparan",
            desc: "Pantau setiap klik, pendaftaran, dan status pembayaran referal Anda secara real-time melalui dashboard partner khusus."
        },
        {
            icon: <ShieldCheck className="text-purple-500" size={32} />,
            title: "Dukungan Penuh",
            desc: "Kami menyediakan materi pemasaran, banner, dan dukungan teknis untuk membantu Anda menjelaskan manfaat platform kepada pengurus masjid."
        }
    ];

    const faqs = [
        {
            question: "Bagaimana cara kerja program partner ini?",
            answer: "Cukup daftar melalui form di bawah ini. Setelah disetujui, Anda akan mendapatkan link referal unik. Bagikan link tersebut ke pengurus masjid. Jika mereka mendaftar dan berlangganan paket berbayar, Anda otomatis mendapatkan komisi."
        },
        {
            question: "Kapan komisi akan dibayarkan?",
            answer: "Komisi dihitung secara real-time setiap kali referal Anda melakukan pembayaran. Anda dapat melakukan penarikan dana (withdraw) kapan saja setelah saldo mencapai minimal Rp 250.000."
        },
        {
            question: "Apakah ada biaya untuk bergabung?",
            answer: "Tidak ada biaya sama sekali. Program Partner MasjidKita 100% gratis untuk siapa saja yang ingin membantu digitalisasi masjid di Indonesia."
        },
        {
            question: "Apakah komisi berlaku untuk perpanjangan langganan?",
            answer: "Ya! Ini adalah komisi recurring. Selama masjid tersebut memperpanjang langganannya (bulanan atau tahunan), Anda akan terus menerima komisi 25% setiap kali mereka membayar."
        },
        {
            question: "Bagaimana jika masjid tersebut butuh bantuan teknis?",
            answer: "Tim support MasjidKita akan menangani semua aspek teknis, onboarding, dan edukasi bagi pengurus masjid. Tugas Anda hanya memperkenalkan kemudahan digitalisasi ini kepada mereka."
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden">
            {/* Header / Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-600/20">
                            M
                        </div>
                        <span className="text-2xl font-black tracking-tight uppercase">MASJID<span className="text-emerald-600">KITA</span></span>
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Kembali
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-40 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-emerald-500/10 blur-[120px] rounded-full"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs uppercase tracking-widest animate-fade-in shadow-sm">
                            <Handshake size={14} fill="currentColor" />
                            Program Kemitraan MasjidKita
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                            Bersama Memakmurkan Masjid, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 inline-block">Dapatkan Manfaat Berkelanjutan</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                            Jadilah bagian dari revolusi digital manajemen masjid. Bantu masjid di sekitar Anda menjadi lebih profesional dan nikmati bagi hasil <strong>25% Komisi</strong> dari setiap pembayaran referal Anda.
                        </p>
                        <div className="pt-4">
                            <a
                                href="#register"
                                className="inline-flex items-center gap-2 px-10 py-5 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20"
                            >
                                Daftar Sekarang <ChevronRight size={20} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Grid */}
            <section className="py-20 bg-slate-50 dark:bg-slate-900/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {benefits.map((b, i) => (
                            <div key={i} className="p-10 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all group">
                                <div className="flex items-center gap-6 mb-7">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                        {b.icon}
                                    </div>
                                    <h3 className="text-2xl lg:text-3xl font-black leading-tight tracking-tight">{b.title}</h3>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    {b.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Content & FAQ & Form Split Layout */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

                        {/* FAQ Side */}
                        <div className="lg:col-span-7 space-y-12">
                            <div className="space-y-4 text-center lg:text-left">
                                <h2 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em]">Pertanyaan Sering Diajukan</h2>
                                <h3 className="text-4xl font-black leading-tight">Pahami Lebih Dalam <br /> Tentang Program Partner</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                                    Kami merancang program ini seadil mungkin untuk menghargai kontribusi Anda dalam digitalisasi rumah ibadah.
                                </p>
                            </div>

                            <div className="bg-white dark:bg-slate-900/50 rounded-[40px] border border-slate-100 dark:border-slate-800 p-8 lg:p-12 shadow-sm">
                                {faqs.map((faq, i) => (
                                    <FAQItem key={i} question={faq.question} answer={faq.answer} />
                                ))}
                            </div>

                            {/* Trust Note */}
                            <div className="p-8 bg-emerald-50 dark:bg-emerald-950/40 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-4">
                                <ShieldCheck className="text-emerald-600 shrink-0" size={24} />
                                <div>
                                    <h4 className="font-bold text-emerald-900 dark:text-emerald-400 text-lg">Komitmen Keamanan</h4>
                                    <p className="text-emerald-700/80 dark:text-emerald-400/60 text-sm font-medium mt-1">
                                        Data referal dan detail pembayaran Anda dilindungi dengan enkripsi tinggi. Kami menjamin akurasi perhitungan bagi hasil setiap bulannya.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Registration Form Side */}
                        <div id="register" className="lg:col-span-5 sticky top-32">
                            <div className="bg-white dark:bg-slate-900 rounded-[48px] border-2 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden p-2">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[42px] p-6 lg:p-8">
                                    <div className="mb-8 text-center">
                                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <MessageCircle size={32} />
                                        </div>
                                        <h3 className="text-2xl font-black">Formulir Pendaftaran</h3>
                                        <p className="text-slate-500 text-sm font-medium mt-1">Lengkapi data untuk mendapatkan Link Partner Anda</p>
                                    </div>
                                    <AffiliateRegistrationForm />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-12 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
                    <p className="text-slate-400 text-sm font-medium">
                        &copy; 2026 MASJIDKITA Digital. Program Kemitraan untuk Indonesia Maju.
                    </p>
                </div>
            </footer>
        </div>
    );
};
