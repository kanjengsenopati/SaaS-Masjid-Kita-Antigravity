import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { userService } from '../../services/rbacService';
import { useTenant } from '../tenants/TenantContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LogIn, Building2, ShieldCheck, AlertCircle, Search, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
    const { tenant } = useTenant();
    const { setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if redirected with a message
    const [successMessage, setSuccessMessage] = useState<string | null>(location.state?.message || null);

    // Clear message on unmount
    useEffect(() => {
        if (successMessage) {
            const t = setTimeout(() => setSuccessMessage(null), 5000);
            return () => clearTimeout(t);
        }
    }, [successMessage]);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await userService.login(username, password);
            if (res.data) {
                setUser(res.data);
                navigate('/');
            } else if (res.error) {
                setError(res.error);
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat login');
        } finally {
            setIsLoading(false);
        }
    };

    if (!tenant) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 font-sans p-6">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 dark:border-slate-700 animate-fade-in-up">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Building2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Masuk ke Dashboard</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Masukkan System ID (Slug) masjid Anda untuk melanjutkan login.</p>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const slug = formData.get('slug');
                        if (slug) navigate(`/login/${slug}`);
                    }} className="space-y-5 text-left">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">System ID</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    <Search size={18} />
                                </div>
                                <Input name="slug" placeholder="contoh: masjid-raya" required className="pl-10 w-full" />
                            </div>
                        </div>
                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-3 shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:-translate-y-1 transition-all duration-300">
                            Lanjut Cari Masjid <LogIn size={18} className="ml-2 inline" />
                        </Button>
                    </form>
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400">
                        Belum mendaftarkan masjid Anda? <button onClick={() => navigate('/register')} className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Daftar Sekarang</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 font-sans">
            {/* Left Side: Branding & Info */}
            <div
                className="hidden md:flex md:w-1/2 flex-col justify-between p-12 text-white relative overflow-hidden"
                style={{ backgroundColor: tenant.primaryColor }}
            >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                            <Building2 size={28} />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
                    </div>

                    <div className="space-y-6 max-w-md">
                        <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight">
                            Solusi Cerdas Pengelolaan Masjid Modern
                        </h2>
                        <p className="text-lg text-white/80 leading-relaxed font-medium">
                            Kelola keuangan, jamaah, agenda, dan aset masjid dalam satu platform terintegrasi yang transparan dan akuntabel.
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-4 text-sm font-medium text-white/60">
                    <span className="flex items-center gap-1.5"><ShieldCheck size={16} /> Data Aman & Terenkripsi</span>
                    <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                    <span>Versi 1.5.0</span>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="w-full max-w-md space-y-8">
                    <div className="md:hidden flex flex-col items-center mb-8">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg text-white"
                            style={{ backgroundColor: tenant.primaryColor }}
                        >
                            <Building2 size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.name}</h1>
                    </div>

                    <div className="text-center md:text-left">
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Selamat Datang</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Silakan login untuk mengelola sistem masjid Anda.</p>
                    </div>

                    {successMessage && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm animate-in fade-in slide-in-from-top-4">
                            <CheckCircle2 size={20} className="shrink-0" />
                            <p className="font-bold">{successMessage}</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 p-4 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm animate-shake">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-widest flex items-center gap-2">
                                Username
                            </label>
                            <Input
                                required
                                value={username}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                                placeholder="Masukkan username"
                                className="h-14 px-5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl text-lg focus:ring-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1 uppercase tracking-widest flex items-center gap-2">
                                Password
                            </label>
                            <Input
                                type="password"
                                required
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                placeholder="Masukkan password"
                                className="h-14 px-5 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-2xl text-lg focus:ring-2"
                            />
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                                <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">Ingat saya</span>
                            </label>
                            <button type="button" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Lupa Password?</button>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 shadow-lg hover:translate-y-[-2px] active:translate-y-[0px] transition-all"
                            style={{ backgroundColor: tenant.primaryColor }}
                        >
                            {isLoading ? 'Sedang Masuk...' : (
                                <>
                                    Masuk ke Dashboard <LogIn size={20} />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
                        <p className="text-sm text-gray-500">
                            Belum punya akses? <button className="text-emerald-600 font-bold hover:underline">Hubungi Takmir / Admin Pusat</button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
