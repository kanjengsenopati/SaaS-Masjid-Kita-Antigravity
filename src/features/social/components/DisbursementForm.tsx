import React, { useState, useEffect } from 'react';
import type { IDisbursement, IDonationProgram, IMember } from '../../../types';
import { memberService } from '../../../services/memberService';
import { donationProgramService } from '../../../services/socialService';
import { Button } from '../../../components/ui/Button';
import { Input, Select, Textarea } from '../../../components/ui/Input';
import { CurrencyInput } from '../../../components/ui/CurrencyInput';
import { FileImage, X } from 'lucide-react';

interface DisbursementFormProps {
    initialData?: IDisbursement | null;
    tenantId: number;
    onSubmit: (data: Omit<IDisbursement, 'id'>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export function DisbursementForm({ initialData, tenantId, onSubmit, onCancel, isLoading }: DisbursementFormProps) {
    const [members, setMembers] = useState<IMember[]>([]);
    const [programs, setPrograms] = useState<IDonationProgram[]>([]);
    const [formData, setFormData] = useState<Omit<IDisbursement, 'id' | 'tenant_id'>>({
        program_id: initialData?.program_id || 0,
        member_id: initialData?.member_id || 0,
        amount: initialData?.amount || 0,
        disbursed_at: initialData?.disbursed_at || new Date().toISOString().slice(0, 16),
        notes: initialData?.notes || '',
        proof_base64: initialData?.proof_base64 || '',
    });

    const [fileBase64, setFileBase64] = useState<string>(initialData?.proof_base64 || '');

    useEffect(() => {
        const loadDependencies = async () => {
            const [membersRes, programsRes] = await Promise.all([
                memberService.getAllForTenant(tenantId),
                donationProgramService.getAllForTenant(tenantId)
            ]);

            // Only show mustahik for disbursements to make it easier to select
            if (membersRes.data) {
                setMembers(membersRes.data.filter(m => m.is_mustahik));
            }
            if (programsRes.data) {
                // Filter out Completed programs (is_active === false)
                // We keep those with is_active === undefined (legacy active) or is_active === true
                const activePrograms = programsRes.data.filter(p => p.is_active !== false);
                setPrograms(activePrograms);

                // Auto-select first program if none selected and creating new
                if (!initialData?.program_id && activePrograms.length > 0) {
                    setFormData(prev => ({ ...prev, program_id: activePrograms[0].id! }));
                }
            }
        };

        loadDependencies();
    }, [tenantId, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'program_id' || name === 'member_id') {
            setFormData(prev => ({ ...prev, [name]: Number(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.program_id || !formData.member_id || !formData.amount) {
            alert("Harap isi Program, Penerima, dan Jumlah Dana.");
            return;
        }

        await onSubmit({
            ...formData,
            proof_base64: fileBase64 || formData.proof_base64,
            tenant_id: tenantId,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran foto maksimal 2MB.');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFileBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Select
                label="Program Santunan"
                name="program_id"
                value={formData.program_id}
                onChange={handleChange}
                required
            >
                <option value={0} disabled>Pilih Program...</option>
                {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </Select>

            <Select
                label="Diberikan Kepada (Mustahik)"
                name="member_id"
                value={formData.member_id}
                onChange={handleChange}
                required
            >
                <option value={0} disabled>Pilih Penerima Mustahik...</option>
                {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.mustahik_category})</option>
                ))}
            </Select>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nominal Penyaluran</label>
                    <CurrencyInput
                        required
                        value={formData.amount || 0}
                        onChangeValue={val => setFormData({ ...formData, amount: val })}
                        placeholder="Contoh: 500.000"
                    />
                </div>

                <Input
                    label="Tanggal Penyaluran"
                    name="disbursed_at"
                    type="datetime-local"
                    value={formData.disbursed_at}
                    onChange={handleChange}
                    required
                />
            </div>

            <Textarea
                label="Catatan Tambahan (Opsional)"
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                placeholder="Informasi tambahan mengenai penyaluran dana..."
            />

            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <label className="text-sm font-medium block">Bukti Penyaluran / Nota (Opsional)</label>
                <div className="flex items-center gap-4">
                    {fileBase64 ? (
                        <div className="relative">
                            <img src={fileBase64} alt="Bukti Penyaluran" className="w-16 h-16 rounded-lg object-cover border-2 border-emerald-100 dark:border-emerald-800" />
                            <button
                                type="button"
                                onClick={() => setFileBase64('')}
                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-400">
                            <FileImage size={24} />
                        </div>
                    )}
                    <div className="flex-1">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400 cursor-pointer"
                        />
                        <p className="text-xs text-gray-400 mt-1">Maksimal ukuran file 2MB.</p>
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-end space-x-2 border-t border-gray-100 dark:border-gray-800">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
                    Batal
                </Button>
                <Button type="submit" isLoading={isLoading} disabled={programs.length === 0 || members.length === 0}>
                    {initialData ? 'Simpan Perubahan' : 'Catat Penyaluran'}
                </Button>
            </div>

            {(programs.length === 0 || members.length === 0) && (
                <p className="text-sm text-red-500 text-center mt-2">
                    Ups! Pastikan sudah ada Program Santunan dan data Jamaah (dengan status Mustahik) sebelum membuat catatan penyaluran.
                </p>
            )}
        </form>
    );
}
