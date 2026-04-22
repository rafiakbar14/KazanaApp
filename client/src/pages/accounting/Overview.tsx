import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Loader2, TrendingUp, TrendingDown, Wallet, Landmark, LineChart, PieChart, ArrowUpRight, ArrowDownRight, Plus, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRole } from "@/hooks/use-role";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function Accounting() {
    const { isAdmin, isLoading: roleLoading } = useRole();
    const [, setLocation] = useLocation();

    const { data: accounts, isLoading: accountsLoading } = useQuery<any[]>({
        queryKey: ["/api/accounting/accounts"],
    });

    const { data: journalEntries, isLoading: journalsLoading } = useQuery<any[]>({
        queryKey: [api.accounting.journal.list.path],
    });

    const [selectedAccount, setSelectedAccount] = useState<{id: number, name: string, code: string} | null>(null);

    const getLedgerHistory = (accountId: number) => {
        if (!journalEntries) return [];
        return journalEntries.flatMap(entry => {
            const relevantItem = entry.items?.find((i: any) => i.accountId === accountId);
            if (!relevantItem) return [];
            return [{
                ...entry,
                debit: relevantItem.debit,
                credit: relevantItem.credit
            }];
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const formatCurrency = (valValue: any) => {
        const val = Number(valValue);
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
    };

    const stats = useMemo(() => {
        if (!accounts) return { assets: 0, liabilities: 0, equity: 0, income: 0, expense: 0 };
        return accounts.reduce((acc, curr) => {
            const balance = Number(curr.balance || 0);
            if (curr.type === 'asset') acc.assets += balance;
            else if (curr.type === 'liability') acc.liabilities += balance;
            else if (curr.type === 'equity') acc.equity += balance;
            else if (curr.type === 'income') acc.income += balance;
            else if (curr.type === 'expense') acc.expense += balance;
            return acc;
        }, { assets: 0, liabilities: 0, equity: 0, income: 0, expense: 0 });
    }, [accounts]);

    const netProfit = stats.income - stats.expense;

    if (roleLoading || accountsLoading) {
        return (
            <div className="p-12 flex justify-center h-[80vh] items-center">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground animate-pulse font-medium">Menyusun Laporan Keuangan...</p>
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
                    <h1 className="text-4xl font-display font-black text-foreground tracking-tight">Finansial & Akuntansi</h1>
                    <p className="text-muted-foreground font-medium">Pantau ringkasan neraca dan performa laba rugi perusahaan.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                        <Download className="w-4 h-4 mr-2" />
                        Ekspor Laporan
                    </Button>
                    <Button className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 font-bold" onClick={() => setLocation("/journal")}>
                        <Plus className="w-4 h-4 mr-2" />
                        Jurnal Manual
                    </Button>
                </div>
            </div>

            {/* Top Metrics: Balance Sheet Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2rem] border-none shadow-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-indigo-100 font-black uppercase tracking-widest text-[10px]">Total Aset</CardDescription>
                        <CardTitle className="text-3xl font-display font-black">{formatCurrency(stats.assets)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between mt-2">
                            <Badge className="bg-white/20 text-white border-none text-[10px] py-0 cursor-default">Rumah Tangga Finansial</Badge>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] bg-white/10 hover:bg-white/20" onClick={() => setSelectedAccount({id: 1101, name: "Kas & Bank", code: "1101"})}>Lihat Kas</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Landmark className="w-24 h-24" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Kewajiban & Modal</CardDescription>
                        <CardTitle className="text-3xl font-display font-black">{formatCurrency(stats.liabilities + stats.equity)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="space-y-1">
                                <p className="text-[9px] text-slate-500 font-black uppercase">Liabilitas</p>
                                <p className="text-xs font-bold text-red-400">{formatCurrency(stats.liabilities)}</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div className="space-y-1">
                                <p className="text-[9px] text-slate-500 font-black uppercase">Ekuitas</p>
                                <p className="text-xs font-bold text-teal-400">{formatCurrency(stats.equity)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(
                    "rounded-[2rem] border-none shadow-xl overflow-hidden relative",
                    netProfit >= 0 ? "bg-teal-600 text-white" : "bg-rose-600 text-white"
                )}>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-white/70 font-black uppercase tracking-widest text-[10px]">Laba Bersih (Periode Ini)</CardDescription>
                        <CardTitle className="text-3xl font-display font-black">{formatCurrency(netProfit)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 mt-2">
                            {netProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            <span className="text-xs font-bold">{netProfit >= 0 ? "Profit Surplus" : "Defisit Operasional"}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Profit & Loss Chart Visualizer (Simulation) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="rounded-[2.5rem] border-border/50 shadow-sm p-8">
                    <CardHeader className="px-0 pt-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <LineChart className="w-5 h-5 text-primary" />
                                Analisa Pendapatan & Beban
                            </CardTitle>
                            <Badge variant="outline" className="rounded-lg">Real-time</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0 space-y-8 pt-4">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Total Pendapatan</p>
                                    <h4 className="text-2xl font-black text-teal-600">{formatCurrency(stats.income)}</h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground font-bold">Target 100jt/bln</p>
                                    <p className="text-xs text-teal-500 font-black">{(stats.income / 100000000 * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                            <Progress value={(stats.income / 100000000 * 100)} className="h-3 bg-teal-100" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Total Beban (COGS + OpEx)</p>
                                    <h4 className="text-2xl font-black text-rose-600">{formatCurrency(stats.expense)}</h4>
                                </div>
                                <div className="text-right text-rose-500 text-xs font-black">
                                    {(stats.expense / (stats.income || 1) * 100).toFixed(1)}% Dari Omzet
                                </div>
                            </div>
                            <Progress value={(stats.expense / (stats.income || 1) * 100)} className="h-3 bg-rose-100" />
                        </div>
                    </CardContent>
                </Card>

                {/* Chart of Accounts Summary */}
                <Card className="rounded-[2.5rem] border-border/50 shadow-sm p-8">
                    <CardHeader className="px-0 pt-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl font-black tracking-tight flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-indigo-500" />
                                Chart of Accounts (COA)
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase">View All</Button>
                        </div>
                    </CardHeader>
                    <div className="space-y-2 mt-4">
                        {accounts?.slice(0, 8).map((acc) => (
                            <div key={acc.id} onClick={() => setSelectedAccount(acc)} className="flex items-center justify-between p-3 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors border border-transparent hover:border-primary/20">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm",
                                        acc.type === 'asset' && "bg-blue-500",
                                        acc.type === 'income' && "bg-teal-500",
                                        acc.type === 'expense' && "bg-rose-500",
                                        acc.type === 'liability' && "bg-amber-500",
                                        acc.type === 'equity' && "bg-slate-700"
                                    )}>
                                        {acc.code}
                                    </div>
                                    <span className="font-semibold text-sm group-hover:text-primary transition-colors">{acc.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-display font-bold text-sm text-foreground">{formatCurrency(acc.balance)}</span>
                                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-50" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Drill-down Modal */}
            <Dialog open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col rounded-[2rem] bg-slate-50/95 backdrop-blur-3xl border-slate-200">
                    <DialogHeader className="px-2 pt-2">
                        <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-sm font-black shadow-inner">
                                {selectedAccount?.code}
                            </div>
                            Buku Besar: {selectedAccount?.name}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="overflow-y-auto flex-1 rounded-2xl border border-slate-200 bg-white shadow-sm mt-4">
                        <div className="divide-y divide-slate-100">
                            {selectedAccount && getLedgerHistory(selectedAccount.id).length === 0 ? (
                                <div className="p-12 text-center text-slate-400 font-bold">Belum ada mutasi tercatat pada akun ini.</div>
                            ) : (
                                selectedAccount && getLedgerHistory(selectedAccount.id).map((entry, idx) => (
                                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex flex-col items-center justify-center shrink-0">
                                            <span className="text-[10px] font-black text-slate-400 leading-none">{format(new Date(entry.date), "dd")}</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase leading-none">{format(new Date(entry.date), "MMM", { locale: idLocale })}</span>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="font-bold text-slate-800 leading-tight">{entry.description}</p>
                                            <p className="text-xs text-slate-400 font-mono">{entry.reference}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            {Number(entry.debit) > 0 ? (
                                                <div className="flex items-center justify-end gap-1 text-teal-600">
                                                    <Plus className="w-3 h-3" />
                                                    <span className="font-black">{formatCurrency(entry.debit)}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1 text-rose-600 font-bold">
                                                    ({formatCurrency(entry.credit)})
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
