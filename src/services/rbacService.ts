import { TenantScopedService, BaseService } from './BaseService';
import type { ServiceResponse } from './BaseService';
import type { IUser, IRole, IPermission } from '../types';
import { db } from '../lib/db';

class UserService extends TenantScopedService<IUser, number> {
    constructor() { super('users'); }

    async login(username: string, password?: string): Promise<ServiceResponse<IUser>> {
        return this.handle(async () => {
            const user = await db.users.where('username').equals(username).first();
            if (!user) throw new Error('Username tidak ditemukan');

            if (user.password && user.password !== password) {
                throw new Error('Password salah');
            }

            return user;
        });
    }

    async seedInitialAdmin(tenantId: number): Promise<ServiceResponse<IUser>> {
        return this.handle(async () => {
            const count = await this.table.count();
            if (count > 0) return (await this.table.toCollection().first())!;

            let role = await db.roles.where('tenant_id').equals(tenantId).first();
            if (!role) {
                const roleId = await db.roles.add({
                    tenant_id: tenantId,
                    name: 'Super Admin',
                    description: 'Akses penuh ke seluruh sistem'
                } as IRole);
                role = (await db.roles.get(roleId))!;

                const allPerms = await db.permissions.toArray();
                await db.role_permissions.bulkAdd(allPerms.map(p => ({
                    role_id: roleId,
                    permission_id: p.id!
                })));
            }

            const adminUser: IUser = {
                tenant_id: tenantId,
                username: 'admin',
                password: 'admin',
                role_id: role.id!,
                email: 'admin@masjid.com'
            };

            await this.table.add(adminUser);
            return adminUser;
        });
    }
}

class RoleService extends TenantScopedService<IRole, number> {
    constructor() { super('roles'); }

    async getRolePermissions(roleId: number): Promise<ServiceResponse<number[]>> {
        return this.handle(async () => {
            const rolePerms = await db.role_permissions.where('role_id').equals(roleId).toArray();
            return rolePerms.map(rp => rp.permission_id);
        });
    }

    async togglePermission(roleId: number, permissionId: number, enable: boolean): Promise<ServiceResponse<void>> {
        return this.handle(async () => {
            if (enable) {
                await db.role_permissions.put({ role_id: roleId, permission_id: permissionId });
            } else {
                await db.role_permissions.where({ role_id: roleId, permission_id: permissionId }).delete();
            }
        });
    }

    async can(roleId: number, permissionSlug: string): Promise<boolean> {
        const permission = await db.permissions.where('slug').equals(permissionSlug).first();
        if (!permission) return false;
        const rp = await db.role_permissions.where({ role_id: roleId, permission_id: permission.id }).first();
        return !!rp;
    }
}

class PermissionService extends BaseService<IPermission, number> {
    constructor() { super('permissions'); }

    async seedDefaultPermissions(): Promise<ServiceResponse<void>> {
        return this.handle(async () => {
            const modules = [
                { id: 'user', label: 'Pengguna' },
                { id: 'role', label: 'Role & Akses' },
                { id: 'member', label: 'Jamaah' },
                { id: 'finance', label: 'Keuangan' },
                { id: 'social', label: 'Program Sosial' },
                { id: 'agenda', label: 'Agenda' },
                { id: 'asatidz', label: 'Asatidz' },
                { id: 'assets', label: 'Aset' },
                { id: 'settings', label: 'Pengaturan' }
            ];

            const actions = [
                { id: 'create', label: 'Tambah' },
                { id: 'read', label: 'Lihat' },
                { id: 'update', label: 'Ubah' },
                { id: 'delete', label: 'Hapus' }
            ];

            const defaultPermissions: IPermission[] = [];

            modules.forEach(m => {
                actions.forEach(a => {
                    defaultPermissions.push({
                        slug: `${m.id}:${a.id}`,
                        description: `${a.label} ${m.label}`
                    });
                });
            });

            defaultPermissions.push({ slug: 'view_dashboard', description: 'Lihat Ringkasan Dashboard' });

            const count = await this.table.count();
            if (count === 0) {
                await this.table.bulkAdd(defaultPermissions);
            } else {
                const existing = await this.table.toArray();
                const existingSlugs = new Set(existing.map(p => p.slug));

                const legacySlugs = ['manage_users', 'manage_roles', 'manage_congregation', 'manage_finance', 'manage_settings'];
                const legacyPerms = existing.filter(p => legacySlugs.includes(p.slug));
                if (legacyPerms.length > 0) {
                    const legacyIds = legacyPerms.map(p => p.id!);
                    await this.table.bulkDelete(legacyIds);
                    for (const pid of legacyIds) {
                        await db.role_permissions.where('permission_id').equals(pid).delete();
                    }
                }

                const newPerms = defaultPermissions.filter(p => !existingSlugs.has(p.slug));
                if (newPerms.length > 0) {
                    await this.table.bulkAdd(newPerms);
                }
            }
        });
    }

    async getAll(): Promise<ServiceResponse<IPermission[]>> {
        return this.handle(() => this.table.toArray());
    }
}

export const userService = new UserService();
export const roleService = new RoleService();
export const permissionService = new PermissionService();
