import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Package, Percent, Layers, Search, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product, TieredPricing, ProductBundle } from "@shared/schema";

export default function B2BWholesale() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pricing");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">
            B2B & Pricing Hub
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Kelola strategi harga grosir dan bundling produk untuk klien B2B.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <TabsTrigger value="pricing" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Percent className="w-4 h-4 mr-2" />
            Tiered Pricing
          </TabsTrigger>
          <TabsTrigger value="bundling" className="rounded-xl px-6 py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Layers className="w-4 h-4 mr-2" />
            Product Bundling
          </TabsTrigger>
        </TabsList>

        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white/50 backdrop-blur-xl">
          <CardHeader className="border-b border-slate-100 bg-white/80 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  {activeTab === "pricing" ? (
                    <><TrendingDown className="w-6 h-6 text-blue-600" /> Harga Berjenjang</>
                  ) : (
                    <><Package className="w-6 h-6 text-emerald-600" /> Paket Bundling</>
                  )}
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium mt-1">
                  {activeTab === "pricing" 
                    ? "Tentukan diskon khusus berdasarkan jumlah pembelian (Volume Based Pricing)."
                    : "Gabungkan beberapa produk menjadi satu paket SKU dengan harga spesial."}
                </CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Cari produk..." 
                  className="pl-11 h-12 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TabsContent value="pricing" className="m-0">
              <TieredPricingList products={filteredProducts || []} isLoading={loadingProducts} />
            </TabsContent>
            <TabsContent value="bundling" className="m-0">
              <ProductBundlingList products={products || []} isLoading={loadingProducts} />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

