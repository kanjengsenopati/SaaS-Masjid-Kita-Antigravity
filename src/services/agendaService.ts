import { TenantScopedService } from './BaseService';
import type { IAgenda } from '../types';

class AgendaService extends TenantScopedService<IAgenda, number> {
    constructor() { super('agendas'); }

    // Helper to get active/upcoming agendas
    async getUpcomingAgendas(tenantId: number) {
        return this.handle(async () => {
            const today = new Date().toISOString().split('T')[0];
            const all = await this.table.where('tenant_id').equals(tenantId).toArray();

            // Filter agendas where start_date is today or in the future
            // OR where end_date is present and is today or in the future
            return all.filter(a => {
                if (a.end_date && a.end_date >= today) return true;
                return a.start_date >= today;
            }).sort((a, b) => a.start_date.localeCompare(b.start_date));
        });
    }
}

export const agendaService = new AgendaService();
