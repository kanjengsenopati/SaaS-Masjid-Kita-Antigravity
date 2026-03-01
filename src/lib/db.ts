import Dexie, { type Table } from 'dexie';
import type {
    ITenant,
    IUser,
    IRole,
    IPermission,
    IRolePermission,
    IAuditLog,
    IFoundation,
    IManagementPeriod,
    ITakmirMember,
    IMember,
    ITag,
    IMemberTag,
    IDonationProgram,
    IDisbursement,
    ITransactionCategory,
    ITransaction,
    IAgenda,
    IAsatidz,
    IAsset,
    IDonatur,
    IInternalAdmin,
    IInternalRole,
    IInternalPermission,
    IInternalRolePermission,
    ISubscription,
    IAffiliate,
    IAffiliateWithdrawal,
    ICommission,
    ISystemAuditLog,
    IPlatformSettings,
    IModule,
    IPackage,
    IPackageModule
} from '../types';

export class MosqueDB extends Dexie {
    tenants!: Table<ITenant, number>;
    users!: Table<IUser, number>;
    roles!: Table<IRole, number>;
    permissions!: Table<IPermission, number>;
    role_permissions!: Table<IRolePermission, [number, number]>;
    audit_logs!: Table<IAuditLog, number>;
    foundations!: Table<IFoundation, number>;
    management_periods!: Table<IManagementPeriod, number>;
    takmir_members!: Table<ITakmirMember, number>;
    members!: Table<IMember, number>;
    tags!: Table<ITag, number>;
    member_tags!: Table<IMemberTag, [number, number]>;
    donation_programs!: Table<IDonationProgram, number>;
    disbursements!: Table<IDisbursement, number>;
    transaction_categories!: Table<ITransactionCategory, number>;
    transactions!: Table<ITransaction, number>;
    agendas!: Table<IAgenda, number>;
    asatidz!: Table<IAsatidz, number>;
    assets!: Table<IAsset, number>;

    donations!: Table<IDonatur, number>;

    // SaaS Core & Affiliates
    internal_admins!: Table<IInternalAdmin, number>;
    internal_roles!: Table<IInternalRole, number>;
    internal_permissions!: Table<IInternalPermission, number>;
    internal_role_permissions!: Table<IInternalRolePermission, [number, number]>;
    subscriptions!: Table<ISubscription, number>;
    affiliates!: Table<IAffiliate, number>;
    affiliate_withdrawals!: Table<IAffiliateWithdrawal, number>;
    commissions!: Table<ICommission, number>;
    system_audit_logs!: Table<ISystemAuditLog, number>;
    platform_settings!: Table<IPlatformSettings, number>;
    modules!: Table<IModule, number>;
    packages!: Table<IPackage, number>;
    package_modules!: Table<IPackageModule, [number, number]>;

