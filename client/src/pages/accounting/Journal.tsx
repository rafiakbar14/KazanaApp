import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Loader2, BookOpen, Calendar, Search, Filter, ArrowLeft, MoreHorizontal, FileText, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRole } from "@/hooks/use-role";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Journal() {
    const { isAdmin, isLoading: roleLoading } = useRole();
    const [, setLocation] = useLocation();
    const [search, setSearch] = useState("");

    const { data: journals, isLoading: journalsLoading } = useQuery<any[]>({
        queryKey: [api.accounting.journal.list.path],
    });

    const formatCurrency = (valValue: any) => {
        const val = Number(valValue);
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    };

    const filteredJournals = useMemo(() => {
        if (!journals) return [];
        const s = search.toLowerCase();
        return journals.filter(j => 
            (j.description?.toLowerCase() || "").includes(s) || 
            (j.reference?.toLowerCase() || "").includes(s)
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [journals, search]);

    if (roleLoading || journalsLoading) {
        return (
            <div className="p-12 flex justify-center h-[80vh] items-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground animate-pulse font-medium">Membuka Buku Besar...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        setLocation("/");
        return null;
    }

    return (
        <div className="space-y-8 animate-enter pb-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2 text-muted-foreground" onClick={() => setLocation("/accounting")}>
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Kembali
                        </Button>
                    </div>
                    <h1 className="text-4xl font-display font-black text-foreground tracking-tight">Buku Besar (General Ledger)</h1>
                    <p className="text-muted-foreground font-medium">Daftar rekaman jurnal debit & kredit otomatis dari seluruh aktivitas bisnis.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                            placeholder="Cari referensi atau deskripsi..." 
                            className="pl-10 w-64 rounded-xl bg-white border-border/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="rounded-xl border-border bg-white shadow-sm">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </div>

            {/* Ledger Table */}
            <Card className="rounded-[2.5rem] border-border/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border/50">
                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Tanggal</th>
                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Deskripsi & Referensi</th>
                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Detail Akun</th>
                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right w-36">Debit</th>
                                <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground text-right w-36">Kredit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredJournals.map((entry) => (
                                <JournalEntryRow key={entry.id} entry={entry} formatCurrency={formatCurrency} />
                            ))}
                            {filteredJournals.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="text-center space-y-3 opacity-20">
                                            <BookOpen className="w-16 h-16 mx-auto" />
                                            <p className="text-xl font-bold">Belum ada catatan jurnal.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function JournalEntryRow({ entry, formatCurrency }: any) {
    const dateStr = format(new Date(entry.date), "dd MMM yyyy", { locale: id });
    const timeStr = format(new Date(entry.date), "HH:mm");

    return (
        <>
            <tr className="bg-slate-50/30 group hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5 align-top">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-foreground font-bold">
                            <Calendar className="w-3 h-3 text-primary" />
                            {dateStr}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {timeStr}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-5 align-top">
                    <div className="space-y-1">
                        <p className="font-bold text-foreground text-base leading-tight">{entry.description}</p>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-white">
                                {entry.reference}
                            </Badge>
                            {entry.reference?.startsWith("SALE") && (
                                <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border-none text-[8px] font-black uppercase py-0 px-1.5">Auto-Sale</Badge>
                            )}
                        </div>
                    </div>
                </td>
                <td colSpan={3} className="px-0 py-0">
                    <table className="w-full">
                        <tbody className="divide-y divide-border/20">
                            {entry.items?.map((item: any, idx: number) => (
                                <tr key={item.id} className={cn(
                                    "border-l-4",
                                    item.debit > 0 ? "border-indigo-500" : "border-slate-300"
                                )}>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-muted-foreground w-8">{item.accountCode}</span>
                                            <span className={cn(
                                                "font-semibold",
                                                item.credit > 0 && "ml-4 italic text-muted-foreground"
                                            )}>{item.accountName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-right w-36 font-display font-medium">
                                        {item.debit > 0 ? formatCurrency(item.debit) : "-"}
                                    </td>
                                    <td className="px-6 py-3 text-right w-36 font-display font-medium">
                                        {item.credit > 0 ? formatCurrency(item.credit) : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </td>
            </tr>
        </>
    );
}
