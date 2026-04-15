import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Branch, Product, StockTransferWithItems } from "@shared/schema";
import { 
  Truck, 
  Plus, 
  ArrowRightLeft, 
  CheckCircle2, 
  Clock, 
  History,
  Info,
  Package,
  ArrowRight,
  User,
  Loader2,
  AlertCircle,
  Warehouse,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export default function StockTransfer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // States for new transfer
  const [fromBranchId, setFromBranchId] = useState<string>("");
  const [toBranchId, setToBranchId] = useState<string>("");
  const [driverName, setDriverName] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<{ productId: number; quantity: number }[]>([]);

  const { data: transfers = [], isLoading } = useQuery<StockTransferWithItems[]>({
    queryKey: [api.transfers.list.path],
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: [api.branches.list.path],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [api.products.list.path],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.transfers.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal membuat transfer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transfers.list.path] });
      toast({ title: "Berhasil", description: "Transfer stok telah dikirim" });
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const receiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.transfers.receive.path, { id }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivedBy: user?.firstName || "Staff" }),
      });
      if (!res.ok) throw new Error("Gagal menerima transfer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.transfers.list.path] });
      toast({ title: "Berhasil", description: "Stok telah diterima di cabang tujuan" });
    },
  });

  const resetForm = () => {
    setFromBranchId("");
    setToBranchId("");
    setDriverName("");
    setSelectedItems([]);
  };

  const addItem = (productId: number) => {
    if (selectedItems.find(i => i.productId === productId)) return;
    setSelectedItems([...selectedItems, { productId, quantity: 1 }]);
  };

  const removeItem = (productId: number) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId));
  };

  const updateItemQty = (productId: number, qty: number) => {
    setSelectedItems(selectedItems.map(i => 
      i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i
    ));
  };

  const handleCreate = () => {
    if (!fromBranchId || !toBranchId || selectedItems.length === 0) {
      return toast({ title: "Peringatan", description: "Harap lengkapi data transfer", variant: "destructive" });
    }
    if (fromBranchId === toBranchId) {
      return toast({ title: "Error", description: "Asal dan tujuan tidak boleh sama", variant: "destructive" });
    }

    createMutation.mutate({
      fromBranchId: Number(fromBranchId),
      toBranchId: Number(toBranchId),
      driverName: driverName || null,
      items: selectedItems,
      status: "in_transit",
      transferredBy: user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Staff",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "received": 
        return <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Berhasil Diterima</Badge>;
      case "in_transit": 
        return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse italic">Dalam Perjalanan</Badge>;
      case "cancelled": 
        return <Badge variant="destructive" className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Dibatalkan</Badge>;
      default: 
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Draft</Badge>;
    }
  };

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <Truck className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>
      <p className="text-gray-400 font-medium animate-pulse">Memuat data logistik...</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
               <Truck className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">Mutasi Antar Cabang</h1>
          </div>
          <p className="text-gray-500 font-medium ml-12">Manajemen logistik dan perpindahan stok antar lokasi bisnis Anda.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_10px_20px_rgba(0,68,204,0.2)] h-12 px-6 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5 mr-2" />
              Buat Mutasi Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-slate-50">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Formulir Pengiriman Barang</DialogTitle>
                <p className="text-blue-100/70 text-sm">Pastikan stok fisik sesuai dengan yang akan dikirim.</p>
              </DialogHeader>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Cabang Asal</Label>
                  <Select value={fromBranchId} onValueChange={setFromBranchId}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:ring-blue-500/20">
                      <SelectValue placeholder="Pilih cabang pengirim" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id.toString()} className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <Warehouse className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{b.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Cabang Tujuan</Label>
                  <Select value={toBranchId} onValueChange={setToBranchId}>
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:ring-blue-500/20">
                      <SelectValue placeholder="Pilih cabang penerima" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {branches.map(b => (
                        <SelectItem key={b.id} value={b.id.toString()} className="rounded-lg">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-emerald-500" />
                            <span className="font-medium">{b.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Nama Driver (Opsional)</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="E.g. Pak Budi (Driver Internal)" 
                    className="h-12 pl-12 rounded-xl border-gray-200 bg-white shadow-sm focus:ring-blue-500/20 font-medium"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Daftar Barang Mutasi</Label>
                <Select onValueChange={(v) => addItem(Number(v))}>
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm">
                    <SelectValue placeholder="Cari SKU atau Nama Produk..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()} className="rounded-lg">
                        <div className="flex justify-between items-center w-full gap-4">
                          <span className="font-bold">{p.sku}</span>
                          <span className="text-gray-500 font-medium">{p.name}</span>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600 font-bold ml-auto">{p.currentStock}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="border border-dashed border-gray-200 rounded-2xl p-4 bg-gray-50/50 space-y-3 min-h-[100px]">
                  {selectedItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-400 gap-2">
                       <Package className="w-8 h-8 opacity-20" />
                       <p className="italic text-sm">Belum ada barang yang ditambahkan</p>
                    </div>
                  )}
                  {selectedItems.map((item, idx) => {
                    const p = products.find(x => x.id === item.productId);
                    return (
                      <div key={idx} className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 group">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-gray-900 truncate uppercase tracking-tight">{p?.name}</p>
                          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{p?.sku}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Kuantitas</p>
                             <Input 
                               type="number" 
                               className="w-24 h-10 rounded-xl border-gray-100 bg-slate-50 font-bold text-center focus:ring-blue-500/20" 
                               value={item.quantity} 
                               onChange={(e) => updateItemQty(item.productId, Number(e.target.value))} 
                             />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-red-100 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" 
                            onClick={() => removeItem(item.productId)}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 uppercase tracking-tight" 
                  onClick={handleCreate} 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  ) : (
                    <Truck className="w-6 h-6 mr-2" />
                  )}
                  Konfirmasi & Kirim Mutasi
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {transfers.map((t) => (
          <Card key={t.id} className="border border-white/40 bg-white/60 backdrop-blur-xl shadow-2xl shadow-gray-200/40 rounded-[2rem] overflow-hidden hover:scale-[1.01] transition-all duration-300">
            <CardContent className="p-0">
              <div className="flex flex-col lg:flex-row">
                <div className={cn(
                  "p-8 lg:w-48 flex flex-col justify-center items-center gap-2 relative",
                  t.status === 'received' ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5' : 'bg-gradient-to-br from-blue-500/10 to-blue-600/5'
                )}>
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner",
                    t.status === 'received' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
                  )}>
                    {t.status === 'received' ? <CheckCircle2 className="w-8 h-8" /> : <Truck className="w-8 h-8" />}
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">MUTASI</span>
                    <p className="text-lg font-black text-gray-900 leading-none">#{t.id}</p>
                  </div>
                </div>
                
                <div className="flex-1 p-8 lg:p-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-6 p-2 pr-6 bg-slate-100/50 rounded-full border border-white/20">
                      <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-100">
                         <Warehouse className="w-4 h-4 text-blue-500" />
                         <span className="text-sm font-black text-gray-900 tracking-tight">{t.fromBranch?.name || "Gudang Asal"}</span>
                      </div>
                      <div className="p-1 bg-white rounded-full shadow-md">
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      </div>
                      <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-100">
                         <Store className="w-4 h-4 text-emerald-500" />
                         <span className="text-sm font-black text-gray-900 tracking-tight">{t.toBranch?.name || "Toko Tujuan"}</span>
                      </div>
                    </div>
                    <div className="shrink-0">{getStatusBadge(t.status)}</div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Isi Paket</Label>
                      <div className="flex items-center gap-3 text-gray-700 bg-white/40 p-3 rounded-2xl">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Package className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-black">{t.items.length} <span className="font-medium text-gray-500 text-xs">SKU</span></span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Pengirim & Driver</Label>
                      <div className="flex flex-col gap-2 text-gray-700 bg-white/40 p-3 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-black truncate">{t.transferredBy}</span>
                        </div>
                        {t.driverName && (
                          <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                             <Truck className="w-3 h-3 text-blue-500" />
                             <span className="text-[10px] font-bold text-gray-500 italic">{t.driverName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Waktu</Label>
                      <div className="flex items-center gap-3 text-gray-700 bg-white/40 p-3 rounded-2xl">
                        <div className="bg-slate-100 p-2 rounded-lg">
                          <Clock className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-sm font-bold">{format(new Date(t.createdAt), "dd MMM, HH:mm")}</span>
                      </div>
                    </div>

                    {t.status === 'in_transit' ? (
                      <div className="flex items-end">
                        <Button 
                          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all uppercase tracking-widest" 
                          onClick={() => receiveMutation.mutate(t.id)} 
                          disabled={receiveMutation.isPending}
                        >
                          {receiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Konfirmasi Terima"}
                        </Button>
                      </div>
                    ) : t.status === 'received' ? (
                       <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Penerima</Label>
                        <div className="flex items-center gap-3 text-gray-700 bg-emerald-50/50 p-3 rounded-2xl">
                          <div className="bg-emerald-100 p-2 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                          <span className="text-xs font-bold text-emerald-800">{t.receivedBy || "-"}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {transfers.length === 0 && (
          <div className="text-center py-24 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-xl border-dashed">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900">Belum ada aktivitas mutasi</h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">Klik tombol di kanan atas untuk membuat pengiriman barang pertama Anda antar cabang.</p>
          </div>
        )}
      </div>
    </div>
  );
}