    constructor() {
        super('MosqueAppDB');

        this.version(1).stores({
            tenants: '++id, host, name',
            users: '++id, tenant_id, username, role_id',
            roles: '++id, tenant_id, name',
            permissions: '++id, slug', // Global permissions don't strictly need tenant_id but good for indexing
            role_permissions: '[role_id+permission_id], role_id, permission_id',
            audit_logs: '++id, tenant_id, action, timestamp',
            foundations: '++id, tenant_id, name',
            management_periods: '++id, tenant_id, is_active, start_year',
            takmir_members: '++id, tenant_id, period_id, user_id',
            members: '++id, tenant_id, name, is_mustahik, economic_status',
            tags: '++id, tenant_id, name',
            member_tags: '[member_id+tag_id], member_id, tag_id',
            donation_programs: '++id, tenant_id, name',
            disbursements: '++id, tenant_id, program_id, member_id, disbursed_at',
        });

        this.version(2).stores({
            transaction_categories: '++id, tenant_id, type, name',
            transactions: '++id, tenant_id, category_id, type, date'
        });

        this.version(3).stores({
            agendas: '++id, tenant_id, start_date'
        });

        // Version 4 adds current_amount, show_progress_admin, show_progress_public to agendas
        // Dexie will automatically upgrade objects gracefully as we only need to bump it when
        // dealing with Indexed properties. We do this to force a soft-trigger if needed.
        this.version(4).upgrade(tr => {
            return tr.table('agendas').toCollection().modify(agenda => {
                if (agenda.show_progress_public === undefined) agenda.show_progress_public = false;
                if (agenda.show_progress_admin === undefined) agenda.show_progress_admin = false;
                if (agenda.current_amount === undefined) agenda.current_amount = 0;
            });
        });

        // Version 5 adds Asatidz and relational links
        this.version(5).stores({
            asatidz: '++id, tenant_id, name',
            agendas: '++id, tenant_id, start_date, asatidz_id'
        });

        // Version 6 adds is_active to donation_programs
        this.version(6).upgrade(tr => {
            return tr.table('donation_programs').toCollection().modify(program => {
                if (program.is_active === undefined) program.is_active = true;
            });
        });

        // Version 7 adds Aset Masjid (Assets)
        this.version(7).stores({
            assets: '++id, tenant_id, name, category, condition'
        });
        // Version 8 adds email and phone_number to users for better management
        this.version(8).stores({
            users: '++id, tenant_id, username, email, phone_number, role_id'
        });

        // Version 9 adds donations table
        this.version(9).stores({
            donations: '++id, tenant_id, agenda_id, program_id, name, date'
        });

        // Version 10 adds status to transactions
        this.version(10).stores({
            transactions: '++id, tenant_id, category_id, type, date, status'
        }).upgrade(tr => {
            return tr.table('transactions').toCollection().modify(tx => {
                if (!tx.status) tx.status = 'APPROVED';
            });
        });

        // Version 11 adds slug to tenants
        this.version(11).stores({
            tenants: '++id, host, slug'
        }).upgrade(tr => {
            return tr.table('tenants').toCollection().modify(tenant => {
                if (!tenant.slug) {
                    // Generate a simple slug from name if not present
                    tenant.slug = tenant.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                }
            });
        });

        // Version 12 adds plan and expires_at to tenants
        this.version(12).stores({
            tenants: '++id, host, slug, plan'
        }).upgrade(tr => {
            return tr.table('tenants').toCollection().modify(tenant => {
                if (!tenant.plan) tenant.plan = 'PRO';
            });
        });

        // Version 13 adds SaaS Core Tables (Admins, Affiliates, Subscriptions, Commissions)
        this.version(13).stores({
            internal_admins: '++id, email, internal_role_id',
            internal_roles: '++id, name',
            internal_permissions: '++id, slug',
            internal_role_permissions: '[internal_role_id+internal_permission_id], internal_role_id, internal_permission_id',
            subscriptions: '++id, tenant_id, status',
            affiliates: '++id, email, referral_code, status',
            commissions: '++id, affiliate_id, tenant_id, status'
        });

        // Version 14 adds System Audit Logs
        this.version(14).stores({
            system_audit_logs: '++id, admin_id, action, created_at'
        });

        // Version 15 adds Platform Settings
        this.version(15).stores({
            platform_settings: '++id'
        });

        // Version 16 adds Packages and Modules
        this.version(16).stores({
            modules: '++id, slug',
            packages: '++id, slug',
            package_modules: '[package_id+module_id], package_id, module_id'
        });

        // Version 17 adds Affiliate Withdrawals and Tenant referral tracking
        this.version(17).stores({
            affiliate_withdrawals: '++id, affiliate_id, status',
            tenants: '++id, host, slug, plan, affiliate_id'
        });

        // Version 18 adds Billing Cycle to tenants
        this.version(18).stores({
            tenants: '++id, host, slug, plan, affiliate_id, billing_cycle'
        });

        // Version 19 adds is_blocked to tenants
        this.version(19).stores({
            tenants: '++id, host, slug, plan, affiliate_id, billing_cycle, is_blocked'
        });
    }
}

export const db = new MosqueDB();
