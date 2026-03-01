import { useState, useEffect } from 'react';
import type { IMember } from '../../types';
import { memberService } from '../../services/memberService';
import { useTenant } from '../tenants/TenantContext';
import { Button } from '../../components/ui/Button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { MemberForm } from './components/MemberForm';
import { Search, Plus, Edit2, Trash2, Users, CheckCircle, TrendingUp, AlertCircle, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export function CongregationModule() {
    const { tenant: currentTenant } = useTenant();
    const [members, setMembers] = useState<IMember[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<IMember | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof IMember; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const loadMembers = async () => {
        if (!currentTenant) return;
        setIsLoading(true);
        const { data, error } = await memberService.getAllForTenant(currentTenant.id!);
        if (data) {
            setMembers(data);

            // Sync database values if they are legacy
            const legacyMembers = data.filter(m =>
                m.economic_status === 'Menengah Kebawah' ||
                m.economic_status === 'Menengah Keatas' ||
                m.economic_status === 'Kurang Mampu'
            );

            if (legacyMembers.length > 0) {
                for (const m of legacyMembers) {
                    let newStatus = m.economic_status;
                    if (m.economic_status === 'Menengah Kebawah' || m.economic_status === 'Kurang Mampu') {
                        newStatus = 'Tidak Mampu';
                    } else if (m.economic_status === 'Menengah Keatas') {
                        newStatus = 'Mampu';
                    }
                    await memberService.update(m.id!, { ...m, economic_status: newStatus });
                }
                // Reload after sync
                const { data: updatedData } = await memberService.getAllForTenant(currentTenant.id!);
                if (updatedData) setMembers(updatedData);
            }
        } else {
            console.error(error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadMembers();
    }, [currentTenant]);

    const handleOpenModal = (member?: IMember) => {
        setEditingMember(member || null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingMember(null);
        setIsModalOpen(false);
    };

    const handleSubmit = async (data: Omit<IMember, 'id'>) => {
        if (editingMember && editingMember.id) {
            await memberService.update(editingMember.id, data);
        } else {
            await memberService.createForTenant(currentTenant!.id!, data);
        }
        handleCloseModal();
        loadMembers();
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus data jamaah ini?')) {
            await memberService.delete(id);
            loadMembers();
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.phone_number?.includes(searchQuery) ||
        m.occupation?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedMembers = [...filteredMembers].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        const valA = a[key] || '';
        const valB = b[key] || '';

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof IMember) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const stats = {
        total: members.length,
        mampu: members.filter(m => m.economic_status === 'Mampu').length,
        menengah: members.filter(m => m.economic_status === 'Menengah').length,
        tidakMampu: members.filter(m => m.economic_status === 'Tidak Mampu').length,
    };

    // Pagination calculations
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const paginatedMembers = sortedMembers.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(sortedMembers.length / rowsPerPage);

    // Reset to first page when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, rowsPerPage]);

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Jamaah</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola data jamaah dan status kemustahikan.</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Jamaah
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Jamaah</p>
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</h4>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mampu</p>
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.mampu}</h4>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Menengah</p>
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.menengah}</h4>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tidak Mampu</p>
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.tidakMampu}</h4>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari nama atau telepon..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">No</TableHead>
                            <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:text-emerald-600">
                                <div className="flex items-center gap-1">
                                    Nama {sortConfig?.key === 'name' && <ArrowUpDown size={12} />}
                                </div>
                            </TableHead>
                            <TableHead>Kontak</TableHead>
                            <TableHead>Pekerjaan</TableHead>
                            <TableHead>Status Ekonomi</TableHead>
                            <TableHead>Mustahik</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-32 text-gray-500">
                                    Memuat data...
                                </TableCell>
                            </TableRow>
                        ) : filteredMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-32 text-gray-500">
                                    Tidak ada data jamaah ditemukan.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedMembers.map((member, index) => (
                                <TableRow key={member.id}>
                                    <TableCell className="text-gray-500 text-xs">
                                        {indexOfFirstRow + index + 1}
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900 dark:text-white">
                                        {member.name}
                                    </TableCell>
                                    <TableCell>
                                        {member.phone_number || '-'}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {member.occupation || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                            member.economic_status === 'Mampu' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
                                                member.economic_status === 'Menengah' ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
                                                    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                        )}>
                                            {member.economic_status}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {member.is_mustahik ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                {member.mustahik_category || 'Ya'}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenModal(member)}>
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id!)}>
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">Tampilkan</span>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="text-sm border border-gray-300 dark:border-gray-700 rounded bg-transparent px-2 py-1 focus:ring-2 focus:ring-emerald-500 outline-none"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <span className="text-sm text-gray-500">per halaman</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-sm text-gray-500">
                            Menampilkan <span className="font-medium text-gray-900 dark:text-white">{Math.min(indexOfFirstRow + 1, sortedMembers.length)}</span> - <span className="font-medium text-gray-900 dark:text-white">{Math.min(indexOfLastRow, sortedMembers.length)}</span> dari <span className="font-medium text-gray-900 dark:text-white">{sortedMembers.length}</span> data
                        </span>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    // Basic pagination logic to show current +/- 2 pages
                                    let pageNum = i + 1;
                                    if (totalPages > 5) {
                                        if (currentPage > 3) pageNum = currentPage - 3 + i + 1;
                                        if (pageNum > totalPages) pageNum = totalPages - 5 + i + 1;
                                    }

                                    if (pageNum <= 0) return null;

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? 'primary' : 'ghost'}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNum)}
                                            className="h-8 w-8 p-0 text-xs"
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingMember ? "Edit Data Jamaah" : "Tambah Jamaah Baru"}
            >
                {currentTenant && (
                    <MemberForm
                        initialData={editingMember}
                        tenantId={currentTenant.id!}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseModal}
                    />
                )}
            </Modal>
        </div>
    );
}

// Utility class wrapper for local usage until we abstract it from Button
function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}
