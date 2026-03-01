// Base Entities
export interface ITenant {
    id?: number;
    tenant_code?: string; // YYYYMMDD-XXX format
    name: string;
    logo?: string;
    primaryColor: string;
    host: string;
    slug: string;
    plan?: 'LITE' | 'PRO' | 'ENTERPRISE';
    package_id?: number; // Link to IPackage
    billing_cycle?: 'monthly' | 'yearly';
    expires_at?: string;
    goldPrice: number;
    infaqEnabled: boolean;
    waqafEnabled: boolean;
    qurbanEnabled: boolean;
    santunanEnabled: boolean;
    affiliate_id?: number; // Referred by IAffiliate
    is_blocked?: boolean; // For subscription status
    createdAt?: string;
}

export interface IUser {
    id?: number;
    tenant_id: number;
    username: string;
    email?: string;
    phone_number?: string;
    password?: string;
    role_id: number;
    avatar_base64?: string;
    createdAt?: string;
}

export interface IRole {
    id?: number;
    tenant_id: number;
    name: string;
    createdAt?: string;
}

export interface IPermission {
    id?: number;
    slug: string;
    description: string;
}

export interface IRolePermission {
    role_id: number;
    permission_id: number;
}

export interface IAuditLog {
    id?: number;
    tenant_id: number;
    action: string;
    timestamp: string;
    user_id?: number;
}

// Organization & Legal
export interface IFoundation {
    id?: number;
    tenant_id: number;
    name: string;
    address: string;
    legal_doc_number: string;
}

export interface IManagementPeriod {
    id?: number;
    tenant_id: number;
    start_year: number;
    end_year: number;
    is_active: boolean;
}

export interface ITakmirMember {
    id?: number;
    tenant_id: number;
    period_id: number;
    user_id: number;
    position: string;
}

// Congregation Management
export interface IMember {
    id?: number;
    tenant_id: number;
    user_id?: number;
    name: string;
    birth_date?: string;
    address?: string;
    phone_number?: string;
    economic_status?: string;
    is_mustahik: boolean;
    mustahik_category?: string;
    occupation?: string;
}

export interface ITag {
    id?: number;
    tenant_id: number;
    name: string;
    color_hex: string;
}

export interface IMemberTag {
    member_id: number;
    tag_id: number;
}

// Social & Santunan
export interface IDonationProgram {
    id?: number;
    tenant_id: number;
    name: string;
    description?: string;
    target_amount?: number;
    current_amount?: number; // Track collected funds
    is_active?: boolean; // NEW: Track if the program is Aktif / Selesai
    funding_source?: 'KAS_MASJID' | 'GALANG_DONASI';
    transaction_id?: number; // Linked expense if Kas Masjid
}

export interface IDonatur {
    id?: number;
    tenant_id: number;
    agenda_id?: number;
    program_id?: number;
    name: string;
    amount: number;
    date: string;
}

export interface IDisbursement {
    id?: number;
    tenant_id: number;
    program_id: number;
    member_id: number;
    amount: number;
    disbursed_at: string;
    notes?: string;
    proof_base64?: string; // Optional Proof Image
}

// Finance Module
export type TransactionType = 'INCOME' | 'EXPENSE';

export interface ITransactionCategory {
    id?: number;
    tenant_id: number;
    name: string;
    type: TransactionType;
}

