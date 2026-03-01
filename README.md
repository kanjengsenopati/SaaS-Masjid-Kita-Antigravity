# Mosque App - Sistem Manajemen Manajemen Masjid

Aplikasi manajemen masjid modern berbasis web dengan fitur manajemen jamaah, keuangan, agenda, dan program sosial.

## 🛠 Tech Stack (Current Status)

### Frontend
- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Shadcn UI
- **Icons:** Lucide React
- **State Management:** React Hooks (useState, useEffect, useContext)
- **Routing:** React Router v6

### Database & Service Layer
- **Local Database:** Dexie.js (IndexedDB wrapper)
- **Architecture:** Service-Oriented Architecture (SOA)
- **Service Base:** `BaseService` & `TenantScopedService` untuk isolasi data antar masjid.
- **Features:** 
  - RBAC (Role-Based Access Control)
  - Multi-tenant support (Scoped by `tenant_id`)
  - Transaction Approval Workflow (Pending/Approved/Rejected)

## 🗄️ Struktur Database (Current Schema)

| Module | Table Name | Key Fields |
| --- | --- | --- |
| **Auth/RBAC** | `users`, `roles`, `permissions`, `role_permissions` | `tenant_id`, `role_id`, `slug` |
| **Congregation** | `congregation` | `member_id`, `economic_status`, `occupation` |
| **Finance** | `transactions`, `transaction_categories` | `status`, `type` (IN/OUT), `proof_base64` |
| **Activities** | `agendas`, `asatidz` | `funding_source`, `asatidz_id` |
| **Social** | `donation_programs`, `disbursements`, `donors` | `target_amount`, `current_amount` |

---

## 🚀 Rencana Migrasi ke Backend (Laravel + PostgreSQL)

Aplikasi ini dirancang dengan kesiapan penuh untuk migrasi ke arsitektur client-server menggunakan Laravel.

### Langkah-langkah Migrasi (Steps to Migrate):

1.  **Persiapan Database (PostgreSQL):**
    - Buat database PostgreSQL.
    - Jalankan migrasi Laravel berdasarkan skema `src/lib/db.ts`.
    - Manfaatkan *Foreign Key constraints* untuk menjamin integritas data (menggantikan logika manual di Dexie).

2.  **Imlementasi Backend (Laravel):**
    - **Models:** Ubah interface TypeScript di `src/types` menjadi Eloquent Models.
    - **Controllers:** Implementasikan Generic CRUD Controller berdasarkan pola di `BaseService.ts`.
    - **Auth:** Gunakan **Laravel Sanctum** untuk autentikasi API (menggantikan penyimpanan kredensial lokal).
    - **Tenant Scoping:** Gunakan **Global Scopes** di Laravel untuk secara otomatis menambahkan `where('tenant_id', ...)` di setiap query.

3.  **Refactor Frontend Service Layer:**
    - Update `src/services/BaseService.ts` untuk menggunakan `axios` atau `fetch` alih-alih melakukan query ke Dexie.
    - Semua modul (`AgendaModule`, `SocialModule`, dll) akan tetap menggunakan pemanggilan method service yang sama, sehingga perubahan pada UI sangat minim.

4.  **Data Migration Script:**
    - Buat script untuk mengekspor data dari IndexedDB (JSON) dan mengimpornya ke PostgreSQL lewat Laravel Seeder/API.

### Keuntungan Migrasi:
- **Data Integrity:** ACID compliance dari PostgreSQL.
- **Security:** Hashing password tingkat lanjut dan kontrol akses sisi server.
- **Scalability:** Mendukung ribuan masjid secara bersamaan dengan performa database yang optimal.

---

## ⚙️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```
