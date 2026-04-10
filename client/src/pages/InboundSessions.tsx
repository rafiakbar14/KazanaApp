import { useInboundSessions, useCreateInboundSession } from "@/hooks/use-inbound";
import { useRole } from "@/hooks/use-role";
import { Link } from "wouter";
import { Plus, Warehouse, Calendar, Loader2, ClipboardList } from "lucide-react";
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

const inboundFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    notes: z.string().optional(),
});

export default function InboundSessions() {
    const { isAdmin, isSKUManager } = useRole();
    const { data: sessions, isLoading } = useInboundSessions();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const canCreate = isAdmin || isSKUManager;

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Barang Masuk (Inbound)</h1>
                    <p className="text-muted-foreground mt-2">Kelola penerimaan stok barang baru ke gudang/toko.</p>
                </div>
                <div>
                    {canCreate && (
                        <CreateInboundDialog
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
                    <Warehouse className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-lg font-semibold text-foreground">Belum ada Sesi Inbound</h3>
                    <p className="text-muted-foreground mt-1 mb-6">Mulai sesi penerimaan barang baru untuk mencatat stok masuk.</p>
                    {canCreate && <Button onClick={() => setIsCreateOpen(true)} data-testid="button-start-inbound-empty">Mulai Sesi Inbound</Button>}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions?.map((session) => (
                        <Link key={session.id} href={`/inbound/${session.id}`}>
                            <div
                                className="bg-card p-6 rounded-2xl border border-border/50 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer group flex flex-col h-full"
                                data-testid={`card-inbound-${session.id}`}
                            >
                                <div className="flex items-start justify-between mb-4 gap-2">
                                    <div className="p-3 bg-primary/5 rounded-xl group-hover:bg-primary/10 transition-colors">
                                        <Warehouse className="w-6 h-6 text-primary" />
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

function CreateInboundDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const createSession = useCreateInboundSession();
    const form = useForm<z.infer<typeof inboundFormSchema>>({
        resolver: zodResolver(inboundFormSchema),
        defaultValues: {
            title: "",
            notes: "",
        },
    });

    const onSubmit = (data: z.infer<typeof inboundFormSchema>) => {
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
                <Button data-testid="button-new-inbound">
                    <Plus className="w-4 h-4 mr-2" />
                    Sesi Inbound Baru
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mulai Sesi Penerimaan Barang</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Judul Sesi</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Contoh: Kiriman Supplier A - 25 Maret" {...field} data-testid="input-inbound-title" />
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
                                    <FormLabel>Catatan (Opsional)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Nomor surat jalan, kondisi barang, dll..." {...field} value={field.value || ""} data-testid="input-inbound-notes" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-inbound">
                                Batal
                            </Button>
                            <Button type="submit" disabled={createSession.isPending} data-testid="button-submit-inbound">
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
