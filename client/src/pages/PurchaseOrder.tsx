import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Product } from "@shared/schema";
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  CheckCircle2, 
  FileText,
  Calendar,
  ExternalLink,
  Loader2,
  PackageCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function PurchaseOrder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New PO State
  const [supplierId, setSupplierId] = useState<string>("");
  const [items, setItems] = useState<{ productId: number; quantityOrdered: number; unitPrice: number }[]>([]);

  const { data: pos = [], isLoading: isLoadingPO } = useQuery<any[]>({
    queryKey: [api.procurement.list.path],
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: [api.procurement.suppliers.list.path],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [api.products.list.path],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.procurement.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal membuat PO");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.procurement.list.path] });
      toast({ title: "PO Diterbitkan", description: "Purchase Order telah berhasil dibuat." });
      setIsDialogOpen(false);
      setSupplierName("");
      setItems([]);
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.procurement.complete.path, { id }), {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal menyelesaikan PO");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.procurement.list.path] });
      toast({ title: "PO Selesai", description: "Status PO diperbarui dan sesi Inbound otomatis dibuat." });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.procurement.approve.path, { id }), {
        method: "POST",
      });
      if (!res.ok) throw new Error("Gagal menyetujui PO");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.procurement.list.path] });
      toast({ title: "PO Disetujui", description: "PO telah disetujui dan dikirim ke supplier." });
    },
  });

  const addItem = (productId: number) => {
    const p = products.find(x => x.id === productId);
    if (!p || items.find(i => i.productId === productId)) return;
    setItems([...items, { productId, quantityOrdered: 1, unitPrice: Number(p.unitCost || 0) }]);
  };

  const updateItem = (productId: number, field: string, val: number) => {
    setItems(items.map(i => i.productId === productId ? { ...i, [field]: val } : i));
  };

  const totalAmount = items.reduce((sum, i) => sum + (i.quantityOrdered * i.unitPrice), 0);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "completed": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Selesai</Badge>;
      case "sent": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Terkirim (Menunggu Barang)</Badge>;
      case "draft": return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Draft (Pending Approval)</Badge>;
      default: return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{status}</Badge>;
    }
  };

  if (isLoadingPO) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <ShoppingBag className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Purchase Order</h1>
            <p className="text-gray-500 mt-1">Kelola pesanan barang ke pemasok dan pantau status pengiriman.</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-6 shadow-xl shadow-blue-200">
              <Plus className="w-4 h-4 mr-2" />
              Buat PO Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">New Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label>Pilih Supplier</Label>
                <Select onValueChange={(v) => setSupplierId(v)}>
                  <SelectTrigger><SelectValue placeholder="Pilih Pemasok..." /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} {s.contactPerson ? `(${s.contactPerson})` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Daftar Pesanan Barang</Label>
                <Select onValueChange={(v) => addItem(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Tambahkan barang..." /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  {items.map((item) => {
                    const p = products.find(x => x.id === item.productId);
                    return (
                      <div key={item.productId} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-xl border">
                        <div className="col-span-6 text-sm font-bold truncate">{p?.name}</div>
                        <div className="col-span-3">
                          <Input type="number" className="h-8" value={item.quantityOrdered} onChange={(e) => updateItem(item.productId, "quantityOrdered", Number(e.target.value))} />
                        </div>
                        <div className="col-span-3">
                          <Input type="number" className="h-8 text-right" value={item.unitPrice} onChange={(e) => updateItem(item.productId, "unitPrice", Number(e.target.value))} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between p-3 bg-blue-50 rounded-xl mt-4">
                    <span className="font-bold">Estimasi Total Kas Keluar:</span>
                    <span className="font-bold text-blue-700">Rp {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full h-12 bg-blue-600 rounded-xl"
                disabled={!supplierId || items.length === 0 || createMutation.isPending}
                onClick={() => {
                   const s = suppliers.find(x => x.id.toString() === supplierId);
                   createMutation.mutate({ 
                     po: { 
                       supplierId: Number(supplierId), 
                       supplierName: s?.name || "Unknown", 
                       totalAmount: totalAmount.toString(), 
                       status: 'draft' 
                     },
                     items 
                   })
                }}
              >
                {createMutation.isPending ? <Loader2 className="animate-spin" /> : "Buat PO (Draft Verifikasi)"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {pos.map((po) => (
          <Card key={po.id} className="border-0 shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden group">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-8 bg-gray-50 flex flex-col items-center justify-center gap-2 border-r group-hover:bg-blue-50 transition-colors">
                  <FileText className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                  <span className="font-bold text-xs text-gray-400">{po.poNumber}</span>
                </div>
                <div className="p-8 flex-1 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{po.supplierName}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>Dipesan pada {format(new Date(po.createdAt), "dd MMM yyyy")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Nilai Pesanan</p>
                        <p className="text-lg font-bold text-blue-600">Rp {Number(po.totalAmount).toLocaleString()}</p>
                      </div>
                      {getStatusBadge(po.status)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 border-t pt-6">
                    <div className="flex items-center gap-2 text-sm">
                      <PackageCheck className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-gray-700">{po.items.length} Macam Barang</span>
                    </div>
                    
                    {po.status !== 'completed' && (
                        <div className="ml-auto flex gap-2">
                             <Button size="sm" variant="outline" className="rounded-xl">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Cetak PDF
                             </Button>
                             <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                                onClick={() => completeMutation.mutate(po.id)}
                                disabled={completeMutation.isPending}
                             >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Terima Barang (Inbound)
                             </Button>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
