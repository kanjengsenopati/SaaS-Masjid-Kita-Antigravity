import { TenantScopedService } from './BaseService';
import type { ServiceResponse } from './BaseService';
import type { IMember, ITag } from '../types';
import { db } from '../lib/db';

export class MemberService extends TenantScopedService<IMember, number> {
    constructor() {
        super('members');
    }

    // Example of a specialized query
    async getMustahik(tenantId: number): Promise<ServiceResponse<IMember[]>> {
        return this.handle(() =>
            this.table
                .where('tenant_id').equals(tenantId)
                .and(member => member.is_mustahik === true)
                .toArray()
        );
    }

    // Tags Management
    async addTagToMember(memberId: number, tagId: number): Promise<ServiceResponse<void>> {
        return this.handle(async () => {
            await db.member_tags.put({ member_id: memberId, tag_id: tagId });
        });
    }

    async getMemberTags(memberId: number): Promise<ServiceResponse<ITag[]>> {
        return this.handle(async () => {
            const links = await db.member_tags.where('member_id').equals(memberId).toArray();
            const tagIds = links.map(l => l.tag_id);
            return db.tags.where('id').anyOf(tagIds).toArray();
        });
    }
}

export const memberService = new MemberService();
