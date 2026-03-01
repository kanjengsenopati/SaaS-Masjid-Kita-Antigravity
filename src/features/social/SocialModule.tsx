import { useState, useEffect } from 'react';
import { donationProgramService, disbursementService } from '../../services/socialService';
import { memberService } from '../../services/memberService';
import { useTenant } from '../tenants/TenantContext';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { DonationProgramForm } from './components/DonationProgramForm';
import { DisbursementForm } from './components/DisbursementForm';
import { Plus, HeartHandshake, Receipt, Edit2, Trash2, Image as ImageIcon, Landmark, Users as UsersIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatDateTimeDDMMYYYY, formatDateDDMMYYYY } from '../../utils/formatters';
import { transactionService, transactionCategoryService } from '../../services/financeService';
import { donationService } from '../../services/donationService';
import type { IDisbursement, IDonationProgram, IMember, IDonatur, ITransaction } from '../../types';

export function SocialModule() {
    const { tenant: currentTenant } = useTenant();
    const [activeTab, setActiveTab] = useState<'programs' | 'disbursements'>('programs');

    // Data States
    const [programs, setPrograms] = useState<IDonationProgram[]>([]);
    const [disbursements, setDisbursements] = useState<IDisbursement[]>([]);
    const [members, setMembers] = useState<Record<number, IMember>>({});
    const [transactions, setTransactions] = useState<ITransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal States
    const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<IDonationProgram | null>(null);

    const [isDisbModalOpen, setIsDisbModalOpen] = useState(false);
    const [editingDisbursement, setEditingDisbursement] = useState<IDisbursement | null>(null);

    // Donor List State
    const [donors, setDonors] = useState<IDonatur[]>([]);
    const [isDonorListOpen, setIsDonorListOpen] = useState(false);
    const [selectedProgramForDonors, setSelectedProgramForDonors] = useState<IDonationProgram | null>(null);

    const loadData = async () => {
        if (!currentTenant) return;
        setIsLoading(true);

        // Load parallel
        const [progRes, disbRes, memRes, txRes] = await Promise.all([
            donationProgramService.getAllForTenant(currentTenant.id!),
            disbursementService.getAllForTenant(currentTenant.id!),
            memberService.getAllForTenant(currentTenant.id!),
            transactionService.getAllForTenant(currentTenant.id!)
        ]);

        if (progRes.data) setPrograms(progRes.data);
        if (disbRes.data) setDisbursements(disbRes.data);

        if (memRes.data) {
            const memberMap: Record<number, IMember> = {};
            memRes.data.forEach(m => {
                if (m.id) memberMap[m.id] = m;
            });
            setMembers(memberMap);
        }

        if (txRes.data) {
            setTransactions(txRes.data);
        }

        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [currentTenant]);

    // Handlers for Programs
    const handleOpenProgramModal = (program?: IDonationProgram) => {
        setEditingProgram(program || null);
        setIsProgramModalOpen(true);
    };

    const handleSubmitProgram = async (data: Omit<IDonationProgram, 'id'>) => {
        if (!currentTenant) return;

        // Handle Kas Masjid Transaction
        let transactionId = editingProgram?.transaction_id;
        if (data.funding_source === 'KAS_MASJID') {
            const categories = await transactionCategoryService.getAllForTenant(currentTenant.id!, 'EXPENSE');
            let categoryId = categories.data?.find(c => c.name.toLowerCase().includes('sosial') || c.name.toLowerCase().includes('santunan'))?.id;

            if (!categoryId && categories.data && categories.data.length > 0) {
                categoryId = categories.data[0].id;
            } else if (!categoryId) {
                const newCat = await transactionCategoryService.createForTenant(currentTenant.id!, {
                    name: 'Sosial & Santunan',
                    type: 'EXPENSE'
                });
                categoryId = newCat.data ?? undefined;
            }

            const txData = {
                tenant_id: currentTenant.id!,
                category_id: categoryId!,
                amount: data.target_amount || 0,
                type: 'EXPENSE' as const,
                date: new Date().toISOString().split('T')[0],
                description: `Dana Program: ${data.name}`,
                status: 'PENDING' as const
            };

            if (transactionId) {
                await transactionService.update(transactionId, txData);
            } else {
                const txRes = await transactionService.createForTenant(currentTenant.id!, txData);
                transactionId = txRes.data ?? undefined;
            }
        } else if (transactionId) {
            // Delete auto-transaction if switched away
            await transactionService.delete(transactionId);
            transactionId = undefined;
        }

        const payload = { ...data, transaction_id: transactionId };

        if (editingProgram && editingProgram.id) {
            await donationProgramService.update(editingProgram.id, payload);
        } else {
            await donationProgramService.createForTenant(currentTenant.id!, payload);
        }
        setIsProgramModalOpen(false);
        loadData();
    };

    const handleDeleteProgram = async (id: number) => {
        if (window.confirm('Hapus program santunan ini? Semua penyaluran dalam program ini bisa menjadi yatim (orphaned).')) {
            await donationProgramService.delete(id);
            loadData();
        }
    };

    // Handlers for Disbursements
    const handleOpenDisbModal = (disbursement?: IDisbursement) => {
        setEditingDisbursement(disbursement || null);
        setIsDisbModalOpen(true);
    };

    const handleSubmitDisb = async (data: Omit<IDisbursement, 'id'>) => {
        if (editingDisbursement && editingDisbursement.id) {
            await disbursementService.update(editingDisbursement.id, data);
        } else {
            await disbursementService.createForTenant(currentTenant!.id!, data);
        }
        setIsDisbModalOpen(false);
        loadData();
    };

    const handleDeleteDisb = async (id: number) => {
        if (window.confirm('Batalkan catatan penyaluran ini?')) {
            await disbursementService.delete(id);
            loadData();
        }
    };

    // Helper
    const getProgramName = (id: number) => programs.find(p => p.id === id)?.name || 'Unknown Program';
    const getMemberName = (id: number) => members[id]?.name || 'Unknown Member';

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sosial & Santunan</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola program bantuan ZISWAF dan penyalurannya ke Mustahik.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab('programs')}
                        className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'programs'
                            ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <HeartHandshake className="w-4 h-4" />
                        Program Santunan
                    </button>
                    <button
                        onClick={() => setActiveTab('disbursements')}
                        className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'disbursements'
                            ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <Receipt className="w-4 h-4" />
                        Catatan Penyaluran
                    </button>
                </div>

                {/* Programs Tab Content */}
                {activeTab === 'programs' && (
                    <div className="animate-in fade-in duration-200">
                        <div className="p-4 flex justify-end bg-gray-50/50 dark:bg-gray-800/20">
                            <Button onClick={() => handleOpenProgramModal()} size="sm">
                                <Plus className="w-4 h-4 mr-2" /> Program Baru
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama Program</TableHead>
                                    <TableHead>Sumber Dana</TableHead>
                                    <TableHead className="text-right">Target / Progress</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center h-32">Memuat data...</TableCell></TableRow>
                                ) : programs.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center h-32">Belum ada program santunan.</TableCell></TableRow>
                                ) : (
                                    programs.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>
                                                <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                                                <div className="text-xs text-gray-500 max-w-xs truncate">{p.description || '-'}</div>
                                            </TableCell>
                                            <TableCell>
                                                {p.funding_source === 'KAS_MASJID' ? (
                                                    <div className="flex flex-col gap-1">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                                                            <Landmark size={12} /> KAS MASJID
                                                        </span>
                                                        {(() => {
                                                            const tx = transactions.find(t => t.id === p.transaction_id);
                                                            if (!tx) return null;
                                                            if (tx.status === 'PENDING') return (
                                                                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 animate-pulse">
                                                                    <Clock size={10} /> PENDING
                                                                </span>
                                                            );
                                                            if (tx.status === 'APPROVED') return (
                                                                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                                                                    <CheckCircle2 size={10} /> APPROVED
                                                                </span>
                                                            );
                                                            return (
                                                                <span className="flex items-center gap-1 text-[9px] font-bold text-red-600">
                                                                    <AlertCircle size={10} /> REJECTED
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                                                        <HeartHandshake size={12} /> GALANG DONASI
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-bold">
                                                        {p.target_amount ? `Rp ${p.target_amount.toLocaleString('id-ID')}` : '-'}
                                                    </div>
                                                    {p.funding_source === 'GALANG_DONASI' && (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="w-24 bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
                                                                <div
                                                                    className="bg-orange-500 h-full transition-all"
                                                                    style={{ width: `${Math.min(Math.round(((p.current_amount || 0) / (p.target_amount || 1)) * 100), 100)}%` }}
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={async () => {
                                                                    const res = await donationService.getByProgramId(p.id!);
                                                                    if (res.data) setDonors(res.data);
                                                                    setSelectedProgramForDonors(p);
                                                                    setIsDonorListOpen(true);
                                                                }}
                                                                className="text-[10px] text-orange-600 hover:text-orange-700 font-medium flex items-center gap-0.5"
                                                            >
                                                                <UsersIcon size={10} /> {Math.min(Math.round(((p.current_amount || 0) / (p.target_amount || 1)) * 100), 100)}% Donatur
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {p.is_active !== false ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                                                        Selesai
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenProgramModal(p)}>
                                                        <Edit2 className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteProgram(p.id!)}>
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Disbursements Tab Content */}
                {activeTab === 'disbursements' && (
                    <div className="animate-in fade-in duration-200">
                        <div className="p-4 flex justify-end bg-gray-50/50 dark:bg-gray-800/20">
                            <Button onClick={() => handleOpenDisbModal()} size="sm">
                                <Plus className="w-4 h-4 mr-2" /> Catat Penyaluran
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Program</TableHead>
                                    <TableHead>Penerima (Mustahik)</TableHead>
                                    <TableHead className="text-right">Jumlah (Rp)</TableHead>
                                    <TableHead className="text-center">Bukti</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-32">Memuat data...</TableCell></TableRow>
                                ) : disbursements.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center h-32">Belum ada catatan penyaluran.</TableCell></TableRow>
                                ) : (
                                    disbursements.map(d => (
                                        <TableRow key={d.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {formatDateTimeDDMMYYYY(d.disbursed_at)}
                                            </TableCell>
                                            <TableCell>{getProgramName(d.program_id)}</TableCell>
                                            <TableCell className="font-medium text-emerald-700 dark:text-emerald-400">
                                                {getMemberName(d.member_id)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                Rp {d.amount.toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {d.proof_base64 ? (
                                                    <a href={d.proof_base64} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Lihat Bukti Foto">
                                                        <ImageIcon size={16} />
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-gray-400">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleOpenDisbModal(d)}>
                                                        <Edit2 className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteDisb(d.id!)}>
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal isOpen={isProgramModalOpen} onClose={() => setIsProgramModalOpen(false)} title={editingProgram ? "Edit Program Santunan" : "Program Santunan Baru"}>
                {currentTenant && (
                    <DonationProgramForm initialData={editingProgram} tenantId={currentTenant.id!} onSubmit={handleSubmitProgram} onCancel={() => setIsProgramModalOpen(false)} />
                )}
            </Modal>

            <Modal isOpen={isDisbModalOpen} onClose={() => setIsDisbModalOpen(false)} title={editingDisbursement ? "Edit Penyaluran" : "Catat Penyaluran Baru"}>
                {currentTenant && (
                    <DisbursementForm initialData={editingDisbursement} tenantId={currentTenant.id!} onSubmit={handleSubmitDisb} onCancel={() => setIsDisbModalOpen(false)} />
                )}
            </Modal>

            {/* Donor List Modal */}
            <Modal
                isOpen={isDonorListOpen}
                onClose={() => setIsDonorListOpen(false)}
                title={`Donatur Program: ${selectedProgramForDonors?.name}`}
                large
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/30">
                            <p className="text-xs text-orange-800 dark:text-orange-400 uppercase font-bold tracking-wider mb-1">Target Donasi</p>
                            <h4 className="text-lg font-bold text-orange-900 dark:text-orange-300">
                                Rp {selectedProgramForDonors?.target_amount?.toLocaleString('id-ID') || '0'}
                            </h4>
                        </div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                            <p className="text-xs text-emerald-800 dark:text-emerald-400 uppercase font-bold tracking-wider mb-1">Terkumpul ({Math.round(((selectedProgramForDonors?.current_amount || 0) / (selectedProgramForDonors?.target_amount || 1)) * 100)}%)</p>
                            <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">
                                Rp {selectedProgramForDonors?.current_amount?.toLocaleString('id-ID') || '0'}
                            </h4>
                        </div>
                    </div>

                    <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg">
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
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500 italic">Belum ada donasi masuk.</TableCell>
                                    </TableRow>
                                ) : (
                                    donors.map((d, i) => (
                                        <TableRow key={d.id}>
                                            <TableCell className="text-center text-xs text-gray-500">{i + 1}</TableCell>
                                            <TableCell className="font-medium">{d.name}</TableCell>
                                            <TableCell className="text-gray-500 text-sm">{formatDateDDMMYYYY(d.date)}</TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600">Rp {d.amount.toLocaleString('id-ID')}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
