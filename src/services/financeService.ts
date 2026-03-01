import { TenantScopedService } from './BaseService';
import type { ITransactionCategory, ITransaction } from '../types';

class TransactionCategoryService extends TenantScopedService<ITransactionCategory, number> {
    constructor() { super('transaction_categories'); }

    // Override generic get all to optionally filter by IN / OUT type
    async getAllForTenant(tenantId: number, type?: 'INCOME' | 'EXPENSE') {
        return this.handle(async () => {
            let collection = this.table.where('tenant_id').equals(tenantId);
            if (type) {
                // Secondary filtering if type provided
                const all = await collection.toArray();
                return all.filter(c => c.type === type);
            }
            return collection.toArray();
        });
    }
}

class TransactionService extends TenantScopedService<ITransaction, number> {
    constructor() { super('transactions'); }

    // Helper to get all transactions in a specific date range
    async getTransactionsInDateRange(tenantId: number, startDate: string, endDate: string) {
        return this.handle(async () => {
            const allTxs = await this.table.where('tenant_id').equals(tenantId).toArray();
            return allTxs.filter(tx => tx.date >= startDate && tx.date <= endDate).sort((a, b) => b.date.localeCompare(a.date));
        });
    }
}

export const transactionCategoryService = new TransactionCategoryService();
export const transactionService = new TransactionService();
