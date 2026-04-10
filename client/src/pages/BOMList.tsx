import { useBOMs, useCreateBOM } from "@/hooks/use-production";
import { useProducts } from "@/hooks/use-products";
import { Link } from "wouter";
import { Plus, BookOpen, Settings2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const bomFormSchema = z.object({
    name: z.string().min(1, "Nama BOM wajib diisi"),
    targetProductId: z.string().min(1, "Produk jadi wajib dipilih"),
    notes: z.string().optional(),
});

export default function BOMList() {
    const { data: boms, isLoading } = useBOMs();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Resep Produksi (BOM)</h1>
                    <p className="text-muted-foreground mt-2">Kelola daftar resep dan komponen bahan baku untuk barang jadi.</p>
                </div>
                <CreateBOMDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : boms?.length === 0 ? (
                <div className="bg-card border border-border/50 rounded-2xl p-16 text-center shadow-sm">
                    <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">Belum ada BOM</h3>
                    <p className="text-muted-foreground mt-1 mb-6">Buat resep produksi pertama Anda untuk mulai mencatat sesi perakitan.</p>
                    <Button onClick={() => setIsCreateOpen(true)}>Buat BOM Baru</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boms?.map((bom) => (
                        <Link key={bom.id} href={`/production/boms/${bom.id}`}>
                            <div className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-primary/5 rounded-xl group-hover:bg-primary/10 transition-colors">
                                        <Settings2 className="w-6 h-6 text-primary" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                </div>
                                <h3 className="font-display font-bold text-lg mb-1">{bom.name}</h3>
                                <p className="text-xs text-muted-foreground mb-4 font-mono">v{bom.version || "1.0"}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2 italic">
                                    {bom.notes || "Tidak ada catatan."}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function CreateBOMDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const createBOM = useCreateBOM();
    const { data: allProducts } = useProducts();
    const form = useForm<z.infer<typeof bomFormSchema>>({
        resolver: zodResolver(bomFormSchema),
        defaultValues: { name: "", targetProductId: "", notes: "" },
    });

    const onSubmit = (values: z.infer<typeof bomFormSchema>) => {
        createBOM.mutate({
            ...values,
            targetProductId: Number(values.targetProductId),
        }, {
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    BOM Baru
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Buat Resep Produksi Baru</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="targetProductId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Produk Jadi (Hasil Akhir)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Produk Jadi" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {allProducts?.map(p => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.name} ({p.sku})
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
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nama Resep / BOM</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Resep Meja Kayu v1" {...field} />
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
                                    <FormLabel>Catatan Tambahan</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Versi, metode perakitan, dll" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
                            <Button type="submit" disabled={createBOM.isPending}>
                                {createBOM.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Simpan Resep
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
