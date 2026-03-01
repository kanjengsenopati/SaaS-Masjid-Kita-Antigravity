import { TenantScopedService } from './BaseService';
import type { ServiceResponse } from './BaseService';
import type { IDonationProgram, IDisbursement } from '../types';

class DonationProgramService extends TenantScopedService<IDonationProgram, number> {
    constructor() { super('donation_programs'); }
}

class DisbursementService extends TenantScopedService<IDisbursement, number> {
    constructor() { super('disbursements'); }

    async getByProgram(tenantId: number, programId: number): Promise<ServiceResponse<IDisbursement[]>> {
        return this.handle(() =>
            this.table
                .where('tenant_id').equals(tenantId)
                .and(disb => disb.program_id === programId)
                .toArray()
        );
    }
}

export const donationProgramService = new DonationProgramService();
export const disbursementService = new DisbursementService();
