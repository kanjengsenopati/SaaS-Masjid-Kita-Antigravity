import { db } from './db';
import type {
    ITenant, IUser, IRole, IFoundation, IManagementPeriod, ITakmirMember,
    IMember, IDonationProgram, IDisbursement, IAgenda, IAsatidz, IAsset,
    IAffiliate, IPlatformSettings, IModule, IPackage
} from '../types';

export async function seedDatabase() {
    try {
        const tenantCount = await db.table('tenants').count();
        if (tenantCount === 0) {
            console.log('Seeding Database with integrated Mosque Data...');

            // 1. Tenants, Roles, Users
            const allExistingTenants = await db.tenants.toArray();
            const existingSlugs = new Set(allExistingTenants.map(t => t.slug));

            const demoTenants = [
                { name: 'Masjid Raya Al-Bina', slug: 'masjid-raya-al-bina', plan: 'PRO' },
                { name: 'Masjid Baitulmudif', slug: 'masjid-baitulmudif', plan: 'PRO' }
            ];

            let tenantId: number | undefined;

            for (const dt of demoTenants) {
                let id: number;

                if (!existingSlugs.has(dt.slug)) {
                    id = await db.tenants.add({
                        name: dt.name,
                        host: window.location.host,
                        slug: dt.slug,
                        plan: dt.plan,
                        billing_cycle: 'yearly',
                        primaryColor: '#10b981',
                        goldPrice: 1500000,
                        infaqEnabled: true,
                        waqafEnabled: true,
                        qurbanEnabled: true,
                        santunanEnabled: true,
                        createdAt: new Date().toISOString()
                    } as ITenant) as number;

                    const roleId = await db.roles.add({ tenant_id: id, name: 'Super Admin', createdAt: new Date().toISOString() } as IRole);

                    await db.users.add({
                        tenant_id: id,
                        username: 'admin',
                        email: dt.slug === 'masjid-baitulmudif' ? 'baitulmudif@example.com' : 'admin@masjid-raya.com',
                        role_id: roleId as number,
                        createdAt: new Date().toISOString()
                    } as IUser);
                } else {
                    const existing = allExistingTenants.find(t => t.slug === dt.slug);
                    id = existing?.id as number;
                }

                if (dt.slug === 'masjid-raya-al-bina') {
                    tenantId = id;
                }
            }

            if (!tenantId) {
                const first = await db.tenants.toCollection().first();
                tenantId = first?.id;
            }

            // 2. Organization & Takmir
            await db.foundations.add({
                tenant_id: tenantId as number,
                name: 'Yayasan Al-Bina Utama',
                address: 'Jl. Merdeka Raya No 1, Jakarta',
                legal_doc_number: 'AHU-1234.56.78.2026'
            } as IFoundation);

            const periodId = await db.management_periods.add({
                tenant_id: tenantId as number,
                start_year: 2024,
                end_year: 2028,
                is_active: true
            } as IManagementPeriod);

            await db.takmir_members.add({
                tenant_id: tenantId as number,
                period_id: periodId as number,
                user_id: 1, // Linking back to admin
                position: 'Ketua Takmir'
            } as ITakmirMember);

            // 3. Jamaah & Mustahik
            const memberIds = [];
            const jamaahNames = ['Ahmad Syarif', 'Budi Santoso', 'Cecep Supriadi', 'Dewi Lestari', 'Eko Purnomo', 'Fatimah Az-Zahra', 'Gatot Subroto', 'Siti Aminah', 'Rudi Hartono', 'Nurhayati'];

            for (let i = 0; i < jamaahNames.length; i++) {
                const isMustahik = i > 6; // Last 3 are mustahik
                const id = await db.members.add({
                    tenant_id: tenantId as number,
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
                tenant_id: tenantId as number,
                name: 'Ust. Dr. Khalid Basalamah, MA',
                specialization: 'Sirah & Akidah',
                phone_number: '08111222333',
                created_at: new Date().toISOString()
            } as IAsatidz);

            const asatidzId2 = await db.asatidz.add({
                tenant_id: tenantId as number,
                name: 'Ust. Abdul Somad, Lc, MA',
                specialization: 'Kajian Fiqih Kontemporer',
                phone_number: '08222333444',
                created_at: new Date().toISOString()
            } as IAsatidz);

            await db.asatidz.add({
                tenant_id: tenantId as number,
                name: 'Ust. Adi Hidayat, Lc, MA',
                specialization: 'Tafsir Al-Quran',
                created_at: new Date().toISOString()
            } as IAsatidz);

            // 5. Agendas
            const now = new Date();
            const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
            const nextWeek = new Date(now); nextWeek.setDate(now.getDate() + 7);

            await db.agendas.add({
                tenant_id: tenantId as number,
                title: 'Kajian Rutin Malam Ahad',
                description: 'Membahas Kitab Riyadush Shalihin bab Keutamaan Sedekah',
                start_date: tomorrow.toISOString().slice(0, 16),
                asatidz_id: asatidzId1 as number,
                is_fundraising_open: true,
                target_amount: 5000000,
                current_amount: 1500000,
                show_progress_public: true,
                show_progress_admin: true,
                created_at: new Date().toISOString()
            } as IAgenda);

            await db.agendas.add({
                tenant_id: tenantId as number,
                title: 'Tabligh Akbar Spesial Muharram',
                description: 'Kajian tematik menyambut tahun baru Hijriyah',
                start_date: nextWeek.toISOString().slice(0, 16),
                asatidz_id: asatidzId2 as number,
                is_fundraising_open: true,
                target_amount: 15000000,
                current_amount: 4500000,
                show_progress_public: true,
                show_progress_admin: true,
                created_at: new Date().toISOString()
            } as IAgenda);

            // 6. Finance
            const catInfaqId = await db.transaction_categories.add({ tenant_id: tenantId as number, name: 'Infaq Kotak Jumat', type: 'INCOME' });
            const catDonasiId = await db.transaction_categories.add({ tenant_id: tenantId as number, name: 'Donasi Program', type: 'INCOME' });
            const catOpsId = await db.transaction_categories.add({ tenant_id: tenantId as number, name: 'Beban Operasional Listrik', type: 'EXPENSE' });
            const catKebersihanId = await db.transaction_categories.add({ tenant_id: tenantId as number, name: 'Insentif Marbot', type: 'EXPENSE' });

            // Generate 60 days of transactional data
            for (let i = 60; i >= 0; i--) {
                const tDate = new Date();
                tDate.setDate(now.getDate() - i);
                const dateStr = tDate.toISOString().split('T')[0];

                // Random income every few days
                if (i % 3 === 0) {
                    await db.transactions.add({ tenant_id: tenantId as number, category_id: catInfaqId as number, amount: 450000 + (Math.random() * 200000), type: 'INCOME', date: dateStr, description: 'Kotak Jumat', status: 'APPROVED' });
                }
                if (i % 7 === 0) {
                    await db.transactions.add({ tenant_id: tenantId as number, category_id: catDonasiId as number, amount: 1500000 + (Math.random() * 1000000), type: 'INCOME', date: dateStr, description: 'Donasi Transfer Jamaah', status: 'APPROVED' });
                }

                // Fixed expenses once a month 
                if (tDate.getDate() === 1) {
                    await db.transactions.add({ tenant_id: tenantId as number, category_id: catOpsId as number, amount: 2500000, type: 'EXPENSE', date: dateStr, description: 'Bayar Listrik PLN', status: 'APPROVED' });
                    await db.transactions.add({ tenant_id: tenantId as number, category_id: catKebersihanId as number, amount: 3000000, type: 'EXPENSE', date: dateStr, description: 'Gaji Bulanan Marbot & Security', status: 'APPROVED' });
                }
                // Occasional minor expenses
                if (i % 14 === 0) {
                    await db.transactions.add({ tenant_id: tenantId as number, category_id: catKebersihanId as number, amount: 150000, type: 'EXPENSE', date: dateStr, description: 'Beli Sabun & Alat Pel', status: 'APPROVED' });
                }
            }

            // 7. Social / Santunan Program
            const programId1 = await db.donation_programs.add({
                tenant_id: tenantId as number,
                name: 'Santunan Yatim Piatu Muharram',
                description: 'Berbagi kebahagiaan bersama 50 anak yatim di sekitar lingkungan Masjid',
                target_amount: 10000000,
                is_active: true
            } as IDonationProgram);

            await db.donation_programs.add({
                tenant_id: tenantId as number,
                name: 'Wakaf Pembebasan Lahan Parkir',
                description: 'Kebutuhan lahan parkir seluas 200m2 untuk jamaah',
                target_amount: 250000000,
                is_active: true
            } as IDonationProgram);

            await db.donation_programs.add({
                tenant_id: tenantId as number,
                name: 'Bantuan Sembako Fakir Miskin',
                description: 'Penyaluran beras dan minyak bulanan',
                target_amount: 5000000,
                is_active: false // To demonstrate filtered out programs
            } as IDonationProgram);

            // Disburse to Mustahiks (IDs 8, 9, 10 are mustahik)
            await db.disbursements.add({
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

        // 10. Seed SaaS Administration Data with Guards and Deduplication
        console.log('Checking SaaS Internal Administration Data...');

        // --- 10a. Permissions Guards ---
        const existingPermissions = await db.internal_permissions.toArray();
        const permSlugMap = new Map(existingPermissions.map(p => [p.slug, p.id]));

        const modules = ['tenants', 'affiliates', 'staff', 'settings', 'audit_logs'];
        const actions = ['create', 'read', 'update', 'delete'];
        const permissionIds: Record<string, number> = {};

        for (const mod of modules) {
            for (const action of actions) {
                const slug = `${mod}:${action}`;
                if (!permSlugMap.has(slug)) {
                    const id = await db.internal_permissions.add({
                        slug,
                        description: `Can ${action} ${mod}`
                    });
                    permissionIds[slug] = id as number;
                } else {
                    permissionIds[slug] = permSlugMap.get(slug)!;
                }
            }
        }

        // --- 10b. Roles Guards ---
        const existingRoles = await db.internal_roles.toArray();
        const roleNameMap = new Map(existingRoles.map(r => [r.name, r.id]));

        const getOrCreateRole = async (name: string) => {
            if (roleNameMap.has(name)) return roleNameMap.get(name)!;
            const id = await db.internal_roles.add({ name, created_at: new Date().toISOString() });
            roleNameMap.set(name, id as number);
            return id as number;
        };

        const superAdminRoleId = await getOrCreateRole('Super Admin');
        const csRoleId = await getOrCreateRole('CS');
        const marketingRoleId = await getOrCreateRole('Marketing');

        // --- 10c. Role-Permissions Sync ---
        const syncRolePermissions = async (roleId: number, slugs: string[]) => {
            for (const slug of slugs) {
                const pId = permissionIds[slug];
                if (pId) {
                    const exists = await db.internal_role_permissions.get([roleId, pId]);
                    if (!exists) {
                        await db.internal_role_permissions.add({
                            internal_role_id: roleId,
                            internal_permission_id: pId
                        });
                    }
                }
            }
        };

        // Super Admin: All Permissions
        await syncRolePermissions(superAdminRoleId, Object.keys(permissionIds));

        // CS: Read all + Update Tenants
        const csPermSlugs = Object.keys(permissionIds).filter(slug =>
            slug.endsWith(':read') || slug === 'tenants:update'
        );
        await syncRolePermissions(csRoleId, csPermSlugs);

        // Marketing: Read Tenants & Affiliates + Full Affiliates
        const marketingPermSlugs = Object.keys(permissionIds).filter(slug =>
            slug.startsWith('tenants:read') || slug.startsWith('affiliates:')
        );
        await syncRolePermissions(marketingRoleId, marketingPermSlugs);

        // --- 10d. Admin Guards ---
        const existingAdmins = await db.internal_admins.toArray();
        const adminEmailMap = new Map(existingAdmins.map(a => [a.email, a.id]));

        const adminsToSeed = [
            { name: 'MasjidKita Super Admin', email: 'super@masjidkita.id', password: 'password123', internal_role_id: superAdminRoleId },
            { name: 'MasjidKita CS', email: 'cs@masjidkita.id', password: 'password123', internal_role_id: csRoleId },
            { name: 'MasjidKita Marketing', email: 'marketing@masjidkita.id', password: 'password123', internal_role_id: marketingRoleId },
        ];

        for (const admin of adminsToSeed) {
            if (!adminEmailMap.has(admin.email)) {
                await db.internal_admins.add({
                    ...admin,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }
        }

        // --- 10e. Deduplication for Roles & Admins ---
        // Clean up duplicate roles by name
        const rolesAfter = await db.internal_roles.toArray();
        const seenRoleNames = new Map<string, number>();
        const duplicateRoleIds: number[] = [];
        for (const r of rolesAfter) {
            if (seenRoleNames.has(r.name)) {
                duplicateRoleIds.push(r.id!);
            } else {
                seenRoleNames.set(r.name, r.id!);
            }
        }

        if (duplicateRoleIds.length > 0) {
            console.log(`Cleaning up ${duplicateRoleIds.length} duplicate roles...`);
            // Update admins pointing to duplicate roles
            for (const admin of await db.internal_admins.toArray()) {
                if (duplicateRoleIds.includes(admin.internal_role_id)) {
                    const role = rolesAfter.find(r => r.id === admin.internal_role_id);
                    if (role) {
                        const originalId = seenRoleNames.get(role.name);
                        if (originalId) await db.internal_admins.update(admin.id!, { internal_role_id: originalId });
                    }
                }
            }
            // Update role-permissions pointing to duplicate roles
            for (const rp of await db.internal_role_permissions.toArray()) {
                if (duplicateRoleIds.includes(rp.internal_role_id)) {
                    const role = rolesAfter.find(r => r.id === rp.internal_role_id);
                    if (role) {
                        const originalId = seenRoleNames.get(role.name);
                        if (originalId) {
                            try {
                                await db.internal_role_permissions.delete([rp.internal_role_id, rp.internal_permission_id]);
                                await db.internal_role_permissions.put({ internal_role_id: originalId, internal_permission_id: rp.internal_permission_id });
                            } catch (e) { }
                        }
                    }
                }
            }
            await db.internal_roles.bulkDelete(duplicateRoleIds);
        }

        // Clean up duplicate admins by email
        const adminsAfter = await db.internal_admins.toArray();
        const seenEmails = new Set<string>();
        const duplicateAdminIds: number[] = [];
        for (const a of adminsAfter) {
            if (seenEmails.has(a.email)) {
                duplicateAdminIds.push(a.id!);
            } else {
                seenEmails.add(a.email);
            }
        }
        if (duplicateAdminIds.length > 0) {
            console.log(`Cleaning up ${duplicateAdminIds.length} duplicate admins...`);
            await db.internal_admins.bulkDelete(duplicateAdminIds);
        }

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
                commission_promo_rate: 25,
                commission_promo_expires_at: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(), // 30 days from now
                updated_at: new Date().toISOString()
            } as IPlatformSettings);
        }

        // 12. Seed SaaS Modules with Deduplication and Guards
        const allExistingModules = await db.modules.toArray();
        const existingSlugs = new Set(allExistingModules.map(m => m.slug));

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
            if (!existingSlugs.has(mod.slug)) {
                await db.modules.add(mod as IModule);
            }
        }

        // --- DEDUPLICATION STEP ---
        // If duplicates already exist, clean them up
        const modulesAfterSeed = await db.modules.toArray();
        const seenSlugs = new Map<string, number>(); // slug -> id
        const duplicateIds: number[] = [];

        for (const m of modulesAfterSeed) {
            if (seenSlugs.has(m.slug)) {
                duplicateIds.push(m.id!);
            } else {
                seenSlugs.set(m.slug, m.id!);
            }
        }

        if (duplicateIds.length > 0) {
            console.log(`Cleaning up ${duplicateIds.length} duplicate modules...`);
            // Update package_modules to point to the kept module ID
            const allPkgMods = await db.package_modules.toArray();
            for (const pm of allPkgMods) {
                const mod = modulesAfterSeed.find(m => m.id === pm.module_id);
                if (mod && duplicateIds.includes(pm.module_id)) {
                    const originalId = seenSlugs.get(mod.slug);
                    if (originalId) {
                        try {
                            await db.package_modules.delete([pm.package_id, pm.module_id]);
                            await db.package_modules.put({ package_id: pm.package_id, module_id: originalId });
                        } catch (e) {
                            // Ignored if link already exists
                        }
                    }
                }
            }
            await db.modules.bulkDelete(duplicateIds);
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

            // Link Modules to Packages with Guards
            const allModulesNow = await db.modules.toArray();
            const moduleMap: Record<string, number> = {};
            allModulesNow.forEach(m => {
                if (m.id) moduleMap[m.slug] = m.id;
            });

            // Lite: finance, congregation (max 100 - handled in quota), website (slug), signage (simple), subscription
            const liteModules = ['finance', 'congregation', 'website', 'signage', 'subscription'];
            for (const slug of liteModules) {
                const moduleId = moduleMap[slug];
                if (moduleId) {
                    const exists = await db.package_modules.get([liteId as number, moduleId]);
                    if (!exists) await db.package_modules.add({ package_id: liteId as number, module_id: moduleId });
                }
            }

            // Pro: All except maybe custom customizations
            const proModules = ['finance', 'congregation', 'social', 'agenda', 'assets', 'asatidz', 'signage', 'approval', 'website', 'subscription', 'affiliate'];
            for (const slug of proModules) {
                const moduleId = moduleMap[slug];
                if (moduleId) {
                    const exists = await db.package_modules.get([proId as number, moduleId]);
                    if (!exists) await db.package_modules.add({ package_id: proId as number, module_id: moduleId });
                }
            }

            // Enterprise: All
            const entModules = ['finance', 'congregation', 'social', 'agenda', 'asatidz', 'signage', 'approval', 'website', 'subscription', 'affiliate'];
            for (const slug of entModules) {
                const moduleId = moduleMap[slug];
                if (moduleId) {
                    const exists = await db.package_modules.get([enterpriseId as number, moduleId]);
                    if (!exists) await db.package_modules.add({ package_id: enterpriseId as number, module_id: moduleId });
                }
            }

            // 14. Seed Affiliates & Commissions
            const allExistingAffiliates = await db.affiliates.toArray();
            const existingAffEmails = new Set(allExistingAffiliates.map(a => a.email));

            console.log('Seeding Affiliates...');
            const affiliatesData = [
                {
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
                },
                {
                    name: 'Demo Affiliate Partner',
                    email: 'affiliate@masjidkita.id',
                    phone_number: '08999888777',
                    referral_code: 'DEMOPARTNER',
                    balance: 1250000,
                    status: 'ACTIVE',
                    commission_rate: 20,
                    bank_name: 'Mandiri',
                    bank_account_number: '1234567890',
                    bank_account_name: 'Demo Partner',
                    total_earned: 1250000,
                    total_withdrawn: 0,
                    created_at: new Date().toISOString()
                },
                {
                    name: 'Budi Partner',
                    email: 'budi@example.com',
                    phone_number: '08567890123',
                    referral_code: 'BUDIMASJID',
                    balance: 0,
                    status: 'PENDING',
                    created_at: new Date().toISOString()
                }
            ];

            for (const aff of affiliatesData) {
                if (!existingAffEmails.has(aff.email)) {
                    const affId = await db.affiliates.add(aff as IAffiliate);

                    // Add sample withdrawal for Ahmad
                    if (aff.email === 'ahmad@example.com') {
                        await db.affiliate_withdrawals.add({
                            affiliate_id: affId as number,
                            amount: 150000,
                            status: 'PENDING',
                            bank_info: 'BCA 8830123456 a/n Ahmad Hidayat',
                            created_at: new Date().toISOString()
                        });
                    }
                }
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
