import React, { useState, useEffect } from 'react';
import { useTenant } from '../tenants/TenantContext';
import { transactionService, transactionCategoryService } from '../../services/financeService';
import type { ITransaction, ITransactionCategory, TransactionType } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, Image as ImageIcon, X, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDateDDMMYYYY } from '../../utils/formatters';

// Simple Rupiah formatter - strictly no decimals
const formatRp = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

export const FinanceModule: React.FC = () => {
    const { tenant } = useTenant();
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [categories, setCategories] = useState<ITransactionCategory[]>([]);

    // Summary
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [balance, setBalance] = useState(0);
    const [chartData, setChartData] = useState<any[]>([]);

    // Form
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<ITransaction>>({
        type: 'INCOME',
        date: new Date().toISOString().split('T')[0]
    });

    const loadData = async () => {
        if (!tenant) return;

        // Load configurations
        const { data: cats } = await transactionCategoryService.getAllForTenant(tenant.id!);
        if (cats) setCategories(cats);

        // Load all transactions for tenant (In a real app, you'd paginate or filter by month)
        const { data: txs } = await transactionService.getAllForTenant(tenant.id!);
        if (!txs) return;

        // Sort descending by date
        txs.sort((a, b) => b.date.localeCompare(a.date));
        setTransactions(txs);

        // Calculate Totals (Only from APPROVED transactions)
        let income = 0;
        let expense = 0;
        txs.forEach(t => {
            if (t.status === 'APPROVED') {
                if (t.type === 'INCOME') income += t.amount;
                else expense += t.amount;
            }
        });

        setTotalIncome(income);
        setTotalExpense(expense);
        setBalance(income - expense);

        // Generate Chart Data (Group by Date)
        const grouped = txs.reduce((acc, tx) => {
            if (!acc[tx.date]) acc[tx.date] = { date: tx.date, income: 0, expense: 0 };
            if (tx.type === 'INCOME') acc[tx.date].income += tx.amount;
            else acc[tx.date].expense += tx.amount;
            return acc;
        }, {} as Record<string, { date: string, income: number, expense: number }>);

        // Sort ascending for the chart
        const sortedData = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
        setChartData(sortedData);
    };

    useEffect(() => {
        loadData();
    }, [tenant]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant || !formData.amount || !formData.category_id || !formData.date || !formData.type) return;

        setIsSaving(true);
        await transactionService.createForTenant(tenant.id!, {
            amount: Number(formData.amount),
            category_id: Number(formData.category_id),
            date: formData.date,
            type: formData.type as TransactionType,
            description: formData.description || '',
            proof_base64: formData.proof_base64 || undefined,
            status: 'APPROVED' // Manual entries by treasurer are auto-approved
        } as ITransaction);

        setIsSaving(false);
        setIsModalOpen(false);
        setFormData({ type: 'INCOME', date: new Date().toISOString().split('T')[0] });
        loadData();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation for size (Max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran gambar maksimal 2MB!");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, proof_base64: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus rincian transaksi ini permanen?')) return;
        await transactionService.delete(id);
        loadData();
    };

    if (!tenant) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-400">Keuangan Masjid</h3>
                    <p className="text-sm text-gray-500">Ringkasan kas, pemasukan, dan arus pengeluaran.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                    <Plus size={18} /> Catat Transaksi
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Wallet size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Saldo Kas</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white truncate" title={formatRp(balance)}>{formatRp(balance)}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pemasukan</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white truncate" title={formatRp(totalIncome)}>{formatRp(totalIncome)}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                            <TrendingDown size={20} />
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pengeluaran</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white truncate" title={formatRp(totalExpense)}>{formatRp(totalExpense)}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-6">Grafik Arus Kas (Harian)</h4>
                <div className="h-72 w-full">
                    {chartData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400">Belum ada data grafik.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatDateDDMMYYYY} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value / 1000} k`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <Tooltip formatter={(value: any) => formatRp(value || 0)} labelFormatter={(label) => `Tanggal: ${formatDateDDMMYYYY(label)} `} />
                                <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                                <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Riwayat Transaksi</h4>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Keterangan</TableHead>
                            <TableHead>Bukti</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Nominal</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-gray-500 h-32">
                                    Belum ada transaksi tercatat.
                                </TableCell>
                            </TableRow>
                        ) : transactions.map((tx) => {
                            const category = categories.find(c => c.id === tx.category_id);
                            return (
                                <TableRow key={tx.id}>
                                    <TableCell className="text-sm min-w-max whitespace-nowrap">{formatDateDDMMYYYY(tx.date)}</TableCell>
                                    <TableCell>
                                        <span className={`px - 2 py - 1 text - xs rounded - full font - medium ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'} `}>
                                            {tx.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="font-medium text-sm">{category?.name || 'Kategori Terhapus'}</TableCell>
                                    <TableCell className="text-sm max-w-xs truncate" title={tx.description}>{tx.description || '-'}</TableCell>
                                    <TableCell>
                                        {tx.proof_base64 ? (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    const w = window.open('about:blank');
                                                    setTimeout(() => {
                                                        if (w) w.document.write(`<iframe src="${tx.proof_base64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                                                    }, 0);
                                                }}
                                                className="h-8 px-2 text-xs flex items-center gap-1"
                                            >
                                                <ImageIcon size={14} /> Lihat Foto
                                            </Button>
                                        ) : <span className="text-gray-400 text-xs italic">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        {tx.status === 'PENDING' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse">
                                                MENUNGGU
                                            </span>
                                        ) : tx.status === 'APPROVED' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                                DISETUJUI
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                                                DITOLAK
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                        {tx.type === 'INCOME' ? '+' : '-'}{formatRp(tx.amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {tx.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={async () => {
                                                            await transactionService.update(tx.id!, { status: 'APPROVED' });
                                                            loadData();
                                                        }}
                                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                        title="Setujui"
                                                    >
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Tolak transaksi ini?')) {
                                                                await transactionService.update(tx.id!, { status: 'REJECTED' });
                                                                loadData();
                                                            }
                                                        }}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Tolak"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => handleDelete(tx.id!)} className="text-gray-400 hover:text-red-600 p-1" title="Hapus">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pencatatan Transaksi">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Jenis Transaksi</label>
                            <Select
                                required
                                value={formData.type || 'INCOME'}
                                onChange={e => {
                                    setFormData({ ...formData, type: e.target.value as TransactionType, category_id: undefined });
                                }}
                            >
                                <option value="INCOME">Pemasukan (Masuk ke Kas)</option>
                                <option value="EXPENSE">Pengeluaran (Keluar dari Kas)</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tanggal</label>
                            <Input
                                type="date"
                                required
                                value={formData.date || ''}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Kategori</label>
                        <Select
                            required
                            value={formData.category_id || ''}
                            onChange={e => setFormData({ ...formData, category_id: Number(e.target.value) })}
                        >
                            <option value="">-- Pilih Kategori --</option>
                            {categories.filter(c => c.type === formData.type).map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nominal Transfer / Tunai</label>
                        <CurrencyInput
                            required
                            value={formData.amount}
                            onChangeValue={val => setFormData({ ...formData, amount: val })}
                            placeholder="Contoh: 50.000"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Keterangan / Catatan</label>
                        <Input
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Opsional"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Upload Bukti Transaksi (Opsional)</label>
                        {formData.proof_base64 ? (
                            <div className="relative inline-block border rounded-lg overflow-hidden group">
                                <img src={formData.proof_base64} alt="Bukti Transaksi" className="h-32 w-auto object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => { const { proof_base64, ...rest } = p; return rest; })}
                                        className="text-white hover:text-red-400 p-2 bg-black/50 rounded-full transition-colors"
                                        title="Hapus Bukti"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                <div className="space-y-1 text-center">
                                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                        <label htmlFor="proof-upload" className="relative cursor-pointer bg-transparent rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none px-1">
                                            <span>Upload a file</span>
                                            <input id="proof-upload" name="proof-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-6">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isSaving}>Simpan Transaksi</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
