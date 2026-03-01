import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../tenants/TenantContext';
import { agendaService } from '../../services/agendaService';
import { asatidzService } from '../../services/asatidzService';
import type { IAgenda, IAsatidz, IDonatur } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Trash2, Pencil, Calendar, Clock, FileText, Download, HeartHandshake, User, Landmark, Users as UsersIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { transactionService, transactionCategoryService } from '../../services/financeService';
import { donationService } from '../../services/donationService';
import clsx from 'clsx';
import { formatDateDDMMYYYY } from '../../utils/formatters';

const formatRp = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const AgendaModule: React.FC = () => {
    const { tenant } = useTenant();
    const [agendas, setAgendas] = useState<IAgenda[]>([]);
    const [asatidzList, setAsatidzList] = useState<IAsatidz[]>([]);
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<IAgenda>>({
        is_fundraising_open: false,
        show_progress_public: false,
        show_progress_admin: false,
        funding_source: 'GALANG_DONASI', // Default to fundraising
        start_date: new Date().toISOString().split('T')[0]
    });

    const [donors, setDonors] = useState<IDonatur[]>([]);
    const [isDonorListOpen, setIsDonorListOpen] = useState(false);
    const [selectedAgendaForDonors, setSelectedAgendaForDonors] = useState<IAgenda | null>(null);

    const [fileName, setFileName] = useState<string>('');
    const [fileBase64, setFileBase64] = useState<string>('');

    const loadData = async () => {
        if (!tenant) return;
        setIsLoading(true);

        const [agendaRes, asatidzRes, transactionsRes] = await Promise.all([
            agendaService.getAllForTenant(tenant.id!),
            asatidzService.getAllForTenant(tenant.id!),
            transactionService.getAllForTenant(tenant.id!)
        ]);

        if (agendaRes.data) {
            agendaRes.data.sort((a, b) => b.start_date.localeCompare(a.start_date));
            setAgendas(agendaRes.data);
        }

        if (asatidzRes.data) {
            setAsatidzList(asatidzRes.data);
        }

        if (transactionsRes.data) {
            setTransactions(transactionsRes.data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [tenant]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check size (limit to ~2MB to save IndexedDB quota)
        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setFileName(file.name);

        const reader = new FileReader();
        reader.onloadend = () => {
            setFileBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant || !formData.title || !formData.start_date || !formData.description) return;

        setIsSaving(true);

        // Handle Kas Masjid Transaction
        let transactionId = formData.transaction_id;
        if (formData.funding_source === 'KAS_MASJID') {
            const categories = await transactionCategoryService.getAllForTenant(tenant.id!, 'EXPENSE');
            let categoryId = categories.data?.find(c => c.name.toLowerCase().includes('agenda'))?.id;

            if (!categoryId && categories.data && categories.data.length > 0) {
                categoryId = categories.data[0].id;
            } else if (!categoryId) {
                const newCat = await transactionCategoryService.createForTenant(tenant.id!, {
                    name: 'Kegiatan & Agenda',
                    type: 'EXPENSE'
                });
                categoryId = newCat.data ?? undefined;
            }

            const txData = {
                tenant_id: tenant.id!,
                category_id: categoryId!,
                amount: formData.target_amount || 0,
                type: 'EXPENSE' as const,
                date: formData.start_date,
                description: `Dana Kas untuk: ${formData.title}`,
                status: 'PENDING' as const
            };

            if (transactionId) {
                await transactionService.update(transactionId, txData);
            } else {
                const txRes = await transactionService.createForTenant(tenant.id!, txData);
                transactionId = txRes.data ?? undefined;
            }
        } else if (transactionId) {
            // If switched away from Kas Masjid, delete the auto-transaction
            await transactionService.delete(transactionId);
            transactionId = undefined;
        }

        const payload: Partial<IAgenda> = {
            ...formData,
            transaction_id: transactionId,
            document_base64: fileBase64 || formData.document_base64,
            document_name: fileName || formData.document_name,
            created_at: formData.created_at || new Date().toISOString()
        };

        if (payload.id) {
            await agendaService.update(payload.id, payload);
        } else {
            await agendaService.createForTenant(tenant.id!, payload as IAgenda);
        }

        setIsSaving(false);
        setIsModalOpen(false);
        resetForm();
        loadData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus agenda kegiatan ini secara permanen?')) return;
        await agendaService.delete(id);
        loadData();
    };

    const openForm = (agenda?: IAgenda) => {
        if (agenda) {
            setFormData({ ...agenda });
            setFileName(agenda.document_name || '');
            setFileBase64(agenda.document_base64 || '');
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            asatidz_id: undefined,
            is_fundraising_open: false,
            target_amount: 0,
            current_amount: 0,
            show_progress_public: false,
            show_progress_admin: false
        });
        setFileName('');
        setFileBase64('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const downloadFile = (base64: string, name: string) => {
        const a = document.createElement('a');
        a.href = base64;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    if (!tenant) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-400">Agenda & Kegiatan</h3>
                    <p className="text-sm text-gray-500">Kelola jadwal kegiatan masjid, pengumuman, dan galang dana.</p>
                </div>
                <Button onClick={() => openForm()} className="flex items-center gap-2">
                    <Plus size={18} /> Buat Agenda
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Agenda</TableHead>
                            <TableHead>Tanggal Pelaksanaan</TableHead>
                            <TableHead>Berkas / Dokumen</TableHead>
                            <TableHead>Pendanaan (Donasi)</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agendas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-gray-500 h-32">
                                    Belum ada agenda kegiatan yang dibuat.
                                </TableCell>
                            </TableRow>
                        ) : agendas.map((ag) => (
                            <TableRow key={ag.id}>
                                <TableCell>
                                    <div className="font-semibold text-gray-900 dark:text-white mb-1">{ag.title}</div>
                                    {ag.asatidz_id && (
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1 bg-emerald-50 dark:bg-emerald-900/30 w-fit px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-800">
                                            <User size={12} />
                                            Pemateri: {asatidzList.find(a => a.id === ag.asatidz_id)?.name || 'Ustadz Terhapus'}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500 max-w-xs truncate" title={ag.description}>{ag.description}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                        <Calendar size={14} className="text-emerald-600" />
                                        {formatDateDDMMYYYY(ag.start_date)} {ag.end_date && `s/d ${formatDateDDMMYYYY(ag.end_date)}`}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {ag.document_base64 ? (
                                        <button
                                            onClick={() => downloadFile(ag.document_base64!, ag.document_name || 'berkas')}
                                            className="flex items-center gap-1.5 text-xs px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-md border border-blue-200 dark:border-blue-800 transition-colors"
                                        >
                                            <Download size={12} /> {ag.document_name}
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1.5">
                                        {ag.funding_source === 'KAS_MASJID' ? (
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800/30 w-fit">
                                                    <Landmark size={14} />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Kas Masjid</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                                        Rp {ag.target_amount?.toLocaleString('id-ID')}
                                                    </span>
                                                    {(() => {
                                                        const tx = transactions.find(t => t.id === ag.transaction_id);
                                                        if (!tx) return null;
                                                        if (tx.status === 'PENDING') return (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 animate-pulse">
                                                                <Clock size={10} /> PENDING
                                                            </span>
                                                        );
                                                        if (tx.status === 'APPROVED') return (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                                <CheckCircle2 size={10} /> OK
                                                            </span>
                                                        );
                                                        return (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                                                                <AlertCircle size={10} /> REJECTED
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-full">
                                                        <HeartHandshake size={12} />
                                                        Donasi: {formatRp(ag.target_amount || 0)}
                                                    </span>
                                                    <button
                                                        onClick={async () => {
                                                            const res = await donationService.getByAgendaId(ag.id!);
                                                            if (res.data) setDonors(res.data);
                                                            setSelectedAgendaForDonors(ag);
                                                            setIsDonorListOpen(true);
                                                        }}
                                                        className="text-[10px] text-orange-600 hover:underline flex items-center gap-0.5"
                                                    >
                                                        <UsersIcon size={12} /> Donatur
                                                    </button>
                                                </div>
                                                {ag.show_progress_admin && (
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[10px] text-gray-500">
                                                            <span>{Math.min(Math.round(((ag.current_amount || 0) / (ag.target_amount || 1)) * 100), 100)}%</span>
                                                            <span>{formatRp(ag.current_amount || 0)}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                                            <div
                                                                className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(((ag.current_amount || 0) / (ag.target_amount || 1)) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <button onClick={() => openForm(ag)} className="text-gray-400 hover:text-blue-600 p-1" title="Edit Agenda"><Pencil size={16} /></button>
                                    <button onClick={() => handleDelete(ag.id!)} className="text-gray-400 hover:text-red-600 p-1" title="Hapus Agenda"><Trash2 size={16} /></button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>



            {/* Donor List Modal */}
            <Modal
                isOpen={isDonorListOpen}
                onClose={() => setIsDonorListOpen(false)}
                title={`Daftar Donatur: ${selectedAgendaForDonors?.title}`}
                large
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Target Dana</p>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{formatRp(selectedAgendaForDonors?.target_amount || 0)}</h4>
                        </div>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/30">
                            <p className="text-xs text-orange-800 dark:text-orange-400 uppercase font-bold tracking-wider mb-1">Terkumpul</p>
                            <div className="flex items-end justify-between">
                                <h4 className="text-lg font-bold text-orange-900 dark:text-orange-300">{formatRp(selectedAgendaForDonors?.current_amount || 0)}</h4>
                                <span className="text-xs font-bold text-orange-600 mb-1">{Math.round(((selectedAgendaForDonors?.current_amount || 0) / (selectedAgendaForDonors?.target_amount || 1)) * 100)}%</span>
                            </div>
                        </div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                            <p className="text-xs text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-wider mb-1">Total Donatur</p>
                            <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">{donors.length} Orang</h4>
                        </div>
                    </div>

                    <div className="overflow-hidden border border-gray-100 dark:border-gray-800 rounded-lg shadow-sm">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12 text-center">No</TableHead>
                                    <TableHead>Nama Donatur</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">Nominal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {donors.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-gray-500 italic">
                                            Belum ada donasi yang tercatat untuk agenda ini.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    donors.map((d, i) => (
                                        <TableRow key={d.id}>
                                            <TableCell className="text-center text-xs text-gray-500">{i + 1}</TableCell>
                                            <TableCell className="font-semibold text-gray-900 dark:text-white">{d.name}</TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400 text-sm">{formatDateDDMMYYYY(d.date)}</TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">{formatRp(d.amount)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button variant="ghost" onClick={() => setIsDonorListOpen(false)}>Tutup</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Detail Agenda Kegiatan" large>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Judul Kegiatan <span className="text-red-500">*</span></label>
                        <Input
                            required
                            value={formData.title || ''}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Contoh: Tabligh Akbar Muharram / Renovasi Kubah"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tanggal Mulai <span className="text-red-500">*</span></label>
                            <Input
                                type="date"
                                required
                                value={formData.start_date || ''}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tanggal Selesai (Opsional)</label>
                            <Input
                                type="date"
                                value={formData.end_date || ''}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium block">Pilih Pemateri / Da'i (Opsional)</label>
                        <select
                            value={formData.asatidz_id || ''}
                            onChange={(e) => setFormData({ ...formData, asatidz_id: e.target.value ? Number(e.target.value) : undefined })}
                            className="w-full h-10 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        >
                            <option value="">-- Tidak ada Pemateri --</option>
                            {asatidzList.map(ustadz => (
                                <option key={ustadz.id} value={ustadz.id}>Ustadz {ustadz.name} {ustadz.specialization ? `(${ustadz.specialization})` : ''}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500">Anda dapat menambah data ustadz baru di menu Data Asatidz.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Deskripsi Lengkap <span className="text-red-500">*</span></label>
                        <Textarea
                            required
                            rows={4}
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Berikan penjelasan lengkap mengenai agenda ini agar jamaah memahaminya..."
                        />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <label className="text-sm font-medium block">Lampirkan PDF / Poster (Maks 2MB)</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="file"
                                accept="application/pdf,image/*"
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400 cursor-pointer"
                            />
                            {fileName && <span className="text-xs text-blue-600 flex items-center gap-1"><FileText size={14} /> {fileName}</span>}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                            <label className="text-sm font-medium block">Sumber Pendanaan Kegiatan</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, funding_source: 'KAS_MASJID', is_fundraising_open: false })}
                                    className={clsx(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        formData.funding_source === 'KAS_MASJID'
                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                            : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                                    )}
                                >
                                    <Landmark className={clsx(formData.funding_source === 'KAS_MASJID' ? "text-emerald-600" : "text-gray-400")} />
                                    <span className="text-sm font-semibold">Kas Masjid</span>
                                    <p className="text-[10px] text-gray-500 text-center leading-tight">Biaya kegiatan diambil langsung dari saldo kas masjid.</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, funding_source: 'GALANG_DONASI', is_fundraising_open: true })}
                                    className={clsx(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        formData.funding_source === 'GALANG_DONASI'
                                            ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                            : "border-gray-100 dark:border-gray-800 hover:border-gray-200"
                                    )}
                                >
                                    <HeartHandshake className={clsx(formData.funding_source === 'GALANG_DONASI' ? "text-orange-600" : "text-gray-400")} />
                                    <span className="text-sm font-semibold">Galang Donasi</span>
                                    <p className="text-[10px] text-gray-500 text-center leading-tight">Membuka kesempatan jamaah untuk berdonasi sukarela.</p>
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            {formData.funding_source === 'KAS_MASJID' ? (
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                                    <label className="text-sm font-medium text-emerald-900 dark:text-emerald-400">Estimasi Biaya / Anggaran (Rp) <span className="text-red-500">*</span></label>
                                    <div className="mt-2">
                                        <CurrencyInput
                                            required
                                            value={formData.target_amount || 0}
                                            onChangeValue={val => setFormData({ ...formData, target_amount: val })}
                                            placeholder="Contoh: 5.000.000"
                                        />
                                    </div>
                                    <p className="text-xs text-emerald-700/70 dark:text-emerald-500/70 mt-2">
                                        Sistem akan secara otomatis mencatat pengeluaran di modul Kas & Keuangan.
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900/30 space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-orange-900 dark:text-orange-400 flex items-center gap-2">
                                            <HeartHandshake size={16} /> Pengaturan Galang Dana
                                        </h4>
                                        <p className="text-xs text-orange-700/70 dark:text-orange-500/70 mt-1">Kelola target dan visibilitas donatur untuk kegiatan ini.</p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-orange-900 dark:text-orange-400">Target Pendanaan</label>
                                            <CurrencyInput
                                                required={formData.funding_source === 'GALANG_DONASI'}
                                                value={formData.target_amount || 0}
                                                onChangeValue={val => setFormData({ ...formData, target_amount: val })}
                                                placeholder="Contoh: 10.000.000"
                                                className="border-orange-200 focus:ring-orange-500 dark:border-orange-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-orange-900 dark:text-orange-400">Dana Terkumpul Saat Ini</label>
                                            <CurrencyInput
                                                value={formData.current_amount || 0}
                                                onChangeValue={val => setFormData({ ...formData, current_amount: val })}
                                                placeholder="Contoh: 2.500.000"
                                                className="border-orange-200 focus:ring-orange-500 dark:border-orange-800"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-orange-200/50 dark:border-orange-800/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-orange-800 dark:text-orange-300 font-medium">Tampilkan Progress ke Publik</span>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={formData.show_progress_public}
                                                onClick={() => setFormData({ ...formData, show_progress_public: !formData.show_progress_public })}
                                                className={clsx(
                                                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                                    formData.show_progress_public ? "bg-orange-500" : "bg-orange-200 dark:bg-gray-700"
                                                )}
                                            >
                                                <span className={clsx(
                                                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                    formData.show_progress_public ? "translate-x-4" : "translate-x-0"
                                                )} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-orange-800 dark:text-orange-300 font-medium">Tampilkan di Tabel Pengurus</span>
                                            <button
                                                type="button"
                                                role="switch"
                                                aria-checked={formData.show_progress_admin}
                                                onClick={() => setFormData({ ...formData, show_progress_admin: !formData.show_progress_admin })}
                                                className={clsx(
                                                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                                    formData.show_progress_admin ? "bg-orange-500" : "bg-orange-200 dark:bg-gray-700"
                                                )}
                                            >
                                                <span className={clsx(
                                                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                    formData.show_progress_admin ? "translate-x-4" : "translate-x-0"
                                                )} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isSaving}>Simpan Keputusan</Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};
