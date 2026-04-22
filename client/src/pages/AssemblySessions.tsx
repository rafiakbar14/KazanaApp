import { useAssemblySessions, useCreateAssemblySession, useCompleteAssemblySession, useBOMs } from "@/hooks/use-production";
import { Link } from "wouter";
import { Plus, History, Play, CheckCircle2, Loader2, ArrowRight, Settings2, Package, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

const assemblyFormSchema = z.object({
    bomId: z.string().min(1, "Resep (BOM) wajib dipilih"),
    quantityProduced: z.string().min(1, "Jumlah produksi wajib diisi"),
    notes: z.string().optional(),
});

export default function AssemblySessions() {
    const { data: sessions, isLoading: sessionsLoading } = useAssemblySessions();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const completeSession = useCompleteAssemblySession();

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground font-gradient">Sesi Produksi</h1>
                    <p className="text-muted-foreground mt-2 font-medium">Catat dan lacak proses perakitan barang jadi dari bahan baku.</p>
                </div>
                <CreateAssemblyDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sessionsLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : sessions?.length === 0 ? (
                    <div className="bg-card border border-border/50 rounded-3xl p-20 text-center shadow-premium bg-glass animate-in fade-in zoom-in-95">
                        <History className="w-16 h-16 mx-auto text-primary/20 mb-6" />
                        <h3 className="text-xl font-bold text-foreground">Belum ada sesi produksi</h3>
                        <p className="text-muted-foreground mt-2 mb-8 max-w-md mx-auto">
                            Mulai sesi produksi pertama Anda untuk mengotomatisasi pengurangan stok bahan baku dan penambahan barang jadi.
                        </p>
                        <Button size="lg" className="rounded-2xl px-8 shadow-lg shadow-primary/20" onClick={() => setIsCreateOpen(true)}>
                            Mulai Produksi Sekarang
                        </Button>
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-muted/50 border-b border-border/50">
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">ID / Tanggal</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Resep (BOM)</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center">Hasil Jadi</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {sessions?.map((session) => (
                                    <tr key={session.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="p-4">
                                            <p className="font-bold text-sm">PROD-{session.id.toString().padStart(4, '0')}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {format(new Date(session.createdAt), "dd MMM yyyy, HH:mm", { locale: idLocale })}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Settings2 className="w-4 h-4 text-primary/60" />
                                                <span className="font-medium text-sm">BOM #{session.bomId}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <Badge variant="outline" className="font-mono bg-primary/5 border-primary/20 text-primary px-3 py-1 text-sm rounded-lg">
                                                {session.quantityProduced} Unit
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <Badge className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1 flex items-center w-fit gap-1.5 rounded-full">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Final
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link href={`/production/assembly/${session.id}`}>
                                                <Button variant="ghost" size="sm" className="h-8 rounded-lg group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                                                    Detail
                                                    <ArrowRight className="w-4 h-4 ml-1.5" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function CreateAssemblyDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const createSession = useCreateAssemblySession();
    const completeSession = useCompleteAssemblySession();
    const { data: boms } = useBOMs();

    const form = useForm<z.infer<typeof assemblyFormSchema>>({
        resolver: zodResolver(assemblyFormSchema),
        defaultValues: { bomId: "", quantityProduced: "1", notes: "" },
    });

    const onSubmit = (values: z.infer<typeof assemblyFormSchema>) => {
        createSession.mutate({
            ...values,
            bomId: Number(values.bomId),
            quantityProduced: Number(values.quantityProduced),
        }, {
            onSuccess: (data) => {
                // For this MVP, we auto-finalize immediately after creation
                completeSession.mutate(data.id, {
                    onSuccess: () => {
                        onOpenChange(false);
                        form.reset();
                    }
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button size="lg" className="rounded-2xl shadow-lg shadow-primary/20 animate-pulse-subtle">
                    <Plus className="w-5 h-5 mr-2" />
                    Mulai Produksi
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-border/50 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-display font-bold flex items-center gap-2">
                        <Play className="w-5 h-5 text-primary fill-primary" />
                        Sesi Produksi Baru
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                        <FormField
                            control={form.control}
                            name="bomId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold">Resep Produksi (BOM)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="rounded-xl h-11">
                                                <SelectValue placeholder="Pilih Resep" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-xl shadow-xl border-border/50">
                                            {boms?.map(bom => (
                                                <SelectItem key={bom.id} value={bom.id.toString()} className="rounded-lg py-3 cursor-pointer">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm">{bom.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">ID: {bom.id} | v{bom.version}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="quantityProduced"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold">Jumlah yang Diproduksi</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input type="number" className="pl-9 rounded-xl h-11" placeholder="0" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-semibold text-muted-foreground">Catatan Produksi (Opsional)</FormLabel>
                                    <FormControl>
                                        <Input className="rounded-xl h-11" placeholder="Shift pagi, batch A, dll" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-2">
                            <div className="flex gap-3">
                                <ClipboardCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                <p className="text-[11px] leading-relaxed text-primary/80">
                                    Dengan memulai produksi ini, sistem akan secara otomatis **mengurangi stok bahan baku** yang terdaftar di resep dan **menambah stok barang jadi** setelah sesi selesai.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Batal</Button>
                            <Button type="submit" className="rounded-xl px-8" disabled={createSession.isPending || completeSession.isPending}>
                                {(createSession.isPending || completeSession.isPending) ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4 mr-2 fill-current" />
                                )}
                                Proses Produksi
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
