import { useAssemblySession } from "@/hooks/use-production";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Settings2, Package, CheckCircle2, Calendar, ClipboardList, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export default function AssemblySessionDetail() {
    const { id } = useParams();
    const sessionId = Number(id);
    const [, setLocation] = useLocation();
    const { data: session, isLoading } = useAssemblySession(sessionId);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Memuat Rahasia Dapur...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center py-20 bg-card rounded-[2rem] border border-dashed border-border/50">
                <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold">Sesi Tidak Ditemukan</h2>
                <Button variant="link" onClick={() => setLocation("/production/assembly")}>
                    Kembali ke Daftar
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex flex-col gap-6">
                <button 
                    onClick={() => setLocation("/production/assembly")}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group w-fit"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Kembali ke Produksi</span>
                </button>

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h1 className="text-4xl font-display font-bold font-gradient">
                                PROD-{session.id.toString().padStart(4, '0')}
                            </h1>
                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px]">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                FINAL
                            </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {format(new Date(session.createdAt), "dd MMMM yyyy", { locale: idLocale })}
                                </span>
                            </div>
                            <div className="w-1 h-1 bg-border rounded-full" />
                            <div className="flex items-center gap-1.5 font-mono text-xs">
                                <span>{format(new Date(session.createdAt), "HH:mm", { locale: idLocale })} WIB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info Card */}
                <Card className="lg:col-span-1 rounded-[2rem] border-border/50 shadow-premium overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 px-8 py-6">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" />
                            Ringkasan Produksi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Hasil Jadi</p>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black font-display text-primary">{session.quantityProduced}</span>
                                <span className="text-sm font-bold text-primary/60 mb-1.5 uppercase">Unit</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resep Digunakan</p>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border/50">
                                    <Settings2 className="w-4 h-4 text-primary" />
                                    <span className="font-bold text-sm truncate">{session.bom?.name || `BOM #${session.bomId}`}</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Produk Target</p>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border/50">
                                    <Package className="w-4 h-4 text-blue-500" />
                                    <span className="font-bold text-sm truncate">{session.bom?.targetProduct?.name || "N/A"}</span>
                                </div>
                            </div>

                            {session.notes && (
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catatan</p>
                                    <p className="text-sm italic text-muted-foreground bg-muted/30 p-3 rounded-xl">"{session.notes}"</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Detail Items Card */}
                <Card className="lg:col-span-2 rounded-[2rem] border-border/50 shadow-premium overflow-hidden">
                    <CardHeader className="border-b border-border/50 px-8 py-6 flex flex-row items-center justify-between bg-card">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <ClipboardList className="w-4 h-4 text-primary" />
                            Komposisi Bahan Baku
                        </CardTitle>
                        <Badge variant="secondary" className="rounded-lg text-[10px] font-black">
                            {session.bom?.items?.length || 0} ITEM
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-muted/30 border-b border-border/50">
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bahan Baku</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Kebutuhan / Unit</th>
                                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Total Pakai</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {session.bom?.items?.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-muted/20 transition-colors group">
                                            <td className="px-8 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm group-hover:text-primary transition-colors">{item.product?.name || "Produk dihapus"}</span>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{item.product?.sku || "N/A"}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <span className="font-medium text-sm text-foreground bg-muted px-2 py-1 rounded-lg">
                                                    {item.quantity} 
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <span className="font-black text-sm text-slate-900">
                                                    {(Number(item.quantity) * Number(session.quantityProduced)).toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!session.bom?.items || session.bom.items.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="py-20 text-center text-muted-foreground italic text-sm">
                                                Data bahan baku tidak tersedia untuk resep ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-8 bg-muted/10 border-t border-border/50">
                            <div className="flex items-start gap-3 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                                <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-blue-900">Informasi Mutasi Stok</p>
                                    <p className="text-[11px] text-blue-700/80 leading-relaxed uppercase font-medium">
                                        Sistem telah secara otomatis mengurangi stok bahan baku di atas dari gudang produksi dan menambahkan {session.quantityProduced} unit {session.bom?.targetProduct?.name} ke inventori barang jadi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
