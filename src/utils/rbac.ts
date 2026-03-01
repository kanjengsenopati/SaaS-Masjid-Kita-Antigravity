import { db } from '../lib/db';

export const can = async (roleId: number, permissionSlug: string): Promise<boolean> => {
    try {
        // 1. Find the permission ID by slug
        const permission = await db.permissions.where('slug').equals(permissionSlug).first();
        if (!permission || !permission.id) {
            return false;
        }

        // 2. Check if there's a mapping in role_permissions
        // Dexie compound index lookups can be simplified like this:
        const rolePermission = await db.role_permissions
            .where('[role_id+permission_id]')
            .equals([roleId, permission.id])
            .first();

        return !!rolePermission;
    } catch (error) {
        console.error('Error in RBAC can():', error);
        return false;
    }
};
