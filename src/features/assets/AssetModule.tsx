import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../tenants/TenantContext';
import { assetService } from '../../services/assetService';
import type { IAsset } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Trash2, Edit2, Archive, MapPin, Box, ImageIcon, X, Image as FileImage } from 'lucide-react';
import clsx from 'clsx';

const ASSET_CATEGORIES = [
    'Elektronik & Perangkat AC',
    'Sistem Suara (Sound System)',
    'Perlengkapan Ibadah (Karpet, Mimbar)',
    'Furnitur & Rak',
    'Kendaraan',
    'Peralatan Kebersihan',
    'Bangunan & Tanah',
    'Lainnya'
];

const ASSET_CONDITIONS = [
    'Baik',
    'Rusak Ringan',
    'Rusak Berat'
];

const ASSET_SOURCES = [
    'Pembelian Kas Masjid',
    'Wakaf',
    'Hibah / Donasi Barang',
    'Lainnya'
];

export const AssetModule: React.FC = () => {
    const { tenant } = useTenant();
    const [assets, setAssets] = useState<IAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter State
    const [filterCondition, setFilterCondition] = useState<string>('all');

    // Form State
    const [formData, setFormData] = useState<Partial<IAsset>>({
        category: ASSET_CATEGORIES[0],
        condition: ASSET_CONDITIONS[0],
        source: ASSET_SOURCES[0],
        acquisition_date: new Date().toISOString().split('T')[0],
        quantity: 1
    });

    const [fileBase64, setFileBase64] = useState<string>('');

    const loadData = async () => {
        if (!tenant) return;
        setIsLoading(true);
        const { data } = await assetService.getAllForTenant(tenant.id!);
        if (data) {
            data.sort((a, b) => b.created_at.localeCompare(a.created_at));
            setAssets(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [tenant]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran foto maksimal 2MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFileBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenant || !formData.name || !formData.category || !formData.condition) return;

        setIsSaving(true);

        const payload: Partial<IAsset> = {
            ...formData,
            photo_base64: fileBase64 || formData.photo_base64,
        };

        let result;
        if (payload.id) {
            result = await assetService.update(payload.id, payload);
        } else {
            result = await assetService.createForTenant(tenant.id!, payload as IAsset);
        }

        if (result.error) {
            alert(`Gagal menyimpan aset: ${result.error}`);
        } else {
            setIsModalOpen(false);
            resetForm();
            loadData();
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus aset masjid ini secara permanen?')) return;
        await assetService.delete(id);
        loadData();
    };

    const openForm = (asset?: IAsset) => {
        if (asset) {
            setFormData({ ...asset });
            setFileBase64(asset.photo_base64 || '');
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: ASSET_CATEGORIES[0],
            quantity: 1,
            condition: ASSET_CONDITIONS[0],
            acquisition_date: new Date().toISOString().split('T')[0],
            acquisition_cost: 0,
            source: ASSET_SOURCES[0],
            location: '',
            notes: '',
        });
        setFileBase64('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const filteredAssets = assets.filter(a => {
        if (filterCondition !== 'all' && a.condition !== filterCondition) return false;
        return true;
    });

    if (!tenant) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
                        <Archive className="w-6 h-6" /> Aset Masjid
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Kelola inventaris, barang wakaf, dan aset fisik masjid.</p>
                </div>
                <Button onClick={() => openForm()} className="flex items-center gap-2">
                    <Plus size={18} /> Tambah Aset
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex gap-2 text-sm">
                        <button
                            onClick={() => setFilterCondition('all')}
                            className={clsx(
                                "px-3 py-1.5 rounded-md font-medium transition-colors",
                                filterCondition === 'all' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}>Semua</button>
                        <button
                            onClick={() => setFilterCondition('Baik')}
                            className={clsx(
                                "px-3 py-1.5 rounded-md font-medium transition-colors",
                                filterCondition === 'Baik' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}>Kondisi Baik</button>
                        <button
                            onClick={() => setFilterCondition('Rusak Ringan')}
                            className={clsx(
                                "px-3 py-1.5 rounded-md font-medium transition-colors",
                                filterCondition === 'Rusak Ringan' ? "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}>Rusak Ringan</button>
                        <button
                            onClick={() => setFilterCondition('Rusak Berat')}
                            className={clsx(
                                "px-3 py-1.5 rounded-md font-medium transition-colors",
                                filterCondition === 'Rusak Berat' ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}>Rusak Berat</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Foto</TableHead>
                                <TableHead>Informasi Aset</TableHead>
                                <TableHead>Kategori & Lokasi</TableHead>
                                <TableHead className="text-center">Jumlah</TableHead>
                                <TableHead className="text-center">Kondisi</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 h-32">Memuat data aset...</TableCell>
                                </TableRow>
                            ) : filteredAssets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 h-32">
                                        Data aset kosong atau tidak ditemukan dengan filter saat ini.
                                    </TableCell>
                                </TableRow>
                            ) : filteredAssets.map((asset) => (
                                <TableRow key={asset.id}>
                                    <TableCell>
                                        {asset.photo_base64 ? (
                                            <a href={asset.photo_base64} target="_blank" rel="noopener noreferrer">
                                                <img src={asset.photo_base64} alt={asset.name} className="w-12 h-12 rounded object-cover border border-gray-200 dark:border-gray-700 hover:opacity-80 transition-opacity cursor-pointer" />
                                            </a>
                                        ) : (
                                            <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold text-gray-900 dark:text-white">{asset.name}</div>
                                        <div className="text-xs text-gray-500 line-clamp-1 truncate max-w-[200px]" title={asset.notes}>{asset.notes || '-'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                                            <Box size={14} className="text-emerald-600" />
                                            {asset.category}
                                        </div>
                                        {asset.location && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                <MapPin size={12} />
                                                {asset.location}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center font-medium">
                                        {asset.quantity}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className={clsx(
                                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                            asset.condition === 'Baik' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                asset.condition === 'Rusak Ringan' ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" :
                                                    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                        )}>
                                            {asset.condition}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openForm(asset)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(asset.id!)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Data Aset" : "Tambah Aset Baru"} large>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium block">Foto Aset (Opsional)</label>
                        <div className="flex items-center gap-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/30">
                            {fileBase64 ? (
                                <div className="relative shrink-0">
                                    <img src={fileBase64} alt="Preview" className="w-24 h-24 rounded-lg object-cover border border-emerald-100 dark:border-emerald-800 shadow-sm" />
                                    <button
                                        type="button"
                                        onClick={() => setFileBase64('')}
                                        className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 border border-white shadow-sm hover:bg-red-200"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 shrink-0 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400">
                                    <FileImage size={28} className="mb-1 opacity-50" />
                                    <span className="text-[10px] uppercase font-semibold">Foto Aset</span>
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400 cursor-pointer transition-colors"
                                />
                                <p className="text-xs text-gray-400 mt-2">Format: JPG, PNG. Maksimal 2MB untuk menjaga limit kuota offline Anda.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Nama Barang / Aset"
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Contoh: AC Daikin 2PK / Mimbar Jati"
                        />
                        <Select
                            label="Kategori"
                            required
                            value={formData.category || ''}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Jumlah Unit</label>
                            <Input
                                type="number"
                                min={1}
                                required
                                value={formData.quantity || 1}
                                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                            />
                        </div>
                        <Select
                            label="Kondisi"
                            required
                            value={formData.condition || ''}
                            onChange={e => setFormData({ ...formData, condition: e.target.value })}
                        >
                            {ASSET_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                        <Select
                            label="Sumber Aset"
                            required
                            value={formData.source || ''}
                            onChange={e => setFormData({ ...formData, source: e.target.value })}
                            className="col-span-2"
                        >
                            {ASSET_SOURCES.map(c => <option key={c} value={c}>{c}</option>)}
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Tanggal Masuk / Perolehan"
                            type="date"
                            required
                            value={formData.acquisition_date || ''}
                            onChange={e => setFormData({ ...formData, acquisition_date: e.target.value })}
                        />
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Harga Perolehan (Opsional)</label>
                            <CurrencyInput
                                value={formData.acquisition_cost || 0}
                                onChangeValue={val => setFormData({ ...formData, acquisition_cost: val })}
                                placeholder="Rp 0"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Input
                            label="Lokasi Penyimpanan"
                            value={formData.location || ''}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Contoh: Gudang Bawah, Ruang Utama Pria..."
                        />
                        <Textarea
                            label="Catatan / Spesifikasi Tambahan"
                            rows={3}
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Informasi tipe, nomor seri, kelengkapan surat..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isSaving}>{formData.id ? 'Simpan Perubahan' : 'Tambah Aset'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
