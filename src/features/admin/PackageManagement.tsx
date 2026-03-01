import React, { useState, useEffect } from 'react';
import { db } from '../../lib/db';
import type { IModule, IPackage, IPackageModule } from '../../types';
import {
    Package,
    Plus,
    Edit2,
    Trash2,
    Check,
    X,
    Save,
    Info,
    Layers,
    Clock,
    Percent,
    CheckCircle2
} from 'lucide-react';
import { useSystemAudit } from '../../hooks/useSystemAudit';

export const PackageManagement: React.FC = () => {
    const { logActivity } = useSystemAudit();
    const [packages, setPackages] = useState<IPackage[]>([]);
    const [modules, setModules] = useState<IModule[]>([]);
    const [packageModules, setPackageModules] = useState<IPackageModule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<IPackage | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<IPackage>>({
        name: '',
        slug: '',
        description: '',
        monthlyPrice: 0,
        yearlyPrice: 0,
        is_active: true,
        is_popular: false
    });
    const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [allPkgs, allMods, allPkgMods] = await Promise.all([
                db.packages.toArray(),
                db.modules.toArray(),
                db.package_modules.toArray()
            ]);
            setPackages(allPkgs);
            setModules(allMods);
            setPackageModules(allPkgMods);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenModal = (pkg: IPackage | null = null) => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormData(pkg);
            const linkedModules = packageModules
                .filter(pm => pm.package_id === pkg.id)
                .map(pm => pm.module_id);
            setSelectedModuleIds(linkedModules);
        } else {
            setEditingPackage(null);
            setFormData({
                name: '',
                slug: '',
                description: '',
                monthlyPrice: 0,
                yearlyPrice: 0,
                is_active: true,
                is_popular: false
            });
            setSelectedModuleIds([]);
        }
        setIsModalOpen(true);
    };

    const handleToggleModule = (modId: number) => {
        setSelectedModuleIds(prev =>
            prev.includes(modId)
                ? prev.filter(id => id !== modId)
                : [...prev, modId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = {
                ...formData,
                slug: formData.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                created_at: formData.created_at || new Date().toISOString()
            } as IPackage;

            let pkgId: number;
            if (editingPackage?.id) {
                pkgId = editingPackage.id;
                await db.packages.update(pkgId, dataToSave);
                // Clear and re-add modules
                await db.package_modules.where('package_id').equals(pkgId).delete();
                await logActivity('Update Package', pkgId, `Updated package ${dataToSave.name}`);
            } else {
                pkgId = await db.packages.add(dataToSave) as number;
                await logActivity('Create Package', pkgId, `Created package ${dataToSave.name}`);
            }

            // Save Module links
            for (const modId of selectedModuleIds) {
                await db.package_modules.add({ package_id: pkgId, module_id: modId });
            }

            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error("Failed to save package", error);
            alert("Gagal menyimpan paket.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Hapus paket ini? Ini juga akan menghapus relasi modulnya.")) return;
        try {
            await db.packages.delete(id);
            await db.package_modules.where('package_id').equals(id).delete();
            await logActivity('Delete Package', id, `Deleted package ID: ${id}`);
            loadData();
        } catch (error) {
            alert("Gagal menghapus paket.");
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-slate-900 dark:text-white">
                            <Package className="text-emerald-600" size={32} />
                            Manajemen Paket & Pricing
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Konfigurasi paket langganan, fitur modul, dan kebijakan harga.</p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                    >
                        <Plus size={20} /> Tambah Paket
                    </button>
                </div>

                {/* Package Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-[32px] animate-pulse border border-slate-100 dark:border-slate-800"></div>
                        ))
                    ) : packages.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800">
                            <Package className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-400 font-bold">Belum ada paket. Klik tombol "Tambah Paket" untuk memulai.</p>
                        </div>
                    ) : (
                        packages.map((pkg) => (
                            <div key={pkg.id} className={`group relative p-8 bg-white dark:bg-slate-900 rounded-[32px] border-2 transition-all hover:shadow-xl ${pkg.is_popular ? 'border-emerald-500 shadow-lg shadow-emerald-500/5' : 'border-slate-100 dark:border-slate-800'}`}>
                                {pkg.is_popular && (
                                    <div className="absolute top-0 right-10 -translate-y-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-10">
                                        Paling Populer
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-black uppercase tracking-tight">{pkg.name}</h3>
                                        <p className="text-xs text-slate-400 font-bold tracking-widest mt-1 uppercase">/{pkg.slug}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(pkg)} className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(pkg.id!)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-slate-400 text-[10px] font-black uppercase">Bulanan:</span>
                                            <span className="text-slate-400 text-xs font-bold uppercase ml-1">Rp</span>
                                            <span className="text-xl font-black tracking-tighter">{(pkg.monthlyPrice || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-emerald-600 text-[10px] font-black uppercase">Tahunan:</span>
                                            <span className="text-emerald-600 text-xs font-bold uppercase ml-1">Rp</span>
                                            <span className="text-2xl font-black tracking-tighter text-emerald-600">{(pkg.yearlyPrice || 0).toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                    {pkg.monthlyPrice > 0 && pkg.yearlyPrice > 0 && (
                                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black rounded-full uppercase tracking-widest">
                                            Hemat {Math.round((1 - (pkg.yearlyPrice / (pkg.monthlyPrice * 12))) * 100)}%
                                        </div>
                                    )}
                                    <p className="text-sm text-slate-500 leading-relaxed min-h-[40px]">{pkg.description || 'Tidak ada deskripsi.'}</p>
                                </div>

                                <div className="space-y-3 mb-8 pt-6 border-t border-slate-50 dark:border-slate-800">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Fitur Termasuk:</div>
                                    <div className="space-y-2 min-h-[100px]">
                                        {packageModules
                                            .filter(pm => pm.package_id === pkg.id)
                                            .map(pm => {
                                                const mod = modules.find(m => m.id === pm.module_id);
                                                return mod ? (
                                                    <div key={mod.id} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                                        {mod.name}
                                                    </div>
                                                ) : null;
                                            })}
                                        {packageModules.filter(pm => pm.package_id === pkg.id).length === 0 && (
                                            <p className="text-xs text-slate-400 italic">Tidak ada modul.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${pkg.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{pkg.is_active ? 'Aktif' : 'Non-aktif'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modules Overview Table */}
                <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden mt-12">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h2 className="text-xl font-black flex items-center gap-3">
                            <Layers className="text-blue-500" size={24} />
                            Daftar Modul Sistem
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Modul</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Slug</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Deskripsi</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Tersedia Di</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {modules.map(mod => (
                                    <tr key={mod.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-8 py-5 font-bold">{mod.name}</td>
                                        <td className="px-8 py-5 font-mono text-xs text-slate-400 tracking-wider">/{mod.slug}</td>
                                        <td className="px-8 py-5 text-sm text-slate-500 max-w-xs truncate">{mod.description}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end -space-x-2">
                                                {packageModules
                                                    .filter(pm => pm.module_id === mod.id)
                                                    .map(pm => {
                                                        const pkg = packages.find(p => p.id === pm.package_id);
                                                        return pkg ? (
                                                            <div key={pkg.id} title={pkg.name} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[8px] text-slate-600 dark:text-slate-400 overflow-hidden">
                                                                {pkg.name.charAt(0)}
                                                            </div>
                                                        ) : null;
                                                    })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Create/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in transition-all">
                    <div className="bg-white dark:bg-slate-950 w-full max-w-4xl rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                                <h3 className="text-2xl font-black flex items-center gap-3">
                                    <Package className="text-emerald-600" /> {editingPackage ? 'Ubah Paket' : 'Tambah Paket Baru'}
                                </h3>
                                <p className="text-sm text-slate-500 font-medium">Lengkapi rincian paket dan pilih modul yang disertakan.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-grow overflow-hidden flex flex-col">
                            <div className="flex-grow overflow-y-auto p-8 lg:p-10 scrollbar-hide">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    {/* Lef Side: Package Info */}
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
                                                <Info size={14} /> Informasi Dasar
                                            </h4>
                                            <div className="grid grid-cols-1 gap-5">
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Nama Paket</label>
                                                    <input
                                                        required
                                                        type="text"
                                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold placeholder:text-slate-300"
                                                        placeholder="Contoh: Premium Monthly"
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Deskripsi Singkat</label>
                                                    <textarea
                                                        rows={3}
                                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium text-sm placeholder:text-slate-300"
                                                        placeholder="Jelaskan target atau keuntungan paket ini..."
                                                        value={formData.description}
                                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                                <Clock size={14} /> Pricing & Periode
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Harga Bulanan (Rp)</label>
                                                    <input
                                                        required
                                                        type="number"
                                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-black"
                                                        value={formData.monthlyPrice}
                                                        onChange={e => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Harga Tahunan (Rp)</label>
                                                    <input
                                                        required
                                                        type="number"
                                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-black"
                                                        value={formData.yearlyPrice}
                                                        onChange={e => setFormData({ ...formData, yearlyPrice: Number(e.target.value) })}
                                                    />
                                                </div>
                                                {formData.monthlyPrice! > 0 && formData.yearlyPrice! > 0 && (
                                                    <div className="col-span-full">
                                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                                                            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                                                <Percent size={14} /> Otomatis Kalkulasi Diskon Tahunan:
                                                            </div>
                                                            <div className="text-lg font-black text-emerald-600">
                                                                Hemat {Math.round((1 - (formData.yearlyPrice! / (formData.monthlyPrice! * 12))) * 100)}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 pt-4">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.is_active}
                                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                                                <span className="ml-3 text-xs font-black uppercase tracking-widest text-slate-500">Paket Aktif</span>
                                            </label>

                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.is_popular}
                                                    onChange={e => setFormData({ ...formData, is_popular: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                                                <span className="ml-3 text-xs font-black uppercase tracking-widest text-slate-500">Paling Populer</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Right Side: Modules Selection */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 flex items-center gap-2">
                                            <Layers size={14} /> Pilih Modul & Fitur
                                        </h4>
                                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] space-y-3">
                                            {modules.map(mod => (
                                                <div
                                                    key={mod.id}
                                                    onClick={() => handleToggleModule(mod.id!)}
                                                    className={`group p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all border-2 ${selectedModuleIds.includes(mod.id!) ? 'bg-white dark:bg-slate-800 border-emerald-500 shadow-md translate-x-1' : 'bg-transparent border-transparent grayscale opacity-60'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${selectedModuleIds.includes(mod.id!) ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                            {mod.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className={`font-bold text-sm ${selectedModuleIds.includes(mod.id!) ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                                                {mod.name}
                                                            </div>
                                                            <div className="text-[10px] font-medium text-slate-400">/{mod.slug}</div>
                                                        </div>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${selectedModuleIds.includes(mod.id!) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                                        {selectedModuleIds.includes(mod.id!) && <Check size={14} strokeWidth={4} />}
                                                    </div>
                                                </div>
                                            ))}
                                            {modules.length === 0 && (
                                                <div className="py-10 text-center text-slate-400 font-bold italic text-sm">
                                                    Belum ada modul yang tersedia di sistem.
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium px-4">
                                            <Info size={10} className="inline mr-1" /> Modul yang dipilih akan dapat diakses oleh masjid yang berlangganan paket ini.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Sticky */}
                            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-700 font-black rounded-2xl transition-all border border-slate-200 dark:border-slate-700"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Save size={20} /> Simpan Paket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
