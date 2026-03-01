import React, { useState, useEffect } from 'react';
import { useTenant } from '../tenants/TenantContext';
import { foundationService, managementPeriodService } from '../../services/organizationService';
import type { IFoundation, IManagementPeriod } from '../../types';
import { Save, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { TakmirMembers } from './TakmirMembers';

export const OrganizationModule: React.FC = () => {
    const { tenant } = useTenant();

    // Foundation State
    const [foundation, setFoundation] = useState<IFoundation | null>(null);
    const [fName, setFName] = useState('');
    const [fAddress, setFAddress] = useState('');
    const [fDoc, setFDoc] = useState('');
    const [isSavingFoundation, setIsSavingFoundation] = useState(false);

    // Periods State
    const [periods, setPeriods] = useState<IManagementPeriod[]>([]);
    const [isSavingPeriod, setIsSavingPeriod] = useState(false);

    const loadData = async () => {
        if (!tenant) return;
        // Load Foundation
        const { data: fons } = await foundationService.getAllForTenant(tenant.id!);
        if (fons && fons.length > 0) {
            setFoundation(fons[0]);
            setFName(fons[0].name);
            setFAddress(fons[0].address);
            setFDoc(fons[0].legal_doc_number);
        }

        // Load Periods
        const { data: per } = await managementPeriodService.getAllForTenant(tenant.id!);
        if (per) {
            setPeriods(per.sort((a, b) => b.start_year - a.start_year));
        }
    };

    useEffect(() => { loadData(); }, [tenant]);

    const handleSaveFoundation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant) return;
        setIsSavingFoundation(true);

        const payload = {
            name: fName,
            address: fAddress,
            legal_doc_number: fDoc,
            tenant_id: tenant.id!
        };

        if (foundation && foundation.id) {
            await foundationService.update(foundation.id, payload);
        } else {
            await foundationService.createForTenant(tenant.id!, payload);
        }

        setIsSavingFoundation(false);
        loadData();
        alert('Data Yayasan Disimpan.');
    };

    const handleAddPeriod = async () => {
        if (!tenant) return;
        const start = parseInt(prompt('Tahun Mulai (contoh: 2024):') || '0');
        const end = parseInt(prompt('Tahun Selesai (contoh: 2027):') || '0');

        if (start > 1900 && end >= start) {
            setIsSavingPeriod(true);
            await managementPeriodService.createForTenant(tenant.id!, {
                start_year: start,
                end_year: end,
                is_active: false // default false, must be activated manually
            });
            setIsSavingPeriod(false);
            loadData();
        } else {
            alert('Input tahun tidak valid.');
        }
    };

    const handleSetActivePeriod = async (id: number) => {
        if (!tenant || !confirm('Yakin menjadikan ini periode aktif? Periode lain akan dinonaktifkan.')) return;

        // Simple transaction-like logic: deactivate all, activate one
        for (const p of periods) {
            if (p.is_active && p.id !== id) {
                await managementPeriodService.update(p.id!, { is_active: false });
            }
        }
        await managementPeriodService.update(id, { is_active: true });
        loadData();
    };

    if (!tenant) return <div>Tenant Not Found</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Organisasi & Legal</h2>
                <p className="text-gray-500 py-1">Kelola data Yayasan dan Struktur Kepengurusan Takmir.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Foundation Form */}
                <section className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-emerald-700 dark:text-emerald-400">Profil Yayasan Induk</h3>
                    <form onSubmit={handleSaveFoundation} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Yayasan</label>
                            <input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="Yayasan Masjid Al-Falah" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nomor SK / Legalitas</label>
                            <input type="text" value={fDoc} onChange={e => setFDoc(e.target.value)} placeholder="AHU-xxxx.xx.xxxx" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Lengkap</label>
                            <textarea value={fAddress} onChange={e => setFAddress(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
                        </div>
                        <button type="submit" disabled={isSavingFoundation} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all w-full justify-center">
                            {isSavingFoundation ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Simpan Profil Yayasan
                        </button>
                    </form>
                </section>

                {/* Management Periods */}
                <section className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Periode Jabatan Takmir</h3>
                        <button onClick={handleAddPeriod} disabled={isSavingPeriod} className="p-2 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors">
                            <Plus size={18} />
                        </button>
                    </div>

                    {periods.length === 0 ? (
                        <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-8">
                            <AlertCircle size={32} className="mb-2 opacity-50" />
                            <p className="text-sm">Belum ada periode jabatan terdaftar.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                            {periods.map(p => (
                                <div key={p.id} className={`p-4 rounded-lg border flex justify-between items-center transition-colors ${p.is_active ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-white">Periode {p.start_year} - {p.end_year}</div>
                                        {p.is_active && <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Status: Aktif Menjabat</div>}
                                    </div>
                                    {!p.is_active && (
                                        <button onClick={() => handleSetActivePeriod(p.id!)} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 font-medium transition-colors">
                                            Jadikan Aktif
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <TakmirMembers />
        </div>
    );
};
