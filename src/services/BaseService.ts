import { db, MosqueDB } from '../lib/db';
import type { Table } from 'dexie';

export interface ServiceResponse<T> {
    data: T | null;
    error: string | null;
}

export abstract class BaseService<T, K = number> {
    protected table: Table<T, K>;
    protected dbInstance: MosqueDB;

    constructor(tableName: keyof MosqueDB) {
        this.dbInstance = db;
        // @ts-ignore - Dexie types are strict about table access
        this.table = db[tableName];
    }

    // Common wrapper for error handling
    protected async handle<R>(operation: () => Promise<R>): Promise<ServiceResponse<R>> {
        try {
            const data = await operation();
            return { data, error: null };
        } catch (err: any) {
            console.error(`Service Error [${this.table.name}]:`, err);
            return { data: null, error: err.message || 'An unexpected error occurred' };
        }
    }

    // Base Methods
    async getById(id: K): Promise<ServiceResponse<T | undefined>> {
        return this.handle(() => this.table.get(id));
    }

    async getAll(): Promise<ServiceResponse<T[]>> {
        return this.handle(() => this.table.toArray());
    }

    async create(data: T): Promise<ServiceResponse<K>> {
        return this.handle(() => this.table.add(data));
    }

    async update(id: K, data: Partial<T>): Promise<ServiceResponse<number>> {
        return this.handle(() => this.table.update(id, data as any));
    }

    async delete(id: K): Promise<ServiceResponse<void>> {
        return this.handle(() => this.table.delete(id));
    }
}

// Specialized BaseService for Tenant-scoped entities
export abstract class TenantScopedService<T extends { tenant_id: number }, K = number> extends BaseService<T, K> {

    async getAllForTenant(tenantId: number): Promise<ServiceResponse<T[]>> {
        return this.handle(() => this.table.where('tenant_id').equals(tenantId).toArray());
    }

    // Create interceptor to ensure tenant_id is always present although TS should catch this
    async createForTenant(tenantId: number, data: Omit<T, 'tenant_id'>): Promise<ServiceResponse<K>> {
        const fullData = { ...data, tenant_id: tenantId } as unknown as T;
        return this.handle(() => this.table.add(fullData));
    }
}
