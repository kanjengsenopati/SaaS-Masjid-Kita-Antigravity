import { db } from '../lib/db';
import type { IAsatidz } from '../types';

export const asatidzService = {
    async getAllForTenant(tenantId: number) {
        try {
            const data = await db.asatidz.where('tenant_id').equals(tenantId).toArray();
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async getById(id: number) {
        try {
            const data = await db.asatidz.get(id);
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async createForTenant(tenantId: number, asatidz: Omit<IAsatidz, 'id' | 'tenant_id'>) {
        try {
            const id = await db.asatidz.add({
                ...asatidz,
                tenant_id: tenantId,
            } as IAsatidz);
            return { data: id, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async update(id: number, updates: Partial<IAsatidz>) {
        try {
            await db.asatidz.update(id, updates);
            return { data: true, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async delete(id: number) {
        try {
            await db.asatidz.delete(id);
            return { data: true, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }
};
