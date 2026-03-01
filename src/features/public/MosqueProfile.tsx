import React, { useState, useEffect } from 'react';
import { useTenant } from '../tenants/TenantContext';
import { foundationService, managementPeriodService, takmirMemberService } from '../../services/organizationService';
import { userService } from '../../services/rbacService';
import { agendaService } from '../../services/agendaService';
import { asatidzService } from '../../services/asatidzService';
import type { IFoundation, IManagementPeriod, ITakmirMember, IAgenda, IAsatidz } from '../../types';
import { MapPin, HeartHandshake, FileText, Download, Calendar, User, BookOpen } from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/formatters';

const formatRp = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const MosqueProfile: React.FC = () => {
    const { tenant } = useTenant();
    const [foundation, setFoundation] = useState<IFoundation | null>(null);
    const [activePeriod, setActivePeriod] = useState<IManagementPeriod | null>(null);
    const [takmirMembers, setTakmirMembers] = useState<(ITakmirMember & { username?: string })[]>([]);
    const [agendas, setAgendas] = useState<IAgenda[]>([]);
    const [asatidzList, setAsatidzList] = useState<IAsatidz[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            if (!tenant) return;
            setIsLoading(true);
            try {
                // 1. Load Foundation
                const { data: fons } = await foundationService.getAllForTenant(tenant.id!);
                if (fons && fons.length > 0) setFoundation(fons[0]);

                // 2. Load Agendas (initial fetch, will be refined later)
                // const { data: activeAgendas } = await agendaService.getUpcomingAgendas(tenant.id!);
                // if (activeAgendas) setAgendas(activeAgendas);

                // 3. Load Active Period
                const activePeriodRes = await managementPeriodService.getCurrentActivePeriod(tenant.id!);
                if (activePeriodRes.data) {
                    setActivePeriod(activePeriodRes.data);

                    // Get combined data
                    const [takmirRes, usersRes, agendaRes, asatidzRes] = await Promise.all([
                        takmirMemberService.getMembersByPeriod(tenant.id!, activePeriodRes.data.id!), // Corrected service call
                        userService.getAllForTenant(tenant.id!), // Corrected service call
                        agendaService.getAllForTenant(tenant.id!),
                        asatidzService.getAllForTenant(tenant.id!)
                    ]);

                    if (takmirRes.data && usersRes.data) {
                        // Map user names to takmir members
                        const usersMap = new Map(usersRes.data.map(u => [u.id, u.username]) || []); // Create map from fetched users
                        const mappedTakmir = takmirRes.data.map(member => {
                            return {
                                ...member,
                                username: usersMap.get(member.user_id) || 'Unknown User' // Use mapped username
                            };
                        });
                        setTakmirMembers(mappedTakmir);
                    }

                    if (agendaRes.data) {
                        // Only show future or active agendas, sort by closest date
                        const today = new Date().toISOString().split('T')[0];
                        const activeAgendas = agendaRes.data
                            .filter(a => a.end_date ? a.end_date >= today : a.start_date >= today)
                            .sort((a, b) => a.start_date.localeCompare(b.start_date));
                        setAgendas(activeAgendas);
                    }

                    if (asatidzRes.data) {
                        setAsatidzList(asatidzRes.data);
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [tenant]);

    if (!tenant) return null;

    if (isLoading) {
        return <div className="p-8 flex justify-center text-gray-500">Memuat Profil Masjid...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Header / Identity Banner */}
            <div
                className="rounded-2xl shadow-xl overflow-hidden mb-8 text-white relative"
                style={{ backgroundColor: tenant.primaryColor }}
            >
                {/* Decorative Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                <div className="relative p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl shadow-inner font-bold flex-shrink-0" style={{ color: tenant.primaryColor }}>
                        {tenant.name.charAt(0)}
                    </div>
                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">{tenant.name}</h1>
                        {foundation?.address && (
                            <p className="flex items-center justify-center md:justify-start gap-2 text-white/90 text-lg">
                                <MapPin size={20} /> {foundation.address}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Side Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                            <FileText className="text-emerald-600" size={18} /> Profil Yayasan
                        </h3>
                        {foundation ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Nama Yayasan</p>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">{foundation.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">No. SK / Legalitas</p>
                                    <p className="font-mono text-sm text-gray-700 dark:text-gray-300">{foundation.legal_doc_number || '-'}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic text-sm">Informasi yayasan belum tersedia.</p>
                        )}
                    </div>
                </div>

                {/* Main Content: Takmir Structure */}
                <div className="md:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Struktur Pengurus Takmir</h2>
                            {activePeriod && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-800">
                                    <Calendar size={16} />
                                    <span>Periode {activePeriod.start_year} - {activePeriod.end_year}</span>
                                </div>
                            )}
                        </div>

                        {!activePeriod ? (
                            <div className="text-center py-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                                <p className="text-gray-500">Belum ada periode kepengurusan yang aktif.</p>
                            </div>
                        ) : takmirMembers.length === 0 ? (
                            <div className="text-center py-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                                <p className="text-gray-500">Susunan takmir sedang dalam penyusunan.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {takmirMembers.map((member) => (
                                    <div key={member.id} className="group relative flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-white dark:bg-gray-800 hover:shadow-md">
                                        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center font-bold text-lg group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                            {member.username?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white capitalize">{member.username}</p>
                                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{member.position}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Agenda Section */}
                    {agendas.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-8 mt-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                <Calendar className="text-emerald-600" /> Agenda Masjid
                            </h2>
                            <div className="space-y-6">
                                {agendas.map(agenda => (
                                    <div key={agenda.id} className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-5 overflow-hidden">
                                        {/* Accent line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>

                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{agenda.title}</h4>
                                                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-3 block">
                                                    {formatDateDDMMYYYY(agenda.start_date)} {agenda.end_date && `s/d ${formatDateDDMMYYYY(agenda.end_date)}`}
                                                </p>
                                                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{agenda.description}</p>
                                            </div>

                                            {agenda.document_base64 && (
                                                <a
                                                    href={agenda.document_base64}
                                                    download={agenda.document_name || 'berkas_kegiatan'}
                                                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-md text-sm hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors shadow-sm"
                                                >
                                                    <Download size={16} /> Unduh Berkas
                                                </a>
                                            )}
                                        </div>

                                        {(() => {
                                            if (!agenda.asatidz_id) return null;
                                            const ustadz = asatidzList.find(a => a.id === agenda.asatidz_id);
                                            if (!ustadz) return null;

                                            return (
                                                <div className="mt-4 flex items-center gap-4 bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                                    {ustadz.photo_base64 ? (
                                                        <img src={ustadz.photo_base64} alt={ustadz.name} className="w-12 h-12 rounded-full object-cover border-2 border-emerald-100 shadow-sm" />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200">
                                                            <User size={24} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">Pemateri / Da'i</p>
                                                        <p className="text-gray-900 dark:text-white font-semibold">Ustadz {ustadz.name}</p>
                                                        {ustadz.specialization && (
                                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><BookOpen size={12} /> {ustadz.specialization}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {agenda.is_fundraising_open && (
                                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                {agenda.show_progress_public && (
                                                    <div className="mb-3 space-y-1.5">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-gray-500 font-medium">Terkumpul: {formatRp(agenda.current_amount || 0)}</span>
                                                            <span className="text-gray-500 font-medium">{Math.min(Math.round(((agenda.current_amount || 0) / (agenda.target_amount || 1)) * 100), 100)}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                            <div
                                                                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(((agenda.current_amount || 0) / (agenda.target_amount || 1)) * 100, 100)}% ` }}
                                                            ></div>
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 text-right">dari Target {formatRp(agenda.target_amount || 0)}</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-orange-900 dark:text-orange-400 flex items-center gap-1.5">
                                                            <HeartHandshake size={16} /> Mari Berdonasi
                                                        </p>
                                                        {!agenda.show_progress_public && (
                                                            <p className="text-xs text-orange-700/70 dark:text-orange-500/70 mt-0.5">
                                                                Kebutuhan Dana: {formatRp(agenda.target_amount || 0)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-md transition-colors"
                                                        onClick={() => alert(`Fitur Gateway Donasi untuk kegiatan ini sedang dalam pengembangan. Instruksi donasi: Transfer ke rekening Masjid dan konfirmasi Takmir, sebutkan Donasi untuk ${agenda.title}`)}
                                                    >
                                                        Salurkan Donasi
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
