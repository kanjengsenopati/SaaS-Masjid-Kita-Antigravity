import type { IDonatur } from '../types';
import { TenantScopedService } from './BaseService';

class DonationService extends TenantScopedService<IDonatur> {
    constructor() {
        super('donations');
    }

    async getByAgendaId(agendaId: number) {
        return this.handle(() =>
            this.table.where('agenda_id').equals(agendaId).toArray()
        );
    }

    async getByProgramId(programId: number) {
        return this.handle(() =>
            this.table.where('program_id').equals(programId).toArray()
        );
    }
}

export const donationService = new DonationService();
