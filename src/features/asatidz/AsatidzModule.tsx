import React, { useState, useEffect, useRef } from 'react';
import { useTenant } from '../tenants/TenantContext';
import { asatidzService } from '../../services/asatidzService';
import type { IAsatidz } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Plus, Trash2, Edit2, User, Phone, BookOpen, FileImage } from 'lucide-react';

export const AsatidzModule: React.FC = () => {
    const { tenant } = useTenant();
    const [asatidzList, setAsatidzList] = useState<IAsatidz[]>([]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<IAsatidz>>({});
    const [fileBase64, setFileBase64] = useState<string>('');

    const loadData = async () => {
        if (!tenant) return;
        const { data } = await asatidzService.getAllForTenant(tenant.id!);
        if (data) {
            setAsatidzList(data);
        }
    };

    useEffect(() => {
        loadData();
    }, [tenant]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Compress or limit image size before DB storage (max 1MB)
        if (file.size > 1024 * 1024) {
            alert('Ukuran foto maksimal 1MB.');
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
        if (!tenant || !formData.name) return;

        setIsSaving(true);

        const payload: Partial<IAsatidz> = {
            ...formData,
            photo_base64: fileBase64 || formData.photo_base64,
            created_at: formData.created_at || new Date().toISOString()
        };

        if (payload.id) {
            await asatidzService.update(payload.id, payload);
        } else {
            await asatidzService.createForTenant(tenant.id!, payload as Omit<IAsatidz, 'id' | 'tenant_id'>);
        }

        setIsSaving(false);
        setIsModalOpen(false);
        resetForm();
        loadData();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus Data Ustadz ini secara permanen? Catatan: Jika Ustadz ini terhubung dengan Agenda, data di Agenda akan kehilangan nama pemateri.')) return;
        await asatidzService.delete(id);
        loadData();
    };

    const openForm = (data?: IAsatidz) => {
        if (data) {
            setFormData({ ...data });
            setFileBase64(data.photo_base64 || '');
        } else {
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone_number: '',
            specialization: '',
            biography: ''
        });
        setFileBase64('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!tenant) return null;

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div>
                    <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-400">Data Asatidz & Da'i</h3>
                    <p className="text-sm text-gray-500">Kelola database Ustadz, Pemateri, dan Profil Da'i untuk dihubungkan ke Agenda Kajian.</p>
                </div>
                <Button onClick={() => openForm()} className="flex items-center gap-2 whitespace-nowrap shrink-0">
                    <Plus size={18} /> Tambah Ustadz
                </Button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Profil</TableHead>
                            <TableHead>Spesialisasi</TableHead>
                            <TableHead>Kontak & Biodata</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {asatidzList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-gray-500 h-32">
                                    Belum ada Data Asatidz yang tersimpan.
                                </TableCell>
                            </TableRow>
                        ) : asatidzList.map((ustadz) => (
                            <TableRow key={ustadz.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {ustadz.photo_base64 ? (
                                            <img src={ustadz.photo_base64} alt={ustadz.name} className="w-10 h-10 rounded-full object-cover border border-emerald-100 shadow-sm" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                <User size={20} />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white">Ustadz {ustadz.name}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {ustadz.specialization ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                                            <BookOpen size={12} /> {ustadz.specialization}
                                        </span>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        {ustadz.phone_number && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                                                <Phone size={12} /> {ustadz.phone_number}
                                            </div>
                                        )}
                                        {ustadz.biography && (
                                            <div className="text-xs text-gray-500 line-clamp-1 italic max-w-xs" title={ustadz.biography}>
                                                "{ustadz.biography}"
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <button onClick={() => openForm(ustadz)} className="text-amber-500 hover:text-amber-600 p-1"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(ustadz.id!)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={formData.id ? "Edit Data Ustadz" : "Tambah Data Ustadz"}>
                <form onSubmit={handleSave} className="space-y-4 pt-2">

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Nama Lengkap <span className="text-red-500">*</span></label>
                        <Input
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Contoh: Abdul Somad, Lc., D.E.S.A., Ph.D."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Spesialisasi Ilmu (Opsional)</label>
                            <Input
                                value={formData.specialization || ''}
                                onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                placeholder="Contoh: Ilmu Hadits"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nomor WhatsApp (Opsional)</label>
                            <Input
                                value={formData.phone_number || ''}
                                onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                placeholder="0812..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Biografi / Profil Singkat (Opsional)</label>
                        <Textarea
                            rows={3}
                            value={formData.biography || ''}
                            onChange={e => setFormData({ ...formData, biography: e.target.value })}
                            placeholder="Tuliskan latar belakang singkat beliau..."
                        />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <label className="text-sm font-medium block">Foto Profil (Maks 1MB)</label>
                        <div className="flex items-center gap-4">
                            {fileBase64 ? (
                                <img src={fileBase64} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                                    <FileImage size={24} />
                                </div>
                            )}
                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400 cursor-pointer"
                                />
                                <p className="text-xs text-gray-400 mt-1">Disarankan menggunakan foto resolusi 1:1 berbentuk persegi.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit" disabled={isSaving}>Simpan Data</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
