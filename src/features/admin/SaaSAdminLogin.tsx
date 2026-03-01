import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSaaSAuth } from './SaaSAuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ShieldCheck, LogIn, AlertCircle } from 'lucide-react';

export const SaaSAdminLogin: React.FC = () => {
    const { login } = useSaaSAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('super@masjidkita.id');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Very simplified login for dev - real app needs password check via backend/crypto
            const success = await login(email);
            if (success) {
                navigate('/saas-admin');
            } else {
                setError('Email staf tidak ditemukan atau tidak memiliki akses.');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat otentikasi internal.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
            {/* Left Column: Branding & Decoration */}
            <div className="hidden lg:flex flex-col justify-between w-1/2 bg-emerald-600 dark:bg-emerald-900 p-12 relative overflow-hidden text-white pt-16">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-700/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <ShieldCheck size={28} />
                    </div>
                    <span className="text-2xl font-black tracking-tight">MASJIDKITA SaaS</span>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h1 className="text-5xl font-black mb-6 leading-tight">Kelola Ekosistem Masjid dalam Satu Platform</h1>
                    <p className="text-emerald-50 text-xl leading-relaxed">
                        Pusat kontrol bagi tim MASJIDKITA untuk mengelola lisensi, pertumbuhan revenue, dan pemantauan aktivitas tenant di seluruh Indonesia.
                    </p>

                    {/* Seed Credentials Hint */}
                    <div className="mt-12 p-6 bg-emerald-800/40 rounded-3xl border border-emerald-500/30 backdrop-blur-md">
                        <div className="text-sm font-black uppercase tracking-widest text-emerald-200 mb-4">Seeded Test Credentials</div>
                        <div className="space-y-3 font-mono text-sm">
                            <div className="flex items-center justify-between border-b border-emerald-600/30 pb-2">
                                <span className="font-bold text-white">Super Admin</span>
                                <span className="text-emerald-100">super@masjidkita.id</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-emerald-600/30 pb-2">
                                <span className="font-bold text-white">CS</span>
                                <span className="text-emerald-100">cs@masjidkita.id</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-emerald-600/30 pb-2">
                                <span className="font-bold text-white">Marketing</span>
                                <span className="text-emerald-100">marketing@masjidkita.id</span>
                            </div>
                            <div className="pt-2 text-emerald-300 text-xs">Semua Password: <span className="text-white font-bold ml-1">password123</span></div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-emerald-200/80 text-sm font-medium">
                    &copy; {new Date().getFullYear()} Admin Portal MASJIDKITA. Hak Cipta Dilindungi.
                </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-12 relative animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="max-w-md w-full">
                    <div className="mb-12 text-center lg:text-left">
                        <div className="inline-flex lg:hidden items-center justify-center w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl mb-6">
                            <ShieldCheck size={32} />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Login Portal</h2>
                        <p className="text-slate-500 font-medium mt-3 text-lg">Masuk untuk mengelola operasional MASJIDKITA.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 p-4 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-400 text-sm mb-8 animate-shake">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="font-bold leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Email Internal</label>
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@masjidkita.id"
                                className="w-full bg-white dark:bg-slate-900 h-14 text-base font-medium rounded-2xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Kata Sandi</label>
                            <Input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white dark:bg-slate-900 h-14 text-base font-medium rounded-2xl"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl py-4 shadow-xl shadow-emerald-500/20 font-black text-lg h-auto mt-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? 'MENGOTENTIKASI...' : <><LogIn size={20} className="mr-2 inline" /> MASUK SEKARANG</>}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};
