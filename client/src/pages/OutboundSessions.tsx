import { useOutboundSessions, useCreateOutboundSession } from "@/hooks/use-outbound";
import { useBranches } from "@/hooks/use-branches";
import { useRole } from "@/hooks/use-role";
import { Link } from "wouter";
import { Plus, Truck, Calendar, Loader2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const outboundFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    toBranchId: z.string().optional(),
    notes: z.string().optional(),
});

export default function OutboundSessions() {
    const { isAdmin, isSKUManager, isDriver } = useRole();
    const { data: sessions, isLoading } = useOutboundSessions();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const canCreate = isAdmin || isSKUManager || isDriver;

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Barang Keluar (Outbound)</h1>
                    <p className="text-muted-foreground mt-2">Kelola pengiriman stok barang keluar dari gudang/toko.</p>
                </div>
                <div>
                    {canCreate && (
                        <CreateOutboundDialog
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                        />
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : sessions?.length === 0 ? (
                <div className="bg-card border border-border/50 rounded-2xl p-16 text-center shadow-sm">
                    <Truck className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">Belum ada Sesi Outbound</h3>
                    <p className="text-muted-foreground mt-1 mb-6">Mulai sesi pengiriman barang baru untuk mencatat stok keluar.</p>
                    {canCreate && <Button onClick={() => setIsCreateOpen(true)} data-testid="button-start-outbound-empty">Mulai Sesi Outbound</Button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions?.map((session) => (
                        <Link key={session.id} href={`/outbound/${session.id}`}>
                            <div
                                className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group flex flex-col h-full"
                                data-testid={`card-outbound-${session.id}`}
                            >
                                <div className="flex items-start justify-between mb-4 gap-2">
                                    <div className="p-3 bg-primary/5 rounded-xl group-hover:bg-primary/10 transition-colors">
                                        <Truck className="w-6 h-6 text-primary" />
                                    </div>
                                    <StatusBadge status={session.status} />
                                </div>

                                <h3 className="font-display font-bold text-lg mb-2">{session.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2 flex-1">
                                    {session.notes || "Tidak ada catatan tambahan."}
                                </p>

                                <div className="pt-4 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    Dimulai {format(new Date(session.startedAt), 'MMMM d, yyyy')}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function BranchesOptions() {
    const { data: branches } = useBranches();
    return (
        <>
            {branches?.map(branch => (
                <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                </SelectItem>
            ))}
        </>
    );
}

function CreateOutboundDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const createSession = useCreateOutboundSession();
    const form = useForm<z.infer<typeof outboundFormSchema>>({
        resolver: zodResolver(outboundFormSchema),
        defaultValues: {
            title: "",
            toBranchId: "",
            notes: "",
        },
    });

    const onSubmit = (values: z.infer<typeof outboundFormSchema>) => {
        const data = {
            ...values,
            toBranchId: values.toBranchId ? Number(values.toBranchId) : undefined
        };
        createSession.mutate(data, {
            onSuccess: () => {
                onOpenChange(false);
                form.reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button data-testid="button-new-outbound">
                    <Plus className="w-4 h-4 mr-2" />
                    Sesi Outbound Baru
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Mulai Sesi Pengiriman Barang</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Judul Sesi (Tujuan/Keperluan)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Pengiriman Toko Cabang A - 25 Maret" {...field} data-testid="input-outbound-title" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="toBranchId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cabang Tujuan (Jika Transfer)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger data-testid="select-outbound-branch">
                                                <SelectValue placeholder="Pilih Cabang (Opsional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="">Bukan Transfer (Umum)</SelectItem>
                                            <BranchesOptions />
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Catatan (Opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Nomor surat jalan, kendaraan, dll..." {...field} value={field.value || ""} data-testid="input-outbound-notes" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-outbound">
                                Batal
                            </Button>
                            <Button type="submit" disabled={createSession.isPending} data-testid="button-submit-outbound">
                                {createSession.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Mulai Sesi
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
