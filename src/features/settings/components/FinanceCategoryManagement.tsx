import React, { useState, useEffect } from 'react';
import { useTenant } from '../../tenants/TenantContext';
import { transactionCategoryService } from '../../../services/financeService';
import type { ITransactionCategory, TransactionType } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input, Select } from '../../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Modal } from '../../../components/ui/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const FinanceCategoryManagement: React.FC = () => {
    const { tenant } = useTenant();
    const [categories, setCategories] = useState<ITransactionCategory[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<ITransactionCategory>>({ type: 'INCOME' });
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        if (!tenant) return;
        const { data } = await transactionCategoryService.getAllForTenant(tenant.id!);
        if (data) setCategories(data);
    };

    useEffect(() => {
        loadData();
    }, [tenant]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant || !formData.name || !formData.type) return;

        setIsSaving(true);
        if (formData.id) {
            await transactionCategoryService.update(formData.id, formData);
        } else {
            await transactionCategoryService.createForTenant(tenant.id!, {
                name: formData.name,
                type: formData.type as TransactionType
            } as ITransactionCategory);
        }
        setIsSaving(false);
        setIsModalOpen(false);
        loadData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus kategori ini? (Catatan: Transaksi yang menggunakan kategori ini bisa kehilangan referensinya)')) return;
        await transactionCategoryService.delete(id);
        loadData();
    };

    const openForm = (cat?: ITransactionCategory) => {
        setFormData(cat ? { ...cat } : { name: '', type: 'INCOME' });
        setIsModalOpen(true);
    };

    const incomes = categories.filter(c => c.type === 'INCOME');
    const expenses = categories.filter(c => c.type === 'EXPENSE');

    const renderTable = (list: ITransactionCategory[], title: string, subtitle: string, ringColor: string) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mt-6">
            <div className={`border-l-4 ${ringColor} p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center`}>
                <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h4>
                    <p className="text-xs text-gray-500">{subtitle}</p>
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama Kategori</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {list.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center text-gray-500 h-24">Belum ada kategori.</TableCell>
                        </TableRow>
                    ) : list.map((cat) => (
                        <TableRow key={cat.id}>
                            <TableCell className="font-medium">{cat.name}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <button onClick={() => openForm(cat)} className="text-blue-600 hover:text-blue-800 p-1"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(cat.id!)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={16} /></button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Kategori Keuangan</h3>
                    <p className="text-sm text-gray-500">Kelola master data jenis pengeluaran dan pemasukan masjid.</p>
                </div>
                <Button onClick={() => openForm()} className="flex items-center gap-2 whitespace-nowrap shrink-0">
                    <Plus size={18} /> Tambah Kategori
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderTable(incomes, 'Pemasukan (Income)', 'Contoh: Infaq Jumat, Infaq Kotak Amal, Sedekah dsb.', 'border-emerald-500')}
                {renderTable(expenses, 'Pengeluaran (Expense)', 'Contoh: Operasional, Honor Penceramah, Listrik, PLN dsb.', 'border-orange-500')}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Kategori" : "Tambah Kategori Baru"}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Jenis</label>
                        <Select
                            required
                            value={formData.type || 'INCOME'}
                            onChange={e => setFormData({ ...formData, type: e.target.value as TransactionType })}
                        >
                            <option value="INCOME">Pemasukan (Income)</option>
                            <option value="EXPENSE">Pengeluaran (Expense)</option>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Kategori</label>
                        <Input
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Contoh: Honor Khotib"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isSaving}>Simpan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