export interface ITransaction {
    id?: number;
    tenant_id: number;
    category_id: number;
    amount: number;
    type: TransactionType;
    date: string; // ISO Date "YYYY-MM-DD"
    description?: string;
    proof_base64?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// Agenda & Kegiatan
export interface IAsatidz {
    id?: number;
    tenant_id: number;
    name: string;
    phone_number?: string;
    specialization?: string; // e.g. "Fiqih", "Tafsir", "Sirah"
    biography?: string;
    photo_base64?: string; // Optional Photo
    created_at: string;
}

export interface IAgenda {
    id?: number;
    tenant_id: number;
    title: string;
    description: string;
    start_date: string;
    end_date?: string;
    asatidz_id?: number; // Optional link to Pemateri/Ustadz
    document_base64?: string; // Storing the file directly locally
    document_name?: string;
    is_fundraising_open: boolean;
    target_amount?: number;
    current_amount?: number;     // Track collected funds
    show_progress_public?: boolean;  // Toggle visibility for Jamaah
    show_progress_admin?: boolean;   // Toggle visibility for Pengurus
    funding_source?: 'KAS_MASJID' | 'GALANG_DONASI';
    transaction_id?: number; // Linked expense if Kas Masjid
    created_at: string;
}

// Aset Masjid (Inventory)
export interface IAsset {
    id?: number;
    tenant_id: number;
    name: string;             // Nama Aset
    category: string;         // Kategori (e.g., "Elektronik", "Kendaraan")
    quantity: number;         // Jumlah unit
    condition: string;        // Kondisi ("Baik", "Rusak Ringan", "Rusak Berat")
    acquisition_date: string; // Tanggal Perolehan (YYYY-MM-DD)
    acquisition_cost?: number;// Nilai Perolehan / Harga (Opsional)
    source: string;           // Sumber ("Pembelian", "Wakaf", "Hibah", dll)
    location?: string;        // Lokasi Penyimpanan
    notes?: string;           // Keterangan tambahan
    photo_base64?: string;    // Foto Aset (Opsional)
    created_at: string;
}

// ----------------------------------------------------
// SaaS Platform & Internal Administration Entities (PostgreSQL Relational Structure)
// ----------------------------------------------------

export interface IInternalAdmin {
    id?: number;
    name: string;
    email: string;
    password?: string;
    internal_role_id: number; // FK to IInternalRole
    created_at?: string;
    updated_at?: string;
}

export interface IInternalRole {
    id?: number;
    name: string; // e.g., 'Super Admin', 'Finance', 'Support'
    created_at?: string;
}

export interface IInternalPermission {
    id?: number;
    slug: string; // e.g., 'manage_tenants', 'view_reports', 'manage_affiliates'
    description: string;
}

export interface IInternalRolePermission {
    internal_role_id: number;
    internal_permission_id: number;
}

export interface ISubscription {
    id?: number;
    tenant_id: number; // FK to ITenant
    plan_name: 'LITE' | 'PRO' | 'ENTERPRISE';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';
    amount: number;
    start_date: string;
    end_date: string;
    payment_proof?: string;
    created_at?: string;
    updated_at?: string;
}

export interface IAffiliate {
    id?: number;
    name: string;
    email: string;
    phone_number?: string;
    referral_code: string; // Unique code
    balance: number;
    bank_name?: string;
    bank_account_number?: string;
    bank_account_name?: string;
    commission_rate?: number;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
    total_earned?: number;
    total_withdrawn?: number;
    created_at?: string;
    updated_at?: string;
}

export interface IAffiliateWithdrawal {
    id?: number;
    affiliate_id: number;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    bank_info?: string; // e.g. "BCA 1234567890 a/n John Doe"
    processed_at?: string;
    created_at: string;
}

export interface ICommission {
    id?: number;
    affiliate_id: number; // FK to IAffiliate
    tenant_id: number; // Referred tenant
    subscription_id: number; // Linking back to the specific subscription payment
    amount: number;
    status: 'PENDING' | 'PAID' | 'REJECTED';
    processed_at?: string;
    created_at?: string;
}

export interface IModule {
    id?: number;
    name: string; // e.g., 'Finance', 'Congregation', 'Social', 'Agenda', 'Assets', 'Asatidz', 'Digital Signage'
    slug: string; // e.g., 'finance', 'congregation', 'social', 'agenda', 'assets', 'asatidz', 'signage'
    description?: string;
    created_at: string;
}

export interface IPackage {
    id?: number;
    name: string; // e.g., 'Lite', 'Pro', 'Enterprise'
    slug: string; // E.g. 'lite'
    description?: string;
    monthlyPrice: number;
    yearlyPrice: number;
    is_active: boolean;
    is_popular: boolean;
    created_at: string;
}

export interface IPackageModule {
    package_id: number;
    module_id: number;
}

export interface IPlatformSettings {
    id?: number;
    platform_name: string;
    support_email: string;
    is_maintenance_mode: boolean;
    lite_plan_quota: number;
    pro_plan_price: number;
    commission_rate_default: number;
    updated_at: string;
}

export interface ISystemAuditLog {
    id?: number;
    admin_id: number; // FK to IInternalAdmin
    action: string;
    target_id?: string | number; // ID of the referenced object (Tenant ID, Affiliate ID, etc.)
    details?: string; // JSON string or human readable specifics
    created_at: string;
}
