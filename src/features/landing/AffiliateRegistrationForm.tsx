import React, { useState } from 'react';
import { db } from '../../lib/db';
import {
    User,
    Mail,
    Phone,
    MessageSquare,
    Send,
    CheckCircle2,
    X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AffiliateRegistrationFormProps {
    onClose?: () => void;
}

export const AffiliateRegistrationForm: React.FC<AffiliateRegistrationFormProps> = ({ onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        motivation: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            // Check if email already exists
            const existing = await db.affiliates.where('email').equals(formData.email).first();
            if (existing) {
                setError('Email ini sudah terdaftar sebagai partner.');
                setIsSubmitting(false);
                return;
            }

            // Create pending affiliate
            await db.affiliates.add({
                name: formData.name,
                email: formData.email,
                phone_number: formData.phone,
                referral_code: `PENDING-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                balance: 0,
                status: 'PENDING',
                total_earned: 0,
                total_withdrawn: 0,
                commission_rate: 25, // Updated to 25% as per new requirements
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as any);

            setIsSubmitted(true);
        } catch (err) {
            console.error('Failed to register affiliate:', err);
            setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi nanti.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="p-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Pendaftaran Berhasil!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                    Terima kasih telah tertarik menjadi partner kami. Tim kami akan meninjau pendaftaran Anda dan menghubungi Anda melalui email dalam 1-2 hari kerja.
                </p>
                <button
                    onClick={() => onClose ? onClose() : window.location.reload()}
                    className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                    {onClose ? 'Tutup' : 'Selesai'}
                </button>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Gabung Jadi Partner</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1 text-balance">Isi formulir di bawah ini untuk memulai kemitraan Anda.</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            required
                            type="text"
                            placeholder="Contoh: Ahmad Hidayat"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Alamat Email</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            required
                            type="email"
                            placeholder="alamat@email.com"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nomor WhatsApp</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            required
                            type="tel"
                            placeholder="0812xxxx"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Mengapa ingin bergabung? (Optional)</label>
                    <div className="relative">
                        <MessageSquare className="absolute left-4 top-4 text-slate-400" size={18} />
                        <textarea
                            rows={3}
                            placeholder="Berikan alasan singkat..."
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium text-slate-900 dark:text-white resize-none"
                            value={formData.motivation}
                            onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                        "w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                        isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-emerald-500"
                    )}
                >
                    {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Kirim Pendaftaran
                            <Send size={18} />
                        </>
                    )}
                </button>

                <p className="text-[10px] text-center text-slate-400 font-medium px-4">
                    Dengan mendaftar, Anda setuju dengan syarat dan ketentuan program partner MasjidKita.
                </p>
            </form>
        </div>
    );
};
