import React, { useState, useEffect } from 'react';
import { useTenant } from '../tenants/TenantContext';
import { agendaService } from '../../services/agendaService';
import type { IAgenda } from '../../types';
import {
    Clock,
    Calendar,
    Landmark,
    Info,
    Volume2,
    Maximize2
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/formatters';

export const DigitalSignage: React.FC = () => {
    const { tenant } = useTenant();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [agendas, setAgendas] = useState<IAgenda[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [hijriDate, setHijriDate] = useState("");

    const [prayerTimes] = useState({
        Shubuh: "04:35",
        Syuruq: "05:48",
        Dzuhur: "11:58",
        Ashar: "15:10",
        Maghrib: "18:05",
        Isya: "19:15"
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        const fetchAgendas = async () => {
            if (!tenant) return;
            const res = await agendaService.getAllForTenant(tenant.id!);
            if (res.data) {
                const today = new Date().toISOString().split('T')[0];
                setAgendas(res.data.filter(a => (a.end_date || a.start_date) >= today));
            }
        };

        const calculationHijri = () => {
            const date = new Date();
            const options = { day: 'numeric', month: 'long', year: 'numeric' } as const;
            try {
                const hijri = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', options).format(date);
                setHijriDate(hijri);
            } catch (e) {
                setHijriDate("-");
            }
        };

        fetchAgendas();
        calculationHijri();

        return () => clearInterval(timer);
    }, [tenant]);

    useEffect(() => {
        if (agendas.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % agendas.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [agendas]);

    if (!tenant) return null;

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    return (
        <div className="fixed inset-0 bg-black text-white overflow-hidden font-sans select-none flex flex-col">
            <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-10 py-8 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center font-black text-4xl shadow-lg shadow-emerald-500/20">
                        {tenant.name.charAt(0)}
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black uppercase tracking-tight leading-none">{tenant.name}</h1>
                        <p className="text-xl text-emerald-500 font-bold tracking-widest uppercase">Digital Signage System</p>
                    </div>
                </div>

                <div className="flex items-center gap-12">
                    <div className="text-right">
                        <p className="text-2xl font-bold text-slate-400">{hijriDate}</p>
                        <p className="text-xl font-medium text-slate-500 leading-none">
                            {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="text-7xl font-black tabular-nums tracking-tighter">
                            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-grow flex p-10 gap-10">
                <div className="flex-grow relative rounded-[40px] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
                    {agendas.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <Info size={120} className="mb-8 opacity-10" />
                            <h2 className="text-4xl font-bold italic">Belum Ada Pengumuman</h2>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col p-16">
                            <span className="px-6 py-2 bg-emerald-600 text-white text-xl font-black rounded-full uppercase tracking-widest inline-block w-fit mb-12">
                                Informasi Masjid
                            </span>

                            <div className="flex-grow flex flex-col justify-center">
                                <h1 className="text-8xl font-black uppercase mb-8 leading-[0.9]">
                                    {agendas[currentSlide]?.title}
                                </h1>
                                <p className="text-3xl text-slate-300 leading-relaxed font-medium line-clamp-4">
                                    {agendas[currentSlide]?.description || "Mari berpartisipasi dalam setiap kegiatan masjid untuk mempererat ukhuwah Islamiyah."}
                                </p>
                            </div>

                            <div className="mt-auto">
                                <div className="inline-flex items-center gap-3 text-2xl font-bold bg-white/5 px-6 py-4 rounded-3xl border border-white/10">
                                    <Calendar className="text-emerald-500" size={32} />
                                    {formatDateDDMMYYYY(agendas[currentSlide]?.start_date)}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-[450px] flex flex-col gap-6">
                    <div className="bg-emerald-600 p-8 rounded-[40px] text-center shadow-xl">
                        <h3 className="text-2xl font-black uppercase tracking-widest text-emerald-200 mb-2">Waktu Shalat</h3>
                        <p className="text-6xl font-black tracking-tighter uppercase tabular-nums">Kab. Bekasi</p>
                    </div>

                    <div className="flex-grow grid grid-rows-6 gap-3">
                        {Object.entries(prayerTimes).map(([name, time]) => (
                            <div key={name} className="flex items-center justify-between px-10 rounded-[30px] border bg-slate-900/50 text-slate-300 border-white/5">
                                <span className="text-4xl font-black uppercase tracking-tight">{name}</span>
                                <span className="text-5xl font-black tabular-nums tracking-tighter">{time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="h-28 bg-emerald-600 flex items-center overflow-hidden border-t-8 border-emerald-500 relative">
                <div className="h-full px-12 bg-emerald-700 flex items-center gap-4 relative z-20">
                    <Volume2 size={40} />
                    <span className="text-2xl font-black uppercase tracking-tighter whitespace-nowrap">I'lanat :</span>
                </div>

                <div className="flex-grow relative overflow-hidden z-10">
                    <div className="whitespace-nowrap animate-marquee flex items-center gap-20">
                        <span className="text-3xl font-bold uppercase tracking-wide">
                            Diharapkan jamaah mematikan alat komunikasi (HP) saat berada di dalam masjid &bull;
                        </span>
                        <span className="text-3xl font-bold uppercase tracking-wide">
                            Jaga kebersihan lingkungan masjid demi kenyamanan bersama &bull;
                        </span>
                    </div>
                </div>

                <button
                    onClick={toggleFullScreen}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors z-30"
                >
                    <Maximize2 size={24} />
                </button>
            </footer>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee {
                    display: inline-block;
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    );
};
