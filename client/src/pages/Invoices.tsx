import { useInvoices, useCreateSalesReturn } from "@/hooks/use-invoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ArrowRight, ClipboardList, CheckCircle2, AlertCircle, Printer, ArrowLeftRight } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useState } from "react";
import InvoicePrinter from "@/components/InvoicePrinter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Invoices() {
    const { invoices, isLoading, updateStatus } = useInvoices();
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [returnInvoice, setReturnInvoice] = useState<any>(null);
    const [returnReason, setReturnReason] = useState("");
    
    const createReturn = useCreateSalesReturn();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "paid": return <Badge className="bg-green-500">Lunas</Badge>;
            case "pending": return <Badge className="bg-amber-500">Menunggu</Badge>;
            case "overdue": return <Badge className="bg-red-500">Jatuh Tempo</Badge>;
            case "refunded": return <Badge className="bg-purple-500">Telah Diretur</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const handleMarkPaid = async (id: number) => {
        if (confirm("Apakah Anda yakin ingin menandai invoice ini sebagai lunas?")) {
            await updateStatus.mutateAsync({ id, status: "paid" });
        }
    };

    const handleReturnSubmit = async () => {
        if (!returnReason) return alert("Harap isi alasan retur.");
        
        const returnItems = returnInvoice.items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            reason: returnReason,
            condition: "defective"
        }));

        createReturn.mutate({
            saleId: returnInvoice.id,
            reason: returnReason,
            totalRefundAmount: returnInvoice.totalAmount.toString(),
            items: returnItems
        }, {
            onSuccess: () => {
                setReturnInvoice(null);
                setReturnReason("");
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-enter">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Invoice & Piutang</h1>
                    <p className="text-muted-foreground mt-1">Kelola penjualan ERP dan pelacakan piutang</p>
                </div>
                <Link href="/sales/invoices/new">
                    <Button className="rounded-xl h-12 px-6 font-bold shadow-lg shadow-primary/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Buat Invoice Baru
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {invoices?.length === 0 ? (
                    <Card className="p-12 text-center border-dashed border-2">
                        <div className="bg-primary/10 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <ClipboardList className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Belum ada invoice</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">Mulai buat invoice baru untuk mencatat penjualan besar atau penjualan dengan jatuh tempo.</p>
                        <Link href="/sales/invoices/new">
                            <Button variant="outline" className="rounded-xl">Buat Invoice Pertama</Button>
                        </Link>
                    </Card>
                ) : (
                    invoices?.map((invoice) => (
                        <Card key={invoice.id} className="overflow-hidden bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all group">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                                    {/* Info Utama */}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                                {invoice.invoiceNumber || `#${invoice.id}`}
                                            </span>
                                            {getStatusBadge(invoice.paymentStatus)}
                                        </div>
                                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                                            {invoice.customer?.name || "Pelanggan Umum"}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground font-medium">
                                            <div className="flex items-center gap-1.5">
                                                {format(new Date(invoice.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-border" />
                                            <div className="flex items-center gap-1.5">
                                                {invoice.items.length} Item
                                            </div>
                                        </div>
                                    </div>

                                    {/* Jatuh Tempo & Total */}
                                    <div className="flex flex-col md:items-end gap-2 md:min-w-[200px]">
                                        <p className="text-2xl font-display font-bold text-foreground">
                                            Rp {Number(invoice.totalAmount).toLocaleString('id-ID')}
                                        </p>
                                        {invoice.dueDate && (
                                            <p className={idLocale.code === 'id' ? "text-xs font-bold text-muted-foreground flex items-center gap-1" : "text-xs font-bold text-muted-foreground flex items-center gap-1"}>
                                                <ArrowRight className="w-3 h-3" />
                                                Jatuh Tempo: {format(new Date(invoice.dueDate), 'dd MMM yyyy', { locale: idLocale })}
                                            </p>
                                        )}
                                    </div>

                                    {/* Aksi */}
                                    <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
                                        {invoice.paymentStatus !== 'paid' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50 font-bold"
                                                onClick={() => handleMarkPaid(invoice.id)}
                                                disabled={updateStatus.isPending}
                                            >
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Tandai Lunas
                                            </Button>
                                        )}
                                        {invoice.paymentStatus === 'paid' && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-bold"
                                                onClick={() => setReturnInvoice(invoice)}
                                            >
                                                <ArrowLeftRight className="w-4 h-4 mr-2" />
                                                Ajukan Retur
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="font-bold border-primary/20 text-primary hover:bg-primary/5 h-9 px-4 rounded-lg"
                                            onClick={() => setSelectedInvoice(invoice)}
                                        >
                                            <Printer className="w-4 h-4 mr-2" />
                                            Cetak
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {selectedInvoice && (
                <InvoicePrinter
                    invoice={selectedInvoice}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}

            <Dialog open={!!returnInvoice} onOpenChange={(open) => !open && setReturnInvoice(null)}>
                <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                            Retur Transaksi
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-sm font-bold text-slate-500">Invoice Target</p>
                            <p className="text-lg font-black text-slate-800">{returnInvoice?.invoiceNumber || `#${returnInvoice?.id}`}</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Alasan Retur</label>
                            <textarea 
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                placeholder="Jelaskan alasan pengembalian dana/barang... (Contoh: Barang cacat pabrik)"
                            ></textarea>
                            <p className="text-xs text-slate-500">Proses retur akan menarik seluruh item dan mengembalikan HPP dan Stok secara otomatis.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReturnInvoice(null)} className="rounded-xl">Batal</Button>
                        <Button 
                            onClick={handleReturnSubmit} 
                            disabled={createReturn.isPending}
                            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold"
                        >
                            {createReturn.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Proses Retur (Full Refund)
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
