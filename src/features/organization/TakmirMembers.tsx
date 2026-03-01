import React, { useState, useEffect } from 'react';
import { useTenant } from '../tenants/TenantContext';
import { managementPeriodService, takmirMemberService } from '../../services/organizationService';
import { userService } from '../../services/rbacService';
import type { ITakmirMember, IManagementPeriod, IUser } from '../../types';
import { Plus, Trash2, ShieldAlert } from 'lucide-react';

export const TakmirMembers: React.FC = () => {
    const { tenant } = useTenant();
    const [activePeriod, setActivePeriod] = useState<IManagementPeriod | null>(null);
    const [members, setMembers] = useState<ITakmirMember[]>([]);
    const [users, setUsers] = useState<IUser[]>([]);

    // Form state
    const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
    const [position, setPosition] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        if (!tenant) return;

        // 1. Get Active Period
        const { data: period } = await managementPeriodService.getCurrentActivePeriod(tenant.id!);
        if (period) {
            setActivePeriod(period);
            // 2. Load members for this period
            const { data: mems } = await takmirMemberService.getMembersByPeriod(tenant.id!, period.id!);
            if (mems) setMembers(mems);
        } else {
            setActivePeriod(null);
            setMembers([]);
        }

        // 3. Load all users (for the dropdown)
        const { data: usrs } = await userService.getAllForTenant(tenant.id!);
        if (usrs) {
            setUsers(usrs);
        } else {
            // Mock users if database is empty for demo purpose
            setUsers([
                { id: 1, tenant_id: tenant.id!, username: 'Ahmad Ketua', role_id: 1 },
                { id: 2, tenant_id: tenant.id!, username: 'Budi Bendahara', role_id: 2 }
            ]);
        }
    };

    useEffect(() => { loadData(); }, [tenant]);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant || !activePeriod || !selectedUserId || !position) return;

        setIsSaving(true);
        await takmirMemberService.createForTenant(tenant.id!, {
            period_id: activePeriod.id!,
            user_id: Number(selectedUserId),
            position
        });

        setPosition('');
        setSelectedUserId('');
        setIsSaving(false);
        loadData();
    };

    const handleRemoveMember = async (id: number) => {
        if (!confirm('Hapus pengurus ini?')) return;
        await takmirMemberService.delete(id);
        loadData();
    };

    if (!tenant) return null;

    if (!activePeriod) {
        return (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6 flex items-start gap-4">
                <ShieldAlert className="text-orange-500 mt-1" />
                <div>
                    <h3 className="font-semibold text-orange-800 dark:text-orange-400">Tidak Ada Periode Aktif</h3>
                    <p className="text-orange-600 dark:text-orange-300 text-sm mt-1">
                        Harap tentukan periode aktif terlebih dahulu di tabel Periode Jabatan untuk dapat mengatur struktur kepengurusan Takmir.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <section className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 mt-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Struktur Pengurus Takmir</h3>
                    <p className="text-sm text-gray-500">Masa Bakti: {activePeriod.start_year} - {activePeriod.end_year}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Add Form */}
                <div className="md:col-span-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4">Tambah Pengurus</h4>
                    <form onSubmit={handleAddMember} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Pilih User / Jamaah</label>
                            <select
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                required
                            >
                                <option value="">-- Pilih User --</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.username}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Jabatan</label>
                            <input
                                type="text"
                                value={position}
                                onChange={e => setPosition(e.target.value)}
                                placeholder="Cth: Ketua, Sekretaris, dll"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 flex justify-center items-center gap-2 rounded-md transition-colors text-sm font-medium"
                        >
                            <Plus size={16} /> Tambah
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    {members.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                            <p className="text-sm">Belum ada pengurus yang didaftarkan.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-900">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jabatan</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {members.map(m => {
                                        const user = users.find(u => u.id === m.user_id);
                                        return (
                                            <tr key={m.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                    {m.position}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {user ? user.username : 'User Tidak Ditemukan'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => handleRemoveMember(m.id!)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};
