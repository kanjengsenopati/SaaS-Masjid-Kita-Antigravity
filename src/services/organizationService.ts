import { TenantScopedService } from './BaseService';
import type { ServiceResponse } from './BaseService';
import type { IFoundation, IManagementPeriod, ITakmirMember } from '../types';

class FoundationService extends TenantScopedService<IFoundation, number> {
    constructor() { super('foundations'); }
}

class ManagementPeriodService extends TenantScopedService<IManagementPeriod, number> {
    constructor() { super('management_periods'); }

    async getActivePeriod(tenantId: number): Promise<ServiceResponse<IManagementPeriod | undefined>> {
        return this.handle(() =>
            this.table
                .where('tenant_id').equals(tenantId)
                .and(period => period.is_active === true)
                .first()
        );
    }

    // Alias as requested by requirements
    async getCurrentActivePeriod(tenantId: number): Promise<ServiceResponse<IManagementPeriod | undefined>> {
        return this.getActivePeriod(tenantId);
    }
}

class TakmirMemberService extends TenantScopedService<ITakmirMember, number> {
    constructor() { super('takmir_members'); }

    async getMembersByPeriod(tenantId: number, periodId: number): Promise<ServiceResponse<ITakmirMember[]>> {
        return this.handle(() =>
            this.table
                .where('tenant_id').equals(tenantId)
                .and(member => member.period_id === periodId)
                .toArray()
        );
    }
}

export const foundationService = new FoundationService();
export const managementPeriodService = new ManagementPeriodService();
export const takmirMemberService = new TakmirMemberService();
