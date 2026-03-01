import { db } from '../lib/db';
import type { IAsset } from '../types';

export const assetService = {
    async getAllForTenant(tenantId: number) {
        try {
            const data = await db.assets.where('tenant_id').equals(tenantId).toArray();
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async getById(id: number) {
        try {
            const data = await db.assets.get(id);
            return { data, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async createForTenant(tenantId: number, data: Omit<IAsset, 'id' | 'tenant_id'>) {
        try {
            const newId = await db.assets.add({
                ...data,
                tenant_id: tenantId,
                created_at: new Date().toISOString()
            } as IAsset);

            const newRecord = await db.assets.get(newId);
            return { data: newRecord, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async update(id: number, data: Partial<IAsset>) {
        try {
            await db.assets.update(id, data);
            const updated = await db.assets.get(id);
            return { data: updated, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    },

    async delete(id: number) {
        try {
            await db.assets.delete(id);
            return { data: true, error: null };
        } catch (error: any) {
            return { data: null, error: error.message };
        }
    }
};
