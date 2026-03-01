import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import type { IInternalAdmin, IInternalRole } from '../../types';
import { useSaaSAuth } from './SaaSAuthContext';
import { useSystemAudit } from '../../hooks/useSystemAudit';
import { Plus, Search, Shield, User, Users, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SaaSStaffManagement: React.FC = () => {
    const { role } = useSaaSAuth();
    const isSuperAdmin = role?.name === 'Super Admin';
    const { logActivity } = useSystemAudit();

    const [admins, setAdmins] = useState<(IInternalAdmin & { roleName?: string })[]>([]);
    const [roles, setRoles] = useState<IInternalRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRoleId, setNewRoleId] = useState<number>(0);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const allRoles = await db.internal_roles.toArray();
            setRoles(allRoles);

            if (allRoles.length > 0 && newRoleId === 0) {
                // Default to CS or the first role if no selection
                const csRole = allRoles.find(r => r.name === 'CS');
                setNewRoleId(csRole?.id || allRoles[0].id!);
            }

            const allAdmins = await db.internal_admins.toArray();
            const enhancedAdmins = allAdmins.map(admin => {
                const adminRole = allRoles.find(r => r.id === admin.internal_role_id);
                return { ...admin, roleName: adminRole?.name || 'Unknown' };
            });
            setAdmins(enhancedAdmins);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const showMessage = (msg: string, type: 'error' | 'success') => {
        if (type === 'error') setError(msg);
        else setSuccess(msg);
        setTimeout(() => {
            setError(null);
            setSuccess(null);
        }, 3000);
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!newName || !newEmail || !newPassword || !newRoleId) {
            showMessage('Semua field wajib diisi.', 'error');
            return;
        }

        try {
            // Check email exists
            const existing = await db.internal_admins.where('email').equals(newEmail).first();
            if (existing) {
                showMessage('Email sudah terdaftar.', 'error');
                return;
            }

            const now = new Date().toISOString();
            await db.internal_admins.add({
                name: newName,
                email: newEmail,
                password: newPassword, // In a real app, hash this
                internal_role_id: Number(newRoleId),
                created_at: now,
                updated_at: now
            });

            await logActivity('Add New Staff', newEmail, `Added staff ${newName} with role ID ${newRoleId}`);

            showMessage('Staff berhasil ditambahkan!', 'success');
            setIsAddModalOpen(false);
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            loadData();
        } catch (err: any) {
            showMessage(err.message || 'Gagal menambahkan staff.', 'error');
        }
    };

    const getRoleHighlight = (roleName?: string) => {
        switch (roleName) {
            case 'Super Admin': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'CS': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Marketing': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    const filteredAdmins = admins.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [activeTab, setActiveTab] = useState<'LIST' | 'MATRIX'>('LIST');
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
    const [rolePermissions, setRolePermissions] = useState<number[]>([]);
    const [allPermissions, setAllPermissions] = useState<any[]>([]);

    useEffect(() => {
        if (activeTab === 'MATRIX') {
            loadMatrixData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedRoleId) {
            loadRolePermissions(selectedRoleId);
        }
    }, [selectedRoleId]);

    const loadMatrixData = async () => {
        const perms = await db.internal_permissions.toArray();
        setAllPermissions(perms);
        const allRoles = await db.internal_roles.toArray();
        setRoles(allRoles);
        if (allRoles.length > 0 && !selectedRoleId) {
            setSelectedRoleId(allRoles[0].id!);
        }
    };

    const loadRolePermissions = async (roleId: number) => {
        const rolePerms = await db.internal_role_permissions
            .where('internal_role_id').equals(roleId)
            .toArray();
        setRolePermissions(rolePerms.map(rp => rp.internal_permission_id));
    };

    const togglePermission = async (permId: number) => {
        if (!isSuperAdmin || !selectedRoleId) return;

        const isAssigned = rolePermissions.includes(permId);
        try {
            if (isAssigned) {
                await db.internal_role_permissions
                    .where('[internal_role_id+internal_permission_id]')
                    .equals([selectedRoleId, permId])
                    .delete();
                setRolePermissions(prev => prev.filter(p => p !== permId));
            } else {
                await db.internal_role_permissions.add({
                    internal_role_id: selectedRoleId,
                    internal_permission_id: permId
                });
                setRolePermissions(prev => [...prev, permId]);
            }
        } catch (err) {
            console.error("Failed to toggle permission", err);
        }
    };

    const modules = ['tenants', 'affiliates', 'staff', 'settings', 'audit_logs'];
    const actions = ['create', 'read', 'update', 'delete'];

    return (
        <div className="p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="text-emerald-600" />
                        Manajemen Staf SaaS
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Kelola akses dan peran untuk pengelola platform MASJIDKITA.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                        <button
                            onClick={() => setActiveTab('LIST')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'LIST' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}
                        >
                            Daftar Staf
                        </button>
                        <button
                            onClick={() => setActiveTab('MATRIX')}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'MATRIX' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}
                        >
                            Matriks Role
                        </button>
                    </div>
                    {isSuperAdmin && activeTab === 'LIST' && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                        >
                            <Plus size={18} /> Tambah Staf
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'LIST' ? (
                <>
                    {/* Notifications */}
                    {success && (
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                            <CheckCircle2 size={20} /> <span className="font-bold">{success}</span>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake">
                            <AlertCircle size={20} /> <span className="font-bold">{error}</span>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 shadow-sm">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama atau email staf..."
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Nama Staf</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Email</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">SaaS Role</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dibuat Pada</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 animate-pulse">Memuat data staf...</td>
                                        </tr>
                                    ) : filteredAdmins.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Tidak ada data staf ditemukan.</td>
                                        </tr>
                                    ) : (
                                        filteredAdmins.map((admin) => (
                                            <tr key={admin.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                            {admin.name.charAt(0)}
                                                        </div>
                                                        <div className="font-bold text-slate-900 dark:text-white">{admin.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-500">{admin.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex w-max items-center gap-1.5 ${getRoleHighlight(admin.roleName)}`}>
                                                        {admin.roleName === 'Super Admin' ? <Shield size={12} /> : <User size={12} />}
                                                        {admin.roleName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                                                    {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Shield className="text-emerald-600" /> Matriks Izin (CRUD)
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">Atur akses granular berdasarkan modul untuk setiap peran internal.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-slate-400">Pilih Role:</label>
                                <select
                                    className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                                    value={selectedRoleId || ''}
                                    onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Modul / Fitur</th>
                                        {actions.map(action => (
                                            <th key={action} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{action}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {modules.map(mod => (
                                        <tr key={mod} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white capitalize">{mod.replace('_', ' ')}</div>
                                            </td>
                                            {actions.map(action => {
                                                const slug = `${mod}:${action}`;
                                                const perm = allPermissions.find(p => p.slug === slug);
                                                const isAssigned = perm ? rolePermissions.includes(perm.id) : false;
                                                const isSuperAdminRole = roles.find(r => r.id === selectedRoleId)?.name === 'Super Admin';

                                                return (
                                                    <td key={action} className="px-6 py-4 text-center">
                                                        <button
                                                            disabled={!isSuperAdmin || isSuperAdminRole}
                                                            onClick={() => perm && togglePermission(perm.id)}
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isAssigned
                                                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300'
                                                                } ${(!isSuperAdmin || isSuperAdminRole) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-90'}`}
                                                        >
                                                            {isAssigned ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 rounded-md"></div>}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {roles.find(r => r.id === selectedRoleId)?.name === 'Super Admin' && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400 text-sm font-medium">
                                <AlertCircle size={20} />
                                Izin untuk Super Admin dikunci dan mencakup seluruh akses platform.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Staff Modal (Only for LIST tab) */}
            {isAddModalOpen && activeTab === 'LIST' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-8">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Plus className="text-emerald-600" /> Tambah Staf Baru
                            </h3>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleAddStaff} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="John Doe"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email Internal</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="john@masjidkita.id"
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Password Sementara</label>
                                    <input
                                        type="password"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Role Utama</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                                        value={newRoleId}
                                        onChange={e => setNewRoleId(Number(e.target.value))}
                                    >
                                        <option value={0} disabled>Pilih Role...</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-xl transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2.5 text-white bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                                    >
                                        Simpan Staf
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