function TieredPricingList({ products, isLoading }: { products: Product[], isLoading: boolean }) {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: tiers, isLoading: loadingTiers } = useQuery<TieredPricing[]>({
    queryKey: ["/api/pricing/tiered", selectedProduct?.id],
    enabled: !!selectedProduct,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", api.pricing.tiered.create.path, { ...data, productId: selectedProduct?.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/tiered", selectedProduct?.id] });
      toast({ title: "Berhasil", description: "Paket harga telah ditambahkan" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", api.pricing.tiered.delete.path.replace(":id", id.toString()));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/tiered", selectedProduct?.id] });
      toast({ title: "Terhapus", description: "Paket harga telah dihapus" });
    }
  });

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-4 border-r border-slate-100 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Daftar Produk</h3>
        <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className={`w-full p-4 rounded-2xl text-left transition-all ${
                selectedProduct?.id === p.id 
                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200" 
                : "hover:bg-slate-50 text-slate-600"
              }`}
            >
              <div className="font-bold truncate">{p.name}</div>
              <div className="text-xs font-mono opacity-60">SKU: {p.sku}</div>
              <div className="mt-1 text-sm font-black">Rp {Number(p.sellingPrice).toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="lg:col-span-8 p-8 min-h-[500px] bg-slate-50/30">
        {selectedProduct ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase">Tier Harga: {selectedProduct.name}</h2>
                <p className="text-slate-500 font-medium">Define price breaks for bulk quantity.</p>
              </div>
              <AddTierDialog onAdd={(q, p) => createMutation.mutate({ minQuantity: q, price: p })} />
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold py-5 pl-8 text-slate-600 uppercase tracking-wider text-xs">Min. Qty</TableHead>
                    <TableHead className="font-bold py-5 text-slate-600 uppercase tracking-wider text-xs">Harga Spesial (Per Unit)</TableHead>
                    <TableHead className="font-bold py-5 text-slate-600 uppercase tracking-wider text-xs">Hemat (%)</TableHead>
                    <TableHead className="text-right py-5 pr-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {tiers?.map((t) => {
                      const saving = ((Number(selectedProduct.sellingPrice) - Number(t.price)) / Number(selectedProduct.sellingPrice)) * 100;
                      return (
                        <motion.tr
                          key={t.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="py-6 pl-8 font-black text-lg text-slate-700">
                            {t.minQuantity}+
                          </TableCell>
                          <TableCell className="py-6">
                            <div className="text-blue-700 font-black text-lg">
                              Rp {Number(t.price).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="py-6">
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-black px-3 py-1 rounded-lg border-none">
                              -{saving.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-6 pr-8">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                              onClick={() => deleteMutation.mutate(t.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {(!tiers || tiers.length === 0) && !loadingTiers && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center text-slate-400">
                        <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="font-medium">Belum ada aturan harga khusus untuk produk ini.</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {loadingTiers && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center">
              <Plus className="w-10 h-10 text-slate-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Pilih Produk</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Pilih produk dari daftar di sebelah kiri untuk mengelola harga berjenjang.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddTierDialog({ onAdd }: { onAdd: (qty: number, price: number) => void }) {
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-500/20 uppercase tracking-tight">
          <Plus className="w-4 h-4 mr-2" /> Tambah Aturan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
        <DialogHeader className="p-4">
          <DialogTitle className="text-2xl font-black text-slate-900 uppercase">Tambah Aturan Baru</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Minimal Kuantitas</label>
            <Input 
              type="number" 
              placeholder="Contoh: 10" 
              className="h-14 rounded-2xl border-slate-100 bg-slate-50"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Harga Satuan Spesial</label>
            <Input 
              type="number" 
              placeholder="Contoh: 75000" 
              className="h-14 rounded-2xl border-slate-100 bg-slate-50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="p-4 bg-slate-50/50">
          <Button 
            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-lg shadow-xl shadow-blue-500/20 transition-all uppercase"
            onClick={() => {
              onAdd(Number(qty), Number(price));
              setOpen(false);
              setQty("");
              setPrice("");
            }}
          >
            Apply Aturan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductBundlingList({ products, isLoading }: { products: Product[], isLoading: boolean }) {
  const { toast } = useToast();
  const [selectedParent, setSelectedParent] = useState<Product | null>(null);

  const { data: bundleItems, isLoading: loadingBundle } = useQuery<ProductBundle[]>({
    queryKey: ["/api/bundling", selectedParent?.id],
    enabled: !!selectedParent,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", api.bundling.create.path, { ...data, parentProductId: selectedParent?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bundling", selectedParent?.id] });
      toast({ title: "Berhasil", description: "Produk ditambahkan ke bundle" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", api.bundling.delete.path.replace(":id", id.toString()));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bundling", selectedParent?.id] });
      toast({ title: "Terhapus", description: "Produk dihapus dari bundle" });
    }
  });

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12">
      <div className="lg:col-span-4 border-r border-slate-100 p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-2">Daftar Produk (Parent)</h3>
        <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedParent(p)}
              className={`w-full p-4 rounded-2xl text-left transition-all ${
                selectedParent?.id === p.id 
                ? "bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200" 
                : "hover:bg-slate-50 text-slate-600"
              }`}
            >
              <div className="font-bold truncate">{p.name}</div>
              <div className="text-xs font-mono opacity-60">SKU: {p.sku}</div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="lg:col-span-8 p-8 min-h-[500px] bg-slate-50/30">
        {selectedParent ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase">Komposisi Bundle: {selectedParent.name}</h2>
                <p className="text-slate-500 font-medium">Add products that must be deducted when this bundle is sold.</p>
              </div>
              <AddBundleItemDialog 
                products={products.filter(p => p.id !== selectedParent.id)} 
                onAdd={(childId, qty) => createMutation.mutate({ childProductId: childId, quantity: qty })} 
              />
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold py-5 pl-8 text-slate-600 uppercase tracking-wider text-xs">Produk Anak</TableHead>
                    <TableHead className="font-bold py-5 text-slate-600 uppercase tracking-wider text-xs">SKU</TableHead>
                    <TableHead className="font-bold py-5 text-slate-600 uppercase tracking-wider text-xs">Kuantitas di Bundle</TableHead>
                    <TableHead className="text-right py-5 pr-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {bundleItems?.map((item) => {
                      const product = products.find(p => p.id === item.childProductId);
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, opacity: 0 }}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="py-6 pl-8 font-bold text-slate-700">
                            {product?.name || "Unknown Product"}
                          </TableCell>
                          <TableCell className="py-6">
                            <code className="text-xs font-mono px-2 py-1 bg-slate-100 rounded-lg text-slate-500">
                              {product?.sku}
                            </code>
                          </TableCell>
                          <TableCell className="py-6">
                            <span className="font-black text-lg text-emerald-600">{item.quantity} Unit</span>
                          </TableCell>
                          <TableCell className="text-right py-6 pr-8">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {(!bundleItems || bundleItems.length === 0) && !loadingBundle && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center text-slate-400">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="font-medium">Bundle ini belum memiliki produk penyusun.</p>
                      </TableCell>
                    </TableRow>
                  )}
                  {loadingBundle && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="p-6 rounded-[2rem] bg-amber-50 border border-amber-100 flex gap-4">
              <div className="bg-amber-100 p-3 rounded-2xl flex-shrink-0">
                <Percent className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h4 className="font-bold text-amber-900">Penting: Inventory Sync</h4>
                <p className="text-sm text-amber-700/80 font-medium">
                  Saat produk parent terjual di Kasir (POS) maupun Wholesale, sistem akan secara otomatis memotong stok produk anak yang ada dalam daftar di atas sesuai dengan kuantitas yang ditentukan.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center">
              <Package className="w-10 h-10 text-slate-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Pilih Produk Parent</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Pilih produk yang akan dijadikan sebagai "Parent" (Paket) untuk mengelola isinya.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddBundleItemDialog({ products, onAdd }: { products: Product[], onAdd: (childId: number, qty: number) => void }) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [qty, setQty] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-500/20 uppercase tracking-tight">
          <Plus className="w-4 h-4 mr-2" /> Tambah Produk Anak
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-2xl font-black text-slate-900 uppercase">Tambah ke Paket</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 p-8 pt-0">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Cari Produk Anak</label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50">
                <SelectValue placeholder="Pilih produk..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl border-slate-100">
                {products.map(p => (
                  <SelectItem key={p.id} value={String(p.id)} className="rounded-xl py-3 font-medium">
                    {p.name} ({p.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Kuantitas per Transaksi</label>
            <Input 
              type="number" 
              placeholder="Contoh: 1" 
              className="h-14 rounded-2xl border-slate-100 bg-slate-50"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="p-8 bg-slate-50/50">
          <Button 
            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-lg shadow-xl shadow-emerald-500/20 transition-all uppercase"
            onClick={() => {
              if (selectedId && qty) {
                onAdd(Number(selectedId), Number(qty));
                setOpen(false);
                setSelectedId("");
                setQty("");
              }
            }}
          >
            Tambahkan ke Paket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
