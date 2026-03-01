import React, { useState, useEffect } from 'react';
import { useTenant } from '../../tenants/TenantContext';
import { roleService, permissionService } from '../../../services/rbacService';
import type { IRole, IPermission } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Plus, Trash2 } from 'lucide-react';

export const RoleManagement: React.FC = () => {
    const { tenant } = useTenant();
    const [roles, setRoles] = useState<IRole[]>([]);
    const [permissions, setPermissions] = useState<IPermission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Record<number, Set<number>>>({});

    const [newRoleName, setNewRoleName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        if (!tenant) return;

        // 1. Ensure permissions exist
        await permissionService.seedDefaultPermissions();

        // 2. Load Permissions and Roles
        const [permsRes, rolesRes] = await Promise.all([
            permissionService.getAll(),
            roleService.getAllForTenant(tenant.id!)
        ]);

        if (permsRes.data) setPermissions(permsRes.data);
        const loadedRoles = rolesRes.data || [];
        setRoles(loadedRoles);

        // 3. Load Matrix state for each role
        const matrix: Record<number, Set<number>> = {};
        for (const role of loadedRoles) {
            const { data: permIds } = await roleService.getRolePermissions(role.id!);
            matrix[role.id!] = new Set(permIds || []);
        }
        setRolePermissions(matrix);
    };

    useEffect(() => {
        loadData();
    }, [tenant]);

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant || !newRoleName.trim()) return;

        setIsSaving(true);
        await roleService.createForTenant(tenant.id!, { name: newRoleName } as IRole);
        setNewRoleName('');
        setIsSaving(false);
        loadData();
    };

    const handleDeleteRole = async (id: number) => {
        if (!confirm('Hapus role ini? Semua pengguna yang memiliki role ini kehilangan aksesnya.')) return;
        await roleService.delete(id);
        loadData();
    };

    const handleTogglePermission = async (roleId: number, permId: number, currentStatus: boolean) => {
        // Optimistic UI update
        setRolePermissions(prev => {
            const updated = new Set(prev[roleId]);
            if (currentStatus) updated.delete(permId);
            else updated.add(permId);
            return { ...prev, [roleId]: updated };
        });

        // Persist to DB
        await roleService.togglePermission(roleId, permId, !currentStatus);
    };

    if (!tenant) return null;

    // Group permissions by category (module)
    const groupedPermissions = permissions.reduce((acc, perm) => {
        const [module, action] = perm.slug.includes(':') ? perm.slug.split(':') : ['Lainnya', perm.slug];
        if (!acc[module]) acc[module] = [];
        acc[module].push({ ...perm, action });
        return acc;
    }, {} as Record<string, (IPermission & { action: string })[]>);

    const moduleLabels: Record<string, string> = {
        'user': 'Pengguna',
        'role': 'Role & Akses',
        'member': 'Jamaah',
        'finance': 'Keuangan',
        'social': 'Program Sosial',
        'agenda': 'Agenda',
        'asatidz': 'Asatidz',
        'assets': 'Aset',
        'settings': 'Pengaturan',
        'view_dashboard': 'Dashboard'
    };

    const actionLabels: Record<string, string> = {
        'create': 'Tambah',
        'read': 'Lihat',
        'update': 'Ubah',
        'delete': 'Hapus'
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* Create Role Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Manajemen Hak Akses (RBAC)</h3>
                    <p className="text-sm text-gray-500 mb-4">Buat role baru dan atur izin akses (permissions) secara granular di tabel bawah.</p>
                    <form onSubmit={handleCreateRole} className="flex gap-3">
                        <Input
                            placeholder="Nama Role Baru (cth: Bendahara)"
                            value={newRoleName}
                            onChange={e => setNewRoleName(e.target.value)}
                            className="max-w-xs"
                            required
                        />
                        <Button type="submit" disabled={isSaving} className="flex gap-2 whitespace-nowrap shrink-0">
                            <Plus size={16} /> Tambah Role
                        </Button>
                    </form>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden overflow-x-auto">
                {roles.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Belum ada role yang dibuat.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-48 border-r dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">Modul / Fitur</TableHead>
                                {roles.map(role => (
                                    <TableHead key={role.id} className="text-center min-w-[320px]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <span className="font-bold text-gray-900 dark:text-white">{role.name}</span>
                                            <button
                                                onClick={() => handleDeleteRole(role.id!)}
                                                className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1 font-medium p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 size={12} /> Hapus Role
                                            </button>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Object.entries(groupedPermissions).map(([moduleKey, perms]) => (
                                <TableRow key={moduleKey} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 transition-colors">
                                    <TableCell className="border-r dark:border-gray-700 py-4">
                                        <div className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                                            {moduleLabels[moduleKey] || moduleKey}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-tighter">Izin CRUD</div>
                                    </TableCell>

                                    {roles.map(role => (
                                        <TableCell key={`${role.id}-${moduleKey}`} className="py-2 px-1">
                                            <div className="flex justify-center gap-1.5 mx-auto">
                                                {/* Re-order perms to Create, Read, Update, Delete */}
                                                {['create', 'read', 'update', 'delete'].map(actionKey => {
                                                    const p = perms.find(perm => perm.action === actionKey);
                                                    if (!p) return <div key={actionKey} className="w-6" />; // Fixed width spacer

                                                    const hasPerm = rolePermissions[role.id!]?.has(p.id!);
                                                    const actionChar = actionKey === 'create' ? 'T' : actionKey === 'read' ? 'L' : actionKey === 'update' ? 'U' : 'H';

                                                    // High density colors
                                                    const actionColorClass = hasPerm
                                                        ? (actionKey === 'create' ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                            : actionKey === 'read' ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                                                : actionKey === 'update' ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                                                                    : 'bg-red-500 border-red-500 text-white shadow-sm')
                                                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-300';

                                                    return (
                                                        <label key={p.id} className="flex flex-col items-center gap-0.5 cursor-pointer group" title={p.description}>
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={hasPerm || false}
                                                                onChange={() => handleTogglePermission(role.id!, p.id!, hasPerm || false)}
                                                            />
                                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border ${actionColorClass} active:scale-95 group-hover:brightness-110`}>
                                                                <span className="text-[10px] font-black leading-none">{actionChar}</span>
                                                            </div>
                                                            <span className={`text-[8px] font-bold uppercase tracking-tighter leading-none ${hasPerm ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                                                                {actionLabels[actionKey]}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
};
