import React, { useState, useEffect } from 'react';
import { useTenant } from '../../tenants/TenantContext';
import { tenantService } from '../../../services/tenantService';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';
import { Save, Loader2, Info } from 'lucide-react';
import clsx from 'clsx';

export const GeneralSettings: React.FC = () => {
    const { tenant, refreshTenant } = useTenant();
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: tenant?.name || '',
        primaryColor: tenant?.primaryColor || '#10b981',
        goldPrice: tenant?.goldPrice || 1500000,
        infaqEnabled: tenant?.infaqEnabled ?? true,
        waqafEnabled: tenant?.waqafEnabled ?? true,
        qurbanEnabled: tenant?.qurbanEnabled ?? true,
        santunanEnabled: tenant?.santunanEnabled ?? true,
    });

    useEffect(() => {
        if (tenant) {
            setFormData({
                name: tenant.name,
                primaryColor: tenant.primaryColor,
                goldPrice: tenant.goldPrice,
                infaqEnabled: tenant.infaqEnabled,
                waqafEnabled: tenant.waqafEnabled,
                qurbanEnabled: tenant.qurbanEnabled,
                santunanEnabled: tenant.santunanEnabled,
            });
        }
    }, [tenant]);

    if (!tenant) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const { error } = await tenantService.update(tenant.id!, formData);
        setIsSaving(false);
        if (!error) {
            await refreshTenant();
            alert('Pengaturan berhasil disimpan!');
        } else {
            alert('Error: ' + error);
        }
    };

    const ToggleSwitch = ({ label, field }: { label: string, field: keyof typeof formData }) => (
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            <button
                type="button"
                role="switch"
                aria-checked={formData[field] as boolean}
                onClick={() => setFormData(p => ({ ...p, [field]: !p[field] }))}
                className={clsx(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2",
                    formData[field] ? "bg-emerald-600" : "bg-gray-200 dark:bg-gray-700"
                )}
            >
                <span
                    className={clsx(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        formData[field] ? "translate-x-5" : "translate-x-0"
                    )}
                />
            </button>
        </div>
    );

    return (
        <form onSubmit={handleSave} className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            {/* Identitas Section */}
            <section className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-emerald-700 dark:text-emerald-400">Identitas Utama</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Masjid</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex justify-between">
                            <span>Warna Tema (Hex)</span>
                            <span className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: formData.primaryColor }}></span>
                        </label>
                        <input
                            type="text"
                            value={formData.primaryColor}
                            onChange={e => setFormData(p => ({ ...p, primaryColor: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                    </div>
                </div>
            </section>

            {/* Acuan Zakat */}
            <section className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-emerald-700 dark:text-emerald-400">Acuan Finansial</h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Harga Emas Saat Ini (Rp / Gram)</label>
                        <CurrencyInput
                            required
                            value={formData.goldPrice || 0}
                            onChangeValue={val => setFormData({ ...formData, goldPrice: val })}
                            placeholder="Contoh: 1.500.000"
                        />
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Info size={14} /> Digunakan sebagai acuan perhitungan Nisab Zakat Maal (85 Gram Emas).
                        </p>
                    </div>
                </div>
            </section>

            {/* Feature Toggles */}
            <section className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-emerald-700 dark:text-emerald-400">Modul Layanan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ToggleSwitch label="Penerimaan Infaq" field="infaqEnabled" />
                    <ToggleSwitch label="Penerimaan Waqaf" field="waqafEnabled" />
                    <ToggleSwitch label="Pendaftaran Qurban" field="qurbanEnabled" />
                    <ToggleSwitch label="Program Santunan (Sosial)" field="santunanEnabled" />
                </div>
            </section>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg active:scale-95 transition-all shadow-md"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Simpan Perubahan
                </button>
            </div>
        </form>
    );
};
