import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Building2, User, CheckCircle2, ChevronRight, ChevronLeft, ShieldCheck, Mail, Lock } from 'lucide-react';
import { db } from '../../lib/db';
import type { ITenant, IUser, IRole, IFoundation } from '../../types';

export const RegisterWizard: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [adminData, setAdminData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [mosqueData, setMosqueData] = useState({ name: '', slug: '', foundationName: '', address: '' });
    const [planData, setPlanData] = useState({ plan: 'PRO' as 'LITE' | 'PRO' | 'ENTERPRISE' });

    const handleNext = () => setStep(s => Math.min(s + 1, 3));
    const handleBack = () => setStep(s => Math.max(s - 1, 1));

    const handleSubmit = async () => {
        if (adminData.password !== adminData.confirmPassword) {
            setError('Password tidak cocok');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Generate Tenant Code YYYYMMDD-XXX
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const datePrefix = `${yyyy}${mm}${dd}`;

            const count = await db.tenants.count();
            const sequence = String(count + 1).padStart(3, '0');
            const tenantCode = `${datePrefix}-${sequence}`;

            // Check for affiliate referral
            let affiliateId: number | undefined;
            const refCode = sessionStorage.getItem('affiliate_ref');
            if (refCode) {
                const affiliate = await db.affiliates.where('referral_code').equals(refCode).first();
                if (affiliate && affiliate.status === 'ACTIVE') {
                    affiliateId = affiliate.id;
                }
            }

            // 1. Create Tenant
            const newTenantId = await db.tenants.add({
                name: mosqueData.name,
                tenant_code: tenantCode,
                host: `${mosqueData.slug}.masjidkita.id`, // Virtual host mapping
                slug: mosqueData.slug,
                plan: planData.plan,
                affiliate_id: affiliateId,
                primaryColor: '#10b981', // Default Emerald
                goldPrice: 1500000,
                infaqEnabled: true,
                waqafEnabled: true,
                qurbanEnabled: true,
                santunanEnabled: true,
                createdAt: new Date().toISOString()
            } as ITenant);

            // 1a. Create Initial Subscription
            const subscriptionId = await db.subscriptions.add({
                tenant_id: newTenantId,
                plan_name: planData.plan,
                status: 'ACTIVE',
                amount: planData.plan === 'PRO' ? 250000 : planData.plan === 'ENTERPRISE' ? 1000000 : 0,
                start_date: new Date().toISOString(),
                end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
                created_at: new Date().toISOString()
            });

            // 1b. Handle Affiliate Commission
            if (affiliateId) {
                const affiliate = await db.affiliates.get(affiliateId);
                if (affiliate) {
                    let price = 0;
                    if (planData.plan === 'PRO') price = 250000;
                    else if (planData.plan === 'ENTERPRISE') price = 1000000; // Simulated

                    if (price > 0) {
                        // Determine applicable commission rate
                        const settings = await db.platform_settings.toCollection().first();
                        let rate = 10; // Hard fallback

                        // Check Promo Rate first
                        if (settings?.commission_promo_rate && settings?.commission_promo_expires_at && new Date(settings.commission_promo_expires_at) > new Date()) {
                            rate = settings.commission_promo_rate;
                        } else {
                            // Fallback to Affiliate Specific Rate OR System Default
                            rate = affiliate.commission_rate ?? (settings?.commission_rate_default || 10);
                        }

                        const commissionAmount = (price * rate) / 100;

                        await db.commissions.add({
                            affiliate_id: affiliateId,
                            tenant_id: newTenantId,
                            subscription_id: subscriptionId,
                            amount: commissionAmount,
                            status: 'PENDING',
                            created_at: new Date().toISOString()
                        });

                        // Update Affiliate Balance
                        await db.affiliates.update(affiliateId, {
                            balance: (affiliate.balance || 0) + commissionAmount,
                            total_earned: (affiliate.total_earned || 0) + commissionAmount
                        });

                        // Clear referral from session
                        sessionStorage.removeItem('affiliate_ref');
                    }
                }
            }

            // 2. Create Foundation Profile
            await db.foundations.add({
                tenant_id: newTenantId,
                name: mosqueData.foundationName,
                address: mosqueData.address,
                legal_doc_number: 'PENDING'
            } as IFoundation);

            // 3. Create Super Admin Role
            const roleId = await db.roles.add({
                tenant_id: newTenantId,
                name: 'Super Admin',
                createdAt: new Date().toISOString()
            } as IRole);

            // 4. Create initial Admin User
            await db.users.add({
                tenant_id: newTenantId,
                username: adminData.username,
                role_id: roleId,
                createdAt: new Date().toISOString()
            } as IUser);

            // Redirect to login with success message
            setTimeout(() => {
                navigate(`/login/${mosqueData.slug}`, { state: { message: 'Registrasi berhasil! Silakan login.' } });
            }, 1500);

        } catch (err: any) {
            console.error("Registration error", err);
            setError(err.message || 'Terjadi kesalahan saat pendaftaran');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col pt-8 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full mx-auto relative z-10">
                {/* Header Navbar-like */}
                <div className="flex items-center justify-between mb-12 animate-fade-in-up">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                            <Building2 size={24} />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">MASJIDKITA</span>
                    </div>
                    <button onClick={() => navigate('/login')} className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600">
                        Sudah punya akun? Masuk
                    </button>
                </div>

                {/* Wizard Container */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700/50 overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s' }}>

                    {/* Stepper Header */}
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-6 md:p-8 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center justify-between relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-700 -z-10 rounded-full">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${((step - 1) / 2) * 100}%` }}
                                ></div>
                            </div>

                            {[1, 2, 3].map((num) => (
                                <div key={num} className="flex flex-col items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${step >= num
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                                        : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-600'
                                        }`}>
                                        {step > num ? <CheckCircle2 size={20} /> : num}
                                    </div>
                                    <span className={`mt-2 text-xs font-bold ${step >= num ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                        {num === 1 ? 'Akun' : num === 2 ? 'Masjid' : 'Paket'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Form Content */}
                    <div className="p-6 md:p-10">
                        {error && (
                            <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-100 dark:border-red-800 flex items-center gap-3">
                                <ShieldCheck size={20} /> {error}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Informasi Admin</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Buat akun untuk super admin pengelola sistem masjid.</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <User size={18} />
                                            </div>
                                            <Input
                                                className="pl-10"
                                                placeholder="admin.masjid"
                                                value={adminData.username}
                                                onChange={e => setAdminData({ ...adminData, username: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email <span className="text-slate-400 font-normal">(opsional)</span></label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Mail size={18} />
                                            </div>
                                            <Input
                                                type="email"
                                                className="pl-10"
                                                placeholder="admin@masjid.com"
                                                value={adminData.email}
                                                onChange={e => setAdminData({ ...adminData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                                                <Input type="password" placeholder="••••••••" className="pl-10" value={adminData.password} onChange={e => setAdminData({ ...adminData, password: e.target.value })} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Konfirmasi Password</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                                                <Input type="password" placeholder="••••••••" className="pl-10" value={adminData.confirmPassword} onChange={e => setAdminData({ ...adminData, confirmPassword: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Identitas Masjid</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Lengkapi data masjid yang akan didaftarkan sebagai Tenant.</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Masjid</label>
                                        <Input
                                            placeholder="Contoh: Masjid Raya Al-Jabar"
                                            value={mosqueData.name}
                                            onChange={e => {
                                                const name = e.target.value;
                                                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                                setMosqueData({ ...mosqueData, name, slug });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">System ID (Slug/Subdomain)</label>
                                        <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500 transition-shadow">
                                            <Input
                                                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-3 w-1/2 font-mono text-sm"
                                                placeholder="masjid-raya"
                                                value={mosqueData.slug}
                                                onChange={e => setMosqueData({ ...mosqueData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                            />
                                            <div className="bg-slate-200 dark:bg-slate-800 px-4 flex items-center text-sm font-bold text-slate-500 border-l border-slate-300 dark:border-slate-700">
                                                .masjidkita.id
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">Ini akan menjadi alamat ID akses admin unik untuk masjid Anda.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Yayasan Pendiri <span className="text-slate-400 font-normal">(opsional)</span></label>
                                        <Input
                                            placeholder="Contoh: Yayasan Dakwah Insani"
                                            value={mosqueData.foundationName}
                                            onChange={e => setMosqueData({ ...mosqueData, foundationName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap</label>
                                        <textarea
                                            className="w-full flex min-h-[80px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-transparent dark:text-white"
                                            placeholder="Jln. Kebangkitan No. 1, Kota Bandung..."
                                            value={mosqueData.address}
                                            onChange={e => setMosqueData({ ...mosqueData, address: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pilih Paket Berlangganan</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-1">Pilih paket yang sesuai dengan kebutuhan skala operasional masjid Anda.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(['LITE', 'PRO', 'ENTERPRISE'] as const).map((plan) => (
                                        <div
                                            key={plan}
                                            onClick={() => setPlanData({ plan })}
                                            className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all duration-300 ${planData.plan === plan
                                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-md shadow-emerald-500/10'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 bg-white dark:bg-slate-800'
                                                }`}
                                        >
                                            {planData.plan === plan && (
                                                <div className="absolute top-3 right-3 text-emerald-500">
                                                    <CheckCircle2 size={24} className="fill-emerald-100 dark:fill-emerald-900" />
                                                </div>
                                            )}
                                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">{plan}</h3>
                                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">
                                                {plan === 'LITE' ? 'Gratis' : plan === 'PRO' ? '250k/bln' : 'Hubungi'}
                                            </p>
                                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Transaksi {plan === 'LITE' ? 'Terbatas' : 'Unlimited'}</li>
                                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {plan === 'LITE' ? 'Max 50 Jamaah' : plan === 'PRO' ? 'Max 2500 Jamaah' : 'Jamaah Unlimited'}</li>
                                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Website Publik {plan !== 'LITE' && 'Premium'}</li>
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-100 dark:border-slate-700">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                disabled={step === 1 || isLoading}
                                className="px-6 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <ChevronLeft size={16} className="mr-1" /> Kembali
                            </Button>

                            {step < 3 ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={
                                        (step === 1 && (!adminData.username || !adminData.password)) ||
                                        (step === 2 && (!mosqueData.name || !mosqueData.slug))
                                    }
                                    className="px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                >
                                    Lanjut <ChevronRight size={16} className="ml-1" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                                >
                                    {isLoading ? 'Memproses...' : 'Daftar Sekarang & Masuk'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
