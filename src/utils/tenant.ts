import { db } from '../lib/db';
import type { ITenant } from '../types';

export const getTenantFromHost = async (hostUrl: string): Promise<ITenant | null> => {
    try {
        const tenant = await db.tenants.where('host').equals(hostUrl).first();
        return tenant || null;
    } catch (error) {
        console.error('Error in getTenantFromHost:', error);
        return null;
    }
};
