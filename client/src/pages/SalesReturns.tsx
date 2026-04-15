import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { 
  Undo2, Search, Package, ArrowLeft, Loader2, 
  AlertCircle, CheckCircle2, History, Info,
  Trash2, ShoppingBag, Calendar, User, Hash,
  ChevronRight, RefreshCw, XCircle
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SalesReturns() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [receiptNumber, setReceiptNumber] = useState("");
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  
  // Return Form State
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<Record<number, { quantity: number; restockStatus: string }>>({});
  const [returnReason, setReturnReason] = useState("damaged");
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState("cash");

  const { data: returnHistory, isLoading: loadingHistory } = useQuery<any[]>({
    queryKey: ["/api/rma/list"],
    enabled: activeTab === "history"
  });

  const searchMutation = useMutation({
    mutationFn: async (num: string) => {
      const res = await fetch(`/api/sales/find/${num}`);
      if (!res.ok) throw new Error("Nota tidak ditemukan");
      return res.json();
    },
    onSuccess: (data) => {
      setSelectedSale(data);
      // Initialize return items with 0
      const initialItems: any = {};
      data.items.forEach((item: any) => {
        initialItems[item.id] = { quantity: 0, restockStatus: "restocked" };
      });
      setReturnItems(initialItems);
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Pencarian Gagal",
        description: err.message
      });
    }
  });

  const createReturnMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch("/api/rma/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal memproses retur");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Retur Berhasil",
        description: "Data pengembalian telah disimpan dan stok diperbarui."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rma/list"] });
      setSelectedSale(null);
      setReceiptNumber("");
      setActiveTab("history");
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message
      });
    }
  });

  const handleItemQtyChange = (itemId: number, qty: number, max: number) => {
    if (qty < 0 || qty > max) return;
    setReturnItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: qty }
    }));
  };

  const handleRestockStatusChange = (itemId: number, status: string) => {
    setReturnItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], restockStatus: status }
    }));
  };

  const handleSubmitReturn = () => {
    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, val]) => val.quantity > 0)
      .map(([itemId, val]) => {
        const originalItem = selectedSale.items.find((i: any) => i.id === Number(itemId));
        return {
          saleItemId: Number(itemId),
          productId: originalItem.productId,
          quantityReturned: val.quantity,
          restockStatus: val.restockStatus
        };
      });

    if (itemsToReturn.length === 0) {
      toast({
        variant: "destructive",
        title: "Pilih Item",
        description: "Minimal 1 item harus dikembalikan."
      });
      return;
    }

    const totalRefund = itemsToReturn.reduce((sum, item) => {
      const originalItem = selectedSale.items.find((i: any) => i.id === item.saleItemId);
      return sum + (Number(originalItem.price) * item.quantityReturned);
    }, 0);

    const payload = {
      saleId: selectedSale.id,
      returnNumber: `RMA-${Date.now()}`,
      reason: returnReason,
      refundAmount: totalRefund.toString(),
      refundMethod,
      notes,
      items: itemsToReturn
    };

    createReturnMutation.mutate(payload);
  };

  return (
    <div className="p-8 space-y-8 bg-zinc-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/pos")} className="hover:bg-white rounded-full bg-white shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
              <Undo2 className="w-8 h-8 text-rose-600" />
              Retur & RMA
            </h1>
            <p className="text-zinc-500 mt-1">Kelola pengembalian barang dan klaim garansi pelanggan.</p>
          </div>
        </div>
        <div className="bg-white p-1 rounded-xl shadow-sm border border-zinc-200 flex gap-1">
          <Button 
            variant={activeTab === "new" ? "default" : "ghost"} 
            onClick={() => setActiveTab("new")}
            className={cn("rounded-lg h-10 px-6 transition-all", activeTab === "new" ? "shadow-md bg-rose-600 hover:bg-rose-700" : "text-zinc-500")}
          >
            Retur Baru
          </Button>
          <Button 
            variant={activeTab === "history" ? "default" : "ghost"} 
            onClick={() => setActiveTab("history")}
            className={cn("rounded-lg h-10 px-6 transition-all", activeTab === "history" ? "shadow-md bg-rose-600 hover:bg-rose-700" : "text-zinc-500")}
          >
            Riwayat
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "new" ? (
          <motion.div 
            key="new-tab"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              {!selectedSale ? (
                <Card className="border-none shadow-xl shadow-zinc-200/50 rounded-3xl overflow-hidden">
                  <CardHeader className="bg-white pb-8 pt-10 px-10">
                    <CardTitle className="text-2xl font-bold text-zinc-800">Cari Transaksi</CardTitle>
                    <CardDescription>Masukkan Nomor Nota atau UUID Transaksi untuk memulai proses retur.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-10 pb-12 space-y-6">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-rose-500 transition-colors" />
                      <Input 
                        placeholder="Contoh: SALES-12345..." 
                        className="pl-12 h-14 bg-zinc-50 border-zinc-200 rounded-2xl text-lg focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                        value={receiptNumber}
                        onChange={(e) => setReceiptNumber(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchMutation.mutate(receiptNumber)}
                      />
                    </div>
                    <Button 
                      className="w-full h-14 bg-zinc-900 hover:bg-black text-white rounded-2xl text-lg font-semibold gap-3 transition-transform active:scale-[0.98]"
                      onClick={() => searchMutation.mutate(receiptNumber)}
                      disabled={searchMutation.isPending || !receiptNumber}
                    >
                      {searchMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                      Cari Nota Penjualan
                    </Button>
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-sm">
                      <Info className="w-5 h-5 shrink-0" />
                      Pastikan nota valid dan masih dalam periode garansi/kebijakan retur.
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-none shadow-xl shadow-zinc-200/50 rounded-3xl overflow-hidden">
                  <div className="bg-white p-8 border-b border-zinc-100 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900">Detail Item Nota: #{selectedSale.uuid?.slice(0, 8)}</h3>
                      <p className="text-zinc-500 text-sm mt-1">Tentukan jumlah item yang ingin dikembalikan.</p>
                    </div>
                    <Button variant="ghost" className="text-zinc-400 hover:text-zinc-900" onClick={() => setSelectedSale(null)}>
                      Batal & Cari Ulang
                    </Button>
                  </div>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                      {selectedSale.items.map((item: any) => (
                        <div key={item.id} className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white hover:shadow-md transition-all group">
                          <div className="flex gap-4 items-center">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                              <Package className="w-6 h-6 text-zinc-400 group-hover:text-rose-500 transition-colors" />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-800">{item.product?.name || "Produk dihapus"}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] uppercase font-mono py-0">{item.product?.sku}</Badge>
                                <span className="text-xs text-zinc-400">•</span>
                                <span className="text-xs text-zinc-500">Dibeli: {item.quantity} Unit</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col gap-2">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Jumlah Retur</span>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="outline" size="icon" className="h-9 w-9 rounded-lg"
                                  onClick={() => handleItemQtyChange(item.id, returnItems[item.id].quantity - 1, item.quantity)}
                                  disabled={returnItems[item.id].quantity <= 0}
                                >-</Button>
                                <Input 
                                  type="number" 
                                  className="w-16 h-9 text-center font-bold bg-white rounded-lg border-zinc-200"
                                  value={returnItems[item.id].quantity}
                                  onChange={(e) => handleItemQtyChange(item.id, parseInt(e.target.value) || 0, item.quantity)}
                                />
                                <Button 
                                  variant="outline" size="icon" className="h-9 w-9 rounded-lg"
                                  onClick={() => handleItemQtyChange(item.id, returnItems[item.id].quantity + 1, item.quantity)}
                                  disabled={returnItems[item.id].quantity >= item.quantity}
                                >+</Button>
                              </div>
                            </div>

                            <div className={cn("flex flex-col gap-2 transition-opacity", returnItems[item.id].quantity > 0 ? "opacity-100" : "opacity-30 pointer-events-none")}>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status Stok</span>
                              <Select 
                                value={returnItems[item.id].restockStatus} 
                                onValueChange={(val) => handleRestockStatusChange(item.id, val)}
                              >
                                <SelectTrigger className="w-32 h-9 bg-white rounded-lg border-zinc-200 text-xs font-medium">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-zinc-200 shadow-xl">
                                  <SelectItem value="restocked">Restock</SelectItem>
                                  <SelectItem value="disposed">Reject/Buang</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {selectedSale && (
                  <>
                    <Card className="border-none shadow-xl shadow-zinc-200/50 rounded-3xl overflow-hidden bg-zinc-900 border-zinc-800 text-white">
                      <CardHeader>
                        <CardTitle className="text-lg">Konfigurasi Retur</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Alasan Utama</label>
                          <Select value={returnReason} onValueChange={setReturnReason}>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 rounded-xl h-11 text-zinc-100">
                              <SelectValue placeholder="Pilih alasan" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-zinc-700 bg-zinc-800 text-zinc-100">
                              <SelectItem value="damaged">Produk Rusak</SelectItem>
                              <SelectItem value="wrong_item">Salah Barang</SelectItem>
                              <SelectItem value="expired">Kadaluarsa</SelectItem>
                              <SelectItem value="customer_change">Pelanggan Berubah Pikiran</SelectItem>
                              <SelectItem value="other">Alasan Lain</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Metode Refund</label>
                          <Select value={refundMethod} onValueChange={setRefundMethod}>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 rounded-xl h-11 text-zinc-100">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-zinc-700 bg-zinc-800 text-zinc-100">
                              <SelectItem value="cash">Tunai (Cash)</SelectItem>
                              <SelectItem value="credit_note">Credit Note (Saldo)</SelectItem>
                              <SelectItem value="original">Kembali ke Pembayaran Awal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Catatan Tambahan</label>
                          <Textarea 
                            placeholder="Tulis detail kerusakan atau alasan retur..." 
                            className="bg-zinc-800 border-zinc-700 rounded-xl min-h-[100px] text-zinc-100 placeholder:text-zinc-500"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>

                        <Separator className="bg-zinc-800" />

                        <div className="flex justify-between items-center bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
                          <p className="text-zinc-400 text-sm">Prakiraan Refund</p>
                          <p className="text-xl font-bold">
                            Rp {Object.entries(returnItems).reduce((sum, [id, val]) => {
                              const item = selectedSale.items.find((i: any) => i.id === Number(id));
                              return sum + (Number(item?.price || 0) * val.quantity);
                            }, 0).toLocaleString("id-ID")}
                          </p>
                        </div>

                        <Button 
                          className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-lg font-bold gap-3 shadow-lg shadow-rose-900/20 active:scale-[0.98] transition-all"
                          disabled={createReturnMutation.isPending}
                          onClick={handleSubmitReturn}
                        >
                          {createReturnMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                          Proses Retur Sekarang
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-sm font-bold text-zinc-800">Ringkasan Penjualan</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-6">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">No. Order</span>
                          <span className="font-mono text-zinc-900">#{selectedSale.orderId || selectedSale.uuid?.slice(0, 8)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Pelanggan</span>
                          <span className="font-semibold text-zinc-900">{selectedSale.customer?.name || "Umum (Walk-in)"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-500">Tanggal</span>
                          <span className="text-zinc-900">{format(new Date(selectedSale.createdAt), "dd MMM yyyy HH:mm")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="history-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card className="border-none shadow-xl shadow-zinc-200/50 rounded-3xl overflow-hidden">
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100 font-bold uppercase text-[10px] tracking-widest text-zinc-400">
                          <th className="px-8 py-5">No. Retur & Waktu</th>
                          <th className="px-8 py-5">Penjualan Terkait</th>
                          <th className="px-8 py-5">Alasan</th>
                          <th className="px-8 py-5">Total Refund</th>
                          <th className="px-8 py-5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {loadingHistory ? (
                          <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500" /></td></tr>
                        ) : returnHistory?.map((rma) => (
                          <tr key={rma.id} className="hover:bg-zinc-50/50 transition-colors group">
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="font-bold text-zinc-900">{rma.returnNumber}</span>
                                <span className="text-[11px] text-zinc-400 mt-0.5">{format(new Date(rma.createdAt), "dd MMMM yyyy, HH:mm", { locale: id })}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <Badge variant="outline" className="bg-zinc-50 border-zinc-200 hover:bg-white cursor-pointer" onClick={() => {
                                setReceiptNumber(rma.sale.orderId || rma.sale.uuid);
                                setActiveTab("new");
                                searchMutation.mutate(rma.sale.orderId || rma.sale.uuid);
                                toast({ title: "Membuka Detail", description: "Menampilkan nota penjualan terkait." });
                              }}>
                                #{rma.sale.orderId || rma.sale.uuid?.slice(0, 8)}
                              </Badge>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="capitalize font-medium text-zinc-700">{rma.reason.replace('_', ' ')}</span>
                                <span className="text-[11px] text-zinc-400 line-clamp-1">{rma.notes || "-"}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 font-bold text-zinc-900">
                              Rp {Number(rma.refundAmount).toLocaleString("id-ID")}
                            </td>
                            <td className="px-8 py-5 text-right">
                              <Badge className={cn(
                                "rounded-md h-7 px-3 font-semibold text-[10px] shadow-sm",
                                rma.status === "completed" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                              )}>
                                {rma.status === "completed" ? "SELESAI" : "PENDING"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                        {(!returnHistory || returnHistory.length === 0) && !loadingHistory && (
                          <tr>
                            <td colSpan={5} className="py-32 text-center text-zinc-400">
                              <div className="flex flex-col items-center gap-4">
                                <RefreshCw className="w-12 h-12 text-zinc-100 animate-pulse" />
                                <div>
                                  <p className="text-lg font-bold text-zinc-300">Belum Ada Data Retur</p>
                                  <p className="text-sm">Semua riwayat pengembalian barang akan muncul di sini.</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
               </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
