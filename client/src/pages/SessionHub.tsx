import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { api } from "@shared/routes";
import { useRole } from "@/hooks/use-role";
import { Store, Monitor, Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, Activity, Receipt, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function SessionHub() {
    const { isAdmin, role } = useRole();
    
    const { data: sessions, isLoading } = useQuery<any[]>({
        queryKey: [api.pos.sessions.list.path],
        refetchInterval: 30000, // Auto refresh every 30s
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val || 0);
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                        <Activity className="w-4 h-4 text-primary" />
                        POS Management
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Rekonsiliasi Kasir</h1>
                        <p className="text-slate-500 font-medium max-w-lg leading-relaxed">Pantau sesi aktif dan periksa selisih penerimaan kas harian (Blind Close) dari setiap terminal kasir.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {sessions?.map((session) => {
                    const isClosed = session.status === "closed";
                    const expectedTotal = Number(session.openingBalance || 0) + Number(session.totalCashSales || 0) + Number(session.pettyCashTotal || 0);
                    const actualTotal = Number(session.closingCashActual || 0);
                    const variance = actualTotal - expectedTotal;
                    
                    return (
                        <Card key={session.id} className="rounded-[32px] overflow-hidden border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300">
                            <CardContent className="p-0">
                                <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 shadow-inner ${isClosed ? 'bg-slate-200 border-slate-100 text-slate-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500'}`}>
                                            <Monitor className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight">{session.deviceId || `Terminal ${session.id}`}</h3>
                                            <p className="text-xs text-slate-500 font-medium mt-1">Kasir: {session.userId}</p>
                                        </div>
                                    </div>
                                    <Badge variant={isClosed ? "secondary" : "default"} className={`rounded-xl px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] ${isClosed ? 'bg-slate-200 text-slate-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                                        {isClosed ? 'Telah Ditutup' : 'Sedang Aktif'}
                                    </Badge>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Modal Awal</p>
                                            <p className="font-mono font-medium">{formatCurrency(session.openingBalance)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Penjualan Tunai</p>
                                            <p className="font-mono font-bold text-emerald-600">+{formatCurrency(session.totalCashSales)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">Kas Kecil (Keluar)</p>
                                            <p className="font-mono font-bold text-red-500">{formatCurrency(session.pettyCashTotal)}</p>
                                        </div>
                                    </div>

                                    {isClosed ? (
                                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-center relative overflow-hidden">
                                            {variance === 0 ? (
                                                <div className="text-emerald-500 relative z-10">
                                                    <CheckCircle2 className="w-8 h-8 mb-2" />
                                                    <p className="text-sm font-black uppercase tracking-widest">Seimbang (Sesuai)</p>
                                                    <p className="text-2xl font-mono mt-2">{formatCurrency(actualTotal)}</p>
                                                    <p className="text-xs text-emerald-700 mt-2">Setoran Fisik Kasir Sesuai</p>
                                                </div>
                                            ) : (
                                                <div className={`${variance < 0 ? 'text-red-500' : 'text-amber-500'} relative z-10`}>
                                                    <ShieldAlert className="w-8 h-8 mb-2" />
                                                    <p className="text-sm font-black uppercase tracking-widest">{variance < 0 ? 'Selisih Minus' : 'Ada Surplus'}</p>
                                                    <p className="text-2xl font-mono mt-2">{formatCurrency(variance)}</p>
                                                    <div className="mt-3 text-xs bg-white/50 rounded-lg p-2 font-medium">
                                                        <span className="opacity-70 line-through mr-2">{formatCurrency(expectedTotal)}</span>
                                                        <span className="text-slate-900">{formatCurrency(actualTotal)} (Fisik)</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100 flex flex-col items-center justify-center text-center opacity-70">
                                            <Clock className="w-8 h-8 text-emerald-300 mb-2" />
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Menunggu Rekonsiliasi</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
