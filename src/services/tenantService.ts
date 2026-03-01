import { BaseService } from './BaseService';
import type { ITenant } from '../types';

// ITenant is not tenant-scoped itself, it IS the tenant definition. So we use BaseService.
class TenantService extends BaseService<ITenant, number> {
    constructor() { super('tenants'); }

    async getByHost(host: string) {
        return this.handle(() => this.table.where('host').equals(host).first());
    }

    async getBySlug(slug: string) {
        return this.handle(() => this.table.where('slug').equals(slug).first());
    }
}

export const tenantService = new TenantService();
