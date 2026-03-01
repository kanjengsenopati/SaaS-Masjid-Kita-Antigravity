import React, { useState, useRef } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { userService } from '../../../services/rbacService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Camera, Save, Lock, User as UserIcon } from 'lucide-react';

export const UserProfile: React.FC = () => {
    const { user, setUser } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    if (!user) return <div className="p-8 text-center text-gray-500">Silakan login untuk melihat profil.</div>;

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setIsSaving(true);
            const res = await userService.update(user.id!, { avatar_base64: base64 });
            if (res.data) {
                setUser({ ...user, avatar_base64: base64 });
                setMessage({ type: 'success', text: 'Foto profil berhasil diperbarui!' });
            }
            setIsSaving(false);
        };
        reader.readAsDataURL(file);
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok!' });
            return;
        }

        setIsSaving(true);
        const res = await userService.update(user.id!, { password: passwordData.newPassword });
        if (!res.error) {
            setMessage({ type: 'success', text: 'Password berhasil diperbarui!' });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } else {
            setMessage({ type: 'error', text: 'Gagal memperbarui password.' });
        }
        setIsSaving(false);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="h-32 bg-emerald-600 dark:bg-emerald-700 relative">
                    <div className="absolute -bottom-12 left-8 group">
                        <div
                            onClick={handleAvatarClick}
                            className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-900 border-4 border-white dark:border-gray-800 shadow-md overflow-hidden cursor-pointer relative"
                        >
                            {user.avatar_base64 ? (
                                <img src={user.avatar_base64} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-gray-800 text-emerald-600">
                                    <UserIcon size={40} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="pt-16 pb-8 px-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.username}</h2>
                            <p className="text-gray-500 text-sm">{user.email || 'Email belum diatur'}</p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full uppercase tracking-wider">
                            ID User: #{user.id}
                        </div>
                    </div>

                    {message && (
                        <div className={`mt-6 p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Account Details */}
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold border-b border-gray-50 dark:border-gray-700 pb-4">
                        <UserIcon size={20} />
                        Informasi Akun
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Username</span>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-700 dark:text-gray-300 font-medium border border-gray-100 dark:border-gray-800">
                                {user.username}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Email</span>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-700 dark:text-gray-300 font-medium border border-gray-100 dark:border-gray-800">
                                {user.email || '-'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">No. WhatsApp</span>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-gray-700 dark:text-gray-300 font-medium border border-gray-100 dark:border-gray-800">
                                {user.phone_number || '-'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Change Password */}
                <form onSubmit={handleUpdatePassword} className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400 font-bold border-b border-gray-50 dark:border-gray-700 pb-4">
                        <Lock size={20} />
                        Keamanan & Password
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Password Baru</label>
                            <Input
                                type="password"
                                required
                                value={passwordData.newPassword}
                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                placeholder="Paling sedikit 8 karakter"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">Konfirmasi Password</label>
                            <Input
                                type="password"
                                required
                                value={passwordData.confirmPassword}
                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                placeholder="Ulangi password baru"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 mt-4"
                        >
                            <Save size={18} /> Simpan Password Baru
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
