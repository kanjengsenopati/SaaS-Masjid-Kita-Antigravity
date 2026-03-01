import React, { useState } from 'react';
import type { IDonationProgram } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input, Textarea } from '../../../components/ui/Input';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';
import { Landmark, HeartHandshake } from 'lucide-react';
import clsx from 'clsx';

interface ProgramFormProps {
    initialData?: IDonationProgram | null;
    tenantId: number;
    onSubmit: (data: Omit<IDonationProgram, 'id'>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function DonationProgramForm({ initialData, tenantId, onSubmit, onCancel, isLoading }: ProgramFormProps) {
    const [formData, setFormData] = useState<Omit<IDonationProgram, 'id' | 'tenant_id'>>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        target_amount: initialData?.target_amount || undefined,
        is_active: initialData?.is_active ?? true,
        funding_source: initialData?.funding_source || 'GALANG_DONASI',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // This handleChange is now only for text inputs, CurrencyInput has its own handler
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            ...formData,
            tenant_id: tenantId,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Nama Program Santunan"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Misal: Santunan Anak Yatim Ramadhan"
            />

            <Textarea
                label="Deskripsi Program"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Penjelasan singkat mengenai program santunan ini..."
            />

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <label className="text-sm font-medium block text-gray-700 dark:text-gray-300">Sumber Dana Program</label>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, funding_source: 'KAS_MASJID' })}
                        className={clsx(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                            formData.funding_source === 'KAS_MASJID'
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                        )}
                    >
                        <Landmark className={clsx("w-5 h-5", formData.funding_source === 'KAS_MASJID' ? "text-emerald-600" : "text-gray-400")} />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Kas Masjid</span>
                        <p className="text-[10px] text-gray-500 text-center leading-tight italic">Dana dialokasikan dari kas masjid.</p>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, funding_source: 'GALANG_DONASI' })}
                        className={clsx(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                            formData.funding_source === 'GALANG_DONASI'
                                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                        )}
                    >
                        <HeartHandshake className={clsx("w-5 h-5", formData.funding_source === 'GALANG_DONASI' ? "text-orange-600" : "text-gray-400")} />
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Galang Donasi</span>
                        <p className="text-[10px] text-gray-500 text-center leading-tight italic">Dana dikumpulkan dari donatur / jamaah.</p>
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {formData.funding_source === 'KAS_MASJID' ? 'Total Anggaran Dana (Rp)' : 'Target Nominal Donasi (Rp)'}
                </label>
                <CurrencyInput
                    required
                    value={formData.target_amount || 0}
                    onChangeValue={val => setFormData({ ...formData, target_amount: val })}
                    placeholder="Contoh: 10.000.000"
                />
                {formData.funding_source === 'KAS_MASJID' && (
                    <p className="text-xs text-emerald-600 italic mt-1">Sistem akan otomatis mencatat pengeluaran di Keuangan.</p>
                )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Status Program</h4>
                    <p className="text-xs text-gray-500 mt-1">
                        {formData.is_active ? 'Program sedang berjalan dan dapat menerima penyaluran.' : 'Program telah selesai didistribusikan.'}
                    </p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={formData.is_active}
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={clsx(
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        formData.is_active ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                >
                    <span className={clsx(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        formData.is_active ? "translate-x-5" : "translate-x-0"
                    )} />
                </button>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                    Batal
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {initialData ? 'Simpan Perubahan' : 'Buat Program'}
                </Button>
            </div>
        </form>
    );
}
