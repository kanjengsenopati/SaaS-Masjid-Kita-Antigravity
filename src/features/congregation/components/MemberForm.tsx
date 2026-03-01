import React, { useState, useEffect } from 'react';
import type { IMember } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input, Select, Textarea } from '../../../components/ui/Input';

interface MemberFormProps {
    initialData?: IMember | null;
    tenantId: number;
    onSubmit: (data: Omit<IMember, 'id'>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function MemberForm({ initialData, tenantId, onSubmit, onCancel, isLoading }: MemberFormProps) {
    const [formData, setFormData] = useState<Omit<IMember, 'id' | 'tenant_id'>>({
        name: '',
        phone_number: '',
        address: '',
        economic_status: 'Menengah',
        is_mustahik: false,
        mustahik_category: '',
        occupation: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                phone_number: initialData.phone_number || '',
                address: initialData.address || '',
                economic_status: (
                    initialData.economic_status === 'Kurang Mampu' ||
                        initialData.economic_status === 'Menengah Kebawah' ? 'Tidak Mampu' :
                        initialData.economic_status === 'Menengah Keatas' ? 'Mampu' :
                            initialData.economic_status
                ) || 'Menengah',
                is_mustahik: initialData.is_mustahik,
                mustahik_category: initialData.mustahik_category || '',
                occupation: initialData.occupation || '',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked,
                // Reset category if not mustahik anymore
                ...(name === 'is_mustahik' && !checked ? { mustahik_category: '' } : {})
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
                label="Nama Lengkap"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Masukkan nama lengkap jamaah"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Nomor Telepon / WhatsApp"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="08..."
                />

                <Select
                    label="Status Ekonomi"
                    name="economic_status"
                    value={formData.economic_status}
                    onChange={handleChange}
                >
                    <option value="Mampu">Mampu (Aghniya)</option>
                    <option value="Menengah">Menengah</option>
                    <option value="Tidak Mampu">Tidak Mampu (Dhuafa)</option>
                </Select>
            </div>

            <Textarea
                label="Alamat"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Alamat lengkap tempat tinggal"
            />

            <Input
                label="Pekerjaan"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="Contoh: PNS, Wiraswasta, Pelajar, dll"
            />

            <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50 space-y-4">
                <div className="flex items-center">
                    <input
                        id="is_mustahik"
                        type="checkbox"
                        name="is_mustahik"
                        checked={formData.is_mustahik}
                        onChange={handleChange}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="is_mustahik" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                        Tandai sebagai Mustahik (Penerima Zakat/Bantuan)
                    </label>
                </div>

                {formData.is_mustahik && (
                    <div className="pl-6 animate-in slide-in-from-top-2 duration-200">
                        <Select
                            label="Kategori Mustahik (Asnaf)"
                            name="mustahik_category"
                            value={formData.mustahik_category}
                            onChange={handleChange}
                            required={formData.is_mustahik}
                        >
                            <option value="">Pilih Kategori...</option>
                            <option value="Fakir">Fakir</option>
                            <option value="Miskin">Miskin</option>
                            <option value="Amil">Amil</option>
                            <option value="Mu'allaf">Mu'allaf</option>
                            <option value="Riqab">Riqab (Hamba Sahaya)</option>
                            <option value="Gharimin">Gharimin (Orang Berhutang)</option>
                            <option value="Fisabilillah">Fisabilillah</option>
                            <option value="Ibnus Sabil">Ibnus Sabil (Musafir)</option>
                            <option value="Yatim/Piatu">Yatim / Piatu (Bantuan Sosial)</option>
                            <option value="Lansia">Lansia / Janda Dhuafa</option>
                        </Select>
                    </div>
                )}
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                    Batal
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {initialData ? 'Simpan Perubahan' : 'Tambah Jamaah'}
                </Button>
            </div>
        </form>
    );
}
