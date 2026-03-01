import React, { useState, useEffect } from 'react';
import { useTenant } from '../../tenants/TenantContext';
import { userService, roleService } from '../../../services/rbacService';
import type { IUser, IRole } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Modal } from '../../../components/ui/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
    const { tenant } = useTenant();
    const [users, setUsers] = useState<IUser[]>([]);
    const [roles, setRoles] = useState<IRole[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<IUser>>({});
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        if (!tenant) return;
        const [usersRes, rolesRes] = await Promise.all([
            userService.getAllForTenant(tenant.id!),
            roleService.getAllForTenant(tenant.id!)
        ]);

        if (usersRes.data) setUsers(usersRes.data);
        if (rolesRes.data) setRoles(rolesRes.data);
    };

    useEffect(() => {
        loadData();
    }, [tenant]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant || !formData.username || !formData.role_id) return;

        setIsSaving(true);
        if (formData.id) {
            await userService.update(formData.id, formData);
        } else {
            await userService.createForTenant(tenant.id!, {
                username: formData.username,
                email: formData.email,
                phone_number: formData.phone_number,
                password: formData.password,
                role_id: Number(formData.role_id)
            } as IUser);
        }
        setIsSaving(false);
        setIsModalOpen(false);
        loadData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus pengguna ini?')) return;
        await userService.delete(id);
        loadData();
    };

    const openForm = (user?: IUser) => {
        setFormData(user ? { ...user } : { username: '', email: '', phone_number: '', password: '', role_id: '' as any });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Pengguna Sistem</h3>
                    <p className="text-sm text-gray-500">Kelola akun dan peran pengguna untuk masjid ini.</p>
                </div>
                <Button onClick={() => openForm()} className="flex items-center gap-2 whitespace-nowrap shrink-0">
                    <Plus size={18} /> Tambah Pengguna
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Kontak</TableHead>
                            <TableHead>Role Akses</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500 h-32">
                                    Belum ada pengguna terdaftar.
                                </TableCell>
                            </TableRow>
                        ) : users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{user.username}</span>
                                        <span className="text-[10px] text-gray-400">{user.email || '-'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{user.phone_number || '-'}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full font-medium">
                                        {roles.find(r => r.id === user.role_id)?.name || 'Role Invalid'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <button onClick={() => openForm(user)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(user.id!)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={16} /></button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Pengguna" : "Tambah Pengguna Baru"}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username</label>
                            <Input
                                required
                                value={formData.username || ''}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                placeholder="nama_pengguna"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role (Peran)</label>
                            <Select
                                required
                                value={formData.role_id || ''}
                                onChange={e => setFormData({ ...formData, role_id: Number(e.target.value) })}
                            >
                                <option value="">Pilih Role...</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="admin@masjid.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">No. WhatsApp</label>
                        <Input
                            value={formData.phone_number || ''}
                            onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                            placeholder="08123456789"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            {formData.id ? "Password (Kosongkan jika tidak diubah)" : "Password"}
                        </label>
                        <Input
                            type="password"
                            required={!formData.id}
                            value={formData.password || ''}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            placeholder="********"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isSaving}>Simpan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
