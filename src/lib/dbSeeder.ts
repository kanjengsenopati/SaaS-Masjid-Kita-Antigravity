import { db } from './db';
import type { ITenant, IUser, IRole, IFoundation, IManagementPeriod, ITakmirMember, IAsset, IAsatidz, IAgenda, IMember, IDonationProgram, IDisbursement, IPlatformSettings, IModule, IPackage } from '../types';

export async function seedDatabase() {
    try {
        const tenantCount = await db.table('tenants').count();
        if (tenantCount === 0) {
            console.log('Seeding Database with integrated Mosque Data...');

            // 1. Tenants, Roles, Users
            const tenantId = await db.tenants.add({
                name: 'Masjid Raya Al-Bina',
                host: window.location.host,
                slug: 'masjid-raya-al-bina',
                plan: 'PRO',
                billing_cycle: 'yearly',
                primaryColor: '#10b981', // Emerald
                goldPrice: 1500000,
                infaqEnabled: true,
                waqafEnabled: true,
                qurbanEnabled: true,
                santunanEnabled: true,
                createdAt: new Date().toISOString()
            } as ITenant);

            const roleId = await db.roles.add({ tenant_id: tenantId, name: 'Super Admin', createdAt: new Date().toISOString() } as IRole);

            await db.users.add({
                tenant_id: tenantId,
                username: 'admin',
                role_id: roleId,
                createdAt: new Date().toISOString()
            } as IUser);

            // 2. Organization & Takmir
            await db.foundations.add({
                tenant_id: tenantId,
                name: 'Yayasan Al-Bina Utama',
                address: 'Jl. Merdeka Raya No 1, Jakarta',
                legal_doc_number: 'AHU-1234.56.78.2026'
            } as IFoundation);

            const periodId = await db.management_periods.add({
                tenant_id: tenantId,
                start_year: 2024,
                end_year: 2028,
                is_active: true
            } as IManagementPeriod);

            await db.takmir_members.add({
                tenant_id: tenantId,
                period_id: periodId,
                user_id: 1, // Linking back to admin
                position: 'Ketua Takmir'
            } as ITakmirMember);

            // 3. Jamaah & Mustahik
            const memberIds = [];
            const jamaahNames = ['Ahmad Syarif', 'Budi Santoso', 'Cecep Supriadi', 'Dewi Lestari', 'Eko Purnomo', 'Fatimah Az-Zahra', 'Gatot Subroto', 'Siti Aminah', 'Rudi Hartono', 'Nurhayati'];

            for (let i = 0; i < jamaahNames.length; i++) {
                const isMustahik = i > 6; // Last 3 are mustahik
                const id = await db.members.add({
                    tenant_id: tenantId,
                    name: jamaahNames[i],
                    phone_number: `08123456789${i}`,
                    is_mustahik: isMustahik,
                    mustahik_category: isMustahik ? (i === 7 ? 'Fakir Miskin' : 'Yatim Piatu') : undefined,
                    economic_status: isMustahik ? 'Tidak Mampu' : 'Mampu'
                } as IMember);
                memberIds.push(id);
            }

            // 4. Asatidz
            const asatidzId1 = await db.asatidz.add({
                tenant_id: tenantId,
                name: 'Ust. Dr. Khalid Basalamah, MA',
                specialization: 'Sirah & Akidah',
                phone_number: '08111222333',
                created_at: new Date().toISOString()
            } as IAsatidz);

            const asatidzId2 = await db.asatidz.add({
                tenant_id: tenantId,
                name: 'Ust. Abdul Somad, Lc, MA',
                specialization: 'Kajian Fiqih Kontemporer',
                phone_number: '08222333444',
                created_at: new Date().toISOString()
            } as IAsatidz);

            await db.asatidz.add({
                tenant_id: tenantId,
                name: 'Ust. Adi Hidayat, Lc, MA',
                specialization: 'Tafsir Al-Quran',
                created_at: new Date().toISOString()
            } as IAsatidz);

            // 5. Agendas
            const now = new Date();
            const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
            const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);

            await db.agendas.add({
                tenant_id: tenantId,
                title: 'Kajian Rutin Malam Ahad',
                description: 'Membahas Kitab Riyadush Shalihin bab Keutamaan Sedekah',
                start_date: tomorrow.toISOString().slice(0, 16),
                asatidz_id: asatidzId1,
                is_fundraising_open: true,
                target_amount: 5000000,
                current_amount: 1500000,
                show_progress_public: true,
                show_progress_admin: true,
                created_at: new Date().toISOString()
            } as IAgenda);

            await db.agendas.add({
                tenant_id: tenantId,
                title: 'Tabligh Akbar Spesial Muharram',
                description: 'Kajian tematik menyambut tahun baru Hijriyah',
                start_date: nextWeek.toISOString().slice(0, 16),
                asatidz_id: asatidzId2,
                is_fundraising_open: true,
                target_amount: 15000000,
                current_amount: 4500000,
                show_progress_public: true,
                show_progress_admin: true,
                created_at: new Date().toISOString()
            } as IAgenda);

            // 6. Finance
            const catInfaqId = await db.transaction_categories.add({ tenant_id: tenantId, name: 'Infaq Kotak Jumat', type: 'INCOME' });
            const catDonasiId = await db.transaction_categories.add({ tenant_id: tenantId, name: 'Donasi Program', type: 'INCOME' });
            const catOpsId = await db.transaction_categories.add({ tenant_id: tenantId, name: 'Beban Operasional Listrik', type: 'EXPENSE' });
            const catKebersihanId = await db.transaction_categories.add({ tenant_id: tenantId, name: 'Insentif Marbot', type: 'EXPENSE' });

            // Generate 60 days of transactional data
            for (let i = 60; i >= 0; i--) {
                const tDate = new Date();
                tDate.setDate(now.getDate() - i);
                const dateStr = tDate.toISOString().split('T')[0];

                // Random income every few days
                if (i % 3 === 0) {
                    await db.transactions.add({ tenant_id: tenantId, category_id: catInfaqId, amount: 450000 + (Math.random() * 200000), type: 'INCOME', date: dateStr, description: 'Kotak Jumat', status: 'APPROVED' });
                }
                if (i % 7 === 0) {
                    await db.transactions.add({ tenant_id: tenantId, category_id: catDonasiId, amount: 1500000 + (Math.random() * 1000000), type: 'INCOME', date: dateStr, description: 'Donasi Transfer Jamaah', status: 'APPROVED' });
                }

                // Fixed expenses once a month 
                if (tDate.getDate() === 1) {
                    await db.transactions.add({ tenant_id: tenantId, category_id: catOpsId, amount: 2500000, type: 'EXPENSE', date: dateStr, description: 'Bayar Listrik PLN', status: 'APPROVED' });
                    await db.transactions.add({ tenant_id: tenantId, category_id: catKebersihanId, amount: 3000000, type: 'EXPENSE', date: dateStr, description: 'Gaji Bulanan Marbot & Security', status: 'APPROVED' });
                }
                // Occasional minor expenses
                if (i % 14 === 0) {
                    await db.transactions.add({ tenant_id: tenantId, category_id: catKebersihanId, amount: 150000, type: 'EXPENSE', date: dateStr, description: 'Beli Sabun & Alat Pel', status: 'APPROVED' });
                }
            }

            // 7. Social / Santunan Program
            const programId1 = await db.donation_programs.add({
                tenant_id: tenantId,
                name: 'Santunan Yatim Piatu Muharram',
                description: 'Berbagi kebahagiaan bersama 50 anak yatim di sekitar lingkungan Masjid',
                target_amount: 10000000,
                is_active: true
            } as IDonationProgram);

            await db.donation_programs.add({
                tenant_id: tenantId,
                name: 'Bantuan Sembako Fakir Miskin',
                description: 'Penyaluran beras dan minyak bulanan',
                target_amount: 5000000,
                is_active: false // To demonstrate filtered out programs
            } as IDonationProgram);

            // Disburse to Mustahiks (IDs 8, 9, 10 are mustahik)
            await db.disbursements.add({
                tenant_id: tenantId,
                program_id: programId1,
                member_id: memberIds[7],
                amount: 500000,
                disbursed_at: new Date().toISOString()
            } as IDisbursement);

            await db.disbursements.add({
                tenant_id: tenantId,
                program_id: programId1,
                member_id: memberIds[8],
                amount: 500000,
                disbursed_at: new Date().toISOString()
            } as IDisbursement);

            // 8. Assets
            await db.assets.add({
                tenant_id: tenantId,
                name: 'AC Daikin Inverter 2PK',
                category: 'Elektronik & Perangkat AC',
                quantity: 4,
                condition: 'Baik',
                acquisition_date: '2022-05-10',
                acquisition_cost: 24000000,
                source: 'Pembelian Kas Masjid',
                location: 'Ruang Shalat Utama',
                created_at: new Date().toISOString()
            } as IAsset);

            await db.assets.add({
                tenant_id: tenantId,
                name: 'Karpet Shaf Turki Roll 50m',
                category: 'Perlengkapan Ibadah (Karpet, Mimbar)',
                quantity: 10,
                condition: 'Rusak Ringan',
                acquisition_date: '2020-01-15',
                acquisition_cost: 75000000,
                source: 'Wakaf',
                location: 'Ruang Shalat Utama',
                notes: 'Ada noda di saf ke-3 kiri',
                created_at: new Date().toISOString()
            } as IAsset);

            await db.assets.add({
                tenant_id: tenantId,
                name: 'Sound System Yamaha Stage',
                category: 'Sistem Suara (Sound System)',
                quantity: 1,
                condition: 'Baik',
                acquisition_date: '2023-11-20',
                acquisition_cost: 15000000,
                source: 'Hibah / Donasi Barang',
                location: 'Ruang Marbot / Audio',
                created_at: new Date().toISOString()
            } as IAsset);

        } // End of tenantCount === 0 block

        // 10. Seed SaaS Administration Data
        const adminCount = await db.table('internal_admins').count();
        if (adminCount === 0) {
            console.log('Seeding SaaS Internal Administration Data...');
            // 10. Seed SaaS Administration Data with Granular Permissions
            const superAdminRole = await db.internal_roles.add({ name: 'Super Admin', created_at: new Date().toISOString() });
            const csRole = await db.internal_roles.add({ name: 'CS', created_at: new Date().toISOString() });
            const marketingRole = await db.internal_roles.add({ name: 'Marketing', created_at: new Date().toISOString() });

            // Define Modules and Actions
            const modules = ['tenants', 'affiliates', 'staff', 'settings', 'audit_logs'];
            const actions = ['create', 'read', 'update', 'delete'];

            const permissionIds: Record<string, number> = {};

            for (const mod of modules) {
                for (const action of actions) {
                    const slug = `${mod}:${action}`;
                    const id = await db.internal_permissions.add({
                        slug,
                        description: `Can ${action} ${mod}`
                    });
                    permissionIds[slug] = id as number;
                }
            }

            // Link Permissions to Roles
            const allPermissionIds = Object.values(permissionIds);

            // Super Admin: All Permissions
            for (const pId of allPermissionIds) {
                await db.internal_role_permissions.add({
                    internal_role_id: superAdminRole as number,
                    internal_permission_id: pId
                });
            }

            // CS: Read all + Update Tenants (for support)
            const csPermissions = allPermissionIds.filter((_, index) => {
                const slug = Object.keys(permissionIds)[index];
                return slug.endsWith(':read') || slug === 'tenants:update';
            });
            for (const pId of csPermissions) {
                await db.internal_role_permissions.add({
                    internal_role_id: csRole as number,
                    internal_permission_id: pId
                });
            }

            // Marketing: Read Tenants & Affiliates + Create/Update Affiliates
            const marketingPermissions = allPermissionIds.filter((_, index) => {
                const slug = Object.keys(permissionIds)[index];
                return slug.startsWith('tenants:read') || slug.startsWith('affiliates:');
            });
            for (const pId of marketingPermissions) {
                await db.internal_role_permissions.add({
                    internal_role_id: marketingRole as number,
                    internal_permission_id: pId
                });
            }

            await db.internal_admins.add({
                name: 'MasjidKita Super Admin',
                email: 'super@masjidkita.id',
                password: 'password123',
                internal_role_id: superAdminRole as number,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            await db.internal_admins.add({
                name: 'MasjidKita CS',
                email: 'cs@masjidkita.id',
                password: 'password123',
                internal_role_id: csRole as number,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            await db.internal_admins.add({
                name: 'MasjidKita Marketing',
                email: 'marketing@masjidkita.id',
                password: 'password123',
                internal_role_id: marketingRole as number,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

        } // End of adminCount === 0 block

        // 11. Seed Platform Settings
        const settingsCount = await db.table('platform_settings').count();
        if (settingsCount === 0) {
            console.log('Seeding Platform Settings...');
            await db.platform_settings.add({
                platform_name: 'MASJIDKITA Platform',
                support_email: 'support@masjidkita.id',
                is_maintenance_mode: false,
                lite_plan_quota: 1000,
                pro_plan_price: 150000,
                commission_rate_default: 10,
                updated_at: new Date().toISOString()
            } as IPlatformSettings);
        }

        // 12. Seed SaaS Modules
        const moduleCount = await db.table('modules').count();
        if (moduleCount === 0) {
            console.log('Seeding SaaS Modules...');
            const modulesData: Omit<IModule, 'id'>[] = [
                { name: 'Manajemen Keuangan', slug: 'finance', description: 'Kelola pemasukan, pengeluaran, dan laporan kas masjid.', created_at: new Date().toISOString() },
                { name: 'Database Jamaah', slug: 'congregation', description: 'Kelola data jamaah, mustahik, dan pengurus.', created_at: new Date().toISOString() },
                { name: 'Program Sosial', slug: 'social', description: 'Kelola donasi program dan penyaluran santunan.', created_at: new Date().toISOString() },
                { name: 'Agenda & Kegiatan', slug: 'agenda', description: 'Atur jadwal pengajian dan manajemen pemateri.', created_at: new Date().toISOString() },
                { name: 'Manajemen Aset', slug: 'assets', description: 'Inventarisasi aset dan peralatan masjid.', created_at: new Date().toISOString() },
                { name: 'Data Asatidz', slug: 'asatidz', description: 'Kelola profil ustadz dan penceramah.', created_at: new Date().toISOString() },
                { name: 'Digital Signage', slug: 'signage', description: 'Tampilkan info masjid di TV/Monitor.', created_at: new Date().toISOString() },
                { name: 'Workflow Approval', slug: 'approval', description: 'Persetujuan berjenjang untuk transaksi keuangan.', created_at: new Date().toISOString() },
                { name: 'Custom Website', slug: 'website', description: 'Halaman publik khusus untuk masing-masing masjid.', created_at: new Date().toISOString() },
                { name: 'Program Affiliate', slug: 'affiliate', description: 'Program bagi hasil untuk referal masjid baru.', created_at: new Date().toISOString() },
                { name: 'Layanan Berlangganan', slug: 'subscription', description: 'Manajemen paket, tagihan, dan status layanan.', created_at: new Date().toISOString() },
            ];

            for (const mod of modulesData) {
                await db.modules.add(mod as IModule);
            }
        }

        // 13. Seed SaaS Packages
        const packageCount = await db.packages.count();
        if (packageCount === 0) {
            console.log('Seeding SaaS Packages...');
            const liteId = await db.packages.add({
                name: 'Lite',
                slug: 'lite',
                description: 'Cocok untuk masjid kecil dengan kebutuhan dasar.',
                monthlyPrice: 99000,
                yearlyPrice: 990000,
                is_active: true,
                is_popular: false,
                created_at: new Date().toISOString()
            } as IPackage);

            const proId = await db.packages.add({
                name: 'Pro',
                slug: 'pro',
                description: 'Solusi lengkap untuk manajemen masjid profesional.',
                monthlyPrice: 249000,
                yearlyPrice: 2490000,
                is_active: true,
                is_popular: true,
                created_at: new Date().toISOString()
            } as IPackage);

            const enterpriseId = await db.packages.add({
                name: 'Enterprise',
                slug: 'enterprise',
                description: 'Fitur kustom dan dukungan prioritas untuk yayasan besar.',
                monthlyPrice: 0, // Custom
                yearlyPrice: 0, // Custom
                is_active: true,
                is_popular: false,
                created_at: new Date().toISOString()
            } as IPackage);

            // Link Modules to Packages
            const allModules = await db.modules.toArray();
            const moduleMap: Record<string, number> = {};
            allModules.forEach(m => {
                if (m.id) moduleMap[m.slug] = m.id;
            });

            // Lite: finance, congregation (max 100 - handled in quota), website (slug), signage (simple), subscription
            const liteModules = ['finance', 'congregation', 'website', 'signage', 'subscription'];
            for (const slug of liteModules) {
                const moduleId = moduleMap[slug];
                if (moduleId) await db.package_modules.add({ package_id: liteId as number, module_id: moduleId });
            }

            // Pro: All except maybe custom customizations
            const proModules = ['finance', 'congregation', 'social', 'agenda', 'assets', 'asatidz', 'signage', 'approval', 'website', 'subscription', 'affiliate'];
            for (const slug of proModules) {
                const moduleId = moduleMap[slug];
                if (moduleId) await db.package_modules.add({ package_id: proId as number, module_id: moduleId });
            }

            // Enterprise: All
            const entModules = ['finance', 'congregation', 'social', 'agenda', 'assets', 'asatidz', 'signage', 'approval', 'website', 'subscription', 'affiliate'];
            for (const slug of entModules) {
                const moduleId = moduleMap[slug];
                if (moduleId) await db.package_modules.add({ package_id: enterpriseId as number, module_id: moduleId });
            }

            // 14. Seed Affiliates & Commissions
            const affiliateCount = await db.affiliates.count();
            if (affiliateCount === 0) {
                console.log('Seeding Affiliates...');
                const affId1 = await db.affiliates.add({
                    name: 'Ahmad Affiliate',
                    email: 'ahmad@example.com',
                    phone_number: '08123456789',
                    referral_code: 'AHMADMOSQUE',
                    balance: 250000,
                    status: 'ACTIVE',
                    commission_rate: 15,
                    bank_name: 'BCA',
                    bank_account_number: '8830123456',
                    bank_account_name: 'Ahmad Hidayat',
                    total_earned: 500000,
                    total_withdrawn: 250000,
                    created_at: new Date().toISOString()
                });

                await db.affiliates.add({
                    name: 'Budi Partner',
                    email: 'budi@example.com',
                    phone_number: '08567890123',
                    referral_code: 'BUDIMASJID',
                    balance: 0,
                    status: 'PENDING',
                    created_at: new Date().toISOString()
                });

                // Add sample withdrawal request
                await db.affiliate_withdrawals.add({
                    affiliate_id: affId1 as number,
                    amount: 150000,
                    status: 'PENDING',
                    bank_info: 'BCA 8830123456 a/n Ahmad Hidayat',
                    created_at: new Date().toISOString()
                });
            }
        }

        console.log('Database seeded successfully! Awesome!');
    } catch (e) {
        console.error("Failed to seed database:", e);
        throw e; // Re-throw to allow caller to handle UI feedback
    }
}

/**
 * Force resets the entire database by clearing all tables and re-seeding.
 * DANGER: This will delete ALL data.
 */
export async function resetAndSeedDatabase() {
    console.log('Force resetting database...');
    try {
        // Clear all tables
        const tables = db.tables;
        for (const table of tables) {
            console.log(`Clearing table: ${table.name}`);
            await table.clear();
        }

        // Re-seed
        await seedDatabase();
        console.log('Database reset and seeded successfully.');
    } catch (e) {
        console.error("Failed to reset and seed database:", e);
        throw e;
    }
}
