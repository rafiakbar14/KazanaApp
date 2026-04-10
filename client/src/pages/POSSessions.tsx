import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
    Clock,
    Calendar,
    User,
    Banknote,
    TrendingUp,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    FileText,
    History,
    CreditCard,
    QrCode,
    Plus,
    Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function POSSessions() {
    const { data: sessions, isLoading } = useQuery<any[]>({
        queryKey: [api.pos.sessions.list.path],
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                        <History className="w-8 h-8 text-primary" />
                        Riwayat Shift Kasir
                    </h1>
                    <p className="text-slate-500 mt-2">Pantau laporan Z-Report dan akuntabilitas kas kasir.</p>
                </div>
                <Link href="/pos">
                    <Button variant="outline" className="rounded-xl flex items-center gap-2 border-primary/20 hover:bg-primary/5 text-primary font-bold">
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke POS
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Sesi Selesai"
                    value={sessions?.filter(s => s.status === 'closed').length || 0}
                    icon={CheckCircle2}
                    color="emerald"
                />
                <StatCard
                    title="Sesi Aktif"
                    value={sessions?.filter(s => s.status === 'open').length || 0}
                    icon={Clock}
                    color="blue"
                />
                <StatCard
                    title="Total Penjualan Sesi"
                    value={`Rp ${sessions?.reduce((acc, s) => acc + Number(s.totalSales || 0), 0).toLocaleString()}`}
                    icon={TrendingUp}
                    color="primary"
                />
                <StatCard
                    title="Total Selisih Kas"
                    value={`Rp ${sessions?.reduce((acc, s) => acc + (Number(s.actualBalance || 0) - (Number(s.openingBalance) + Number(s.totalCashSales || 0) + Number(s.pettyCashTotal || 0))), 0).toLocaleString()}`}
                    icon={AlertTriangle}
                    color="amber"
                />
            </div>

            <Card className="rounded-[2rem] border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-400" />
                        Daftar Laporan Z-Report
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] uppercase tracking-widest font-black text-slate-400 bg-slate-50/30">
                                    <th className="px-8 py-4">Kasir / Terminal</th>
                                    <th className="px-6 py-4">Waktu Sesi</th>
                                    <th className="px-6 py-4 text-right">Penjualan</th>
                                    <th className="px-6 py-4 text-right">Kas Akhir</th>
                                    <th className="px-6 py-4 text-right">Selisih</th>
                                    <th className="px-8 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {sessions?.map((session) => {
                                    const expectedBalance = Number(session.openingBalance) + Number(session.totalCashSales || 0) + Number(session.pettyCashTotal || 0);
                                    const diff = session.status === 'closed' ? Number(session.actualBalance) - expectedBalance : 0;

                                    return (
                                        <tr key={session.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{session.user?.username || 'User'}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-tight">{session.deviceName || 'Terminal 1'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-medium text-slate-700">
                                                        {format(new Date(session.startTime), "dd MMM yyyy", { locale: id })}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {format(new Date(session.startTime), "HH:mm", { locale: id })}
                                                        {session.endTime ? ` - ${format(new Date(session.endTime), "HH:mm", { locale: id })}` : ' (Aktif)'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right font-bold text-slate-900">
                                                Rp {Number(session.totalSales || 0).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <p className="text-xs font-bold text-slate-900">
                                                    Rp {session.status === 'closed' ? Number(session.actualBalance).toLocaleString() : '-'}
                                                </p>
                                                <p className="text-[10px] text-slate-400">Exp: Rp {expectedBalance.toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {session.status === 'closed' ? (
                                                    <span className={cn(
                                                        "text-xs font-black px-2 py-1 rounded-lg",
                                                        diff === 0 ? "text-emerald-600 bg-emerald-50" :
                                                            diff > 0 ? "text-blue-600 bg-blue-50" : "text-red-600 bg-red-50"
                                                    )}>
                                                        {diff === 0 ? 'COCOK' : (diff > 0 ? '+' : '') + diff.toLocaleString()}
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <Badge variant={session.status === 'open' ? 'default' : 'secondary'} className={cn(
                                                    "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest",
                                                    session.status === 'open' ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {session.status === 'open' ? 'BERJALAN' : 'SELESAI'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {sessions?.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-20 text-slate-300 font-medium italic">
                                            Belum ada riwayat sesi kasir.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: any, icon: any, color: string }) {
    const colorClasses: Record<string, string> = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        primary: "bg-primary/5 text-primary border-primary/10",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
    };

    return (
        <Card className="rounded-[2rem] border-slate-200/60 shadow-lg shadow-slate-200/10">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-2xl border", colorClasses[color])}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-[0.15em] text-slate-400 mb-0.5">{title}</p>
                        <p className="text-xl font-bold text-slate-900">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
