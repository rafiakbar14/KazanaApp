import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Package, Layers, TrendingUp, Eye, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

type ValuationItem = {
  productId: number;
  sku: string;
  name: string;
  category: string | null;
  currentStock: number;
  fifoValue: number;
  avgCost: number;
  unitCost: number;
  lotsCount: number;
};

type LotData = {
  id: number;
  purchasePrice: number;
  initialQuantity: number;
  remainingQuantity: number;
  consumed: number;
  inboundDate: string;
  inboundSessionId: number | null;
  status: "active" | "depleted";
};

export default function InventoryValuation() {
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [sortField, setSortField] = useState<"name" | "fifoValue" | "currentStock">("fifoValue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data, isLoading } = useQuery<{ items: ValuationItem[]; summary: { totalProducts: number; totalInventoryValue: number; productsWithLots: number } }>({
    queryKey: [api.inventory.valuation.path],
  });

  const { data: lotsData, isLoading: isLoadingLots } = useQuery<{ product: any; lots: LotData[] }>({
    queryKey: [api.inventory.lots.path, expandedProduct],
    queryFn: async () => {
      if (!expandedProduct) return { product: null, lots: [] };
      const res = await fetch(buildUrl(api.inventory.lots.path, { productId: expandedProduct }));
      if (!res.ok) throw new Error("Gagal mengambil data lot");
      return res.json();
    },
    enabled: !!expandedProduct,
  });

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  const items = data?.items || [];
  const summary = data?.summary;

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sorted = [...items].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortField === "name") return mul * a.name.localeCompare(b.name);
    return mul * ((a as any)[sortField] - (b as any)[sortField]);
  });

  const fmt = (n: number) => new Intl.NumberFormat("id-ID").format(Math.round(n));

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Valuasi Persediaan</h1>
        <p className="text-muted-foreground italic">Penilaian aset persediaan berdasarkan metode FIFO (First-In, First-Out).</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold tracking-wider text-emerald-600/70">Total Nilai Persediaan</p>
                  <p className="text-2xl font-black text-emerald-800 font-mono">Rp {fmt(summary.totalInventoryValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <Package className="h-6 w-6 text-indigo-700" />
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold tracking-wider text-indigo-600/70">Jumlah Produk</p>
                  <p className="text-2xl font-black text-indigo-800 font-mono">{summary.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-xl">
                  <Layers className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <p className="text-[11px] uppercase font-bold tracking-wider text-amber-600/70">Produk Dengan Lot Aktif</p>
                  <p className="text-2xl font-black text-amber-800 font-mono">{summary.productsWithLots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Valuation Table */}
      <Card className="overflow-hidden shadow-sm border-slate-200">
        <CardHeader className="py-4 border-b bg-slate-50/30">
          <CardTitle className="text-base font-bold text-slate-800">Rincian Valuasi Per Produk (FIFO)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="text-[10px] uppercase font-black text-slate-400">SKU</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400">
                  <button className="flex items-center gap-1 hover:text-slate-700 transition-colors" onClick={() => toggleSort("name")}>
                    Nama Produk <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-400">Kategori</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-black text-slate-400">
                  <button className="flex items-center gap-1 ml-auto hover:text-slate-700 transition-colors" onClick={() => toggleSort("currentStock")}>
                    Stok <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right text-[10px] uppercase font-black text-slate-400">Avg Cost</TableHead>
                <TableHead className="text-right text-[10px] uppercase font-black text-slate-400">
                  <button className="flex items-center gap-1 ml-auto hover:text-slate-700 transition-colors" onClick={() => toggleSort("fifoValue")}>
                    Nilai FIFO (Rp) <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="text-center text-[10px] uppercase font-black text-slate-400">Lots</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((item) => (
                <>
                  <TableRow key={item.productId} className="group hover:bg-slate-50/30 transition-colors cursor-pointer" onClick={() => setExpandedProduct(expandedProduct === item.productId ? null : item.productId)}>
                    <TableCell className="font-mono text-xs font-bold text-indigo-700">{item.sku}</TableCell>
                    <TableCell className="font-medium text-slate-700">{item.name}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{item.category || "-"}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-slate-900">{item.currentStock}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-slate-600">Rp {fmt(item.avgCost)}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-700">Rp {fmt(item.fifoValue)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.lotsCount > 0 ? "default" : "secondary"} className={item.lotsCount > 0 ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : ""}>
                        {item.lotsCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        {expandedProduct === item.productId ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Lot Detail */}
                  {expandedProduct === item.productId && (
                    <TableRow key={`${item.productId}-lots`}>
                      <TableCell colSpan={8} className="bg-indigo-50/30 p-0">
                        <div className="p-4 animate-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">
                            Detail Lot — {item.name}
                          </p>
                          {isLoadingLots ? (
                            <div className="flex justify-center py-4"><Loader2 className="animate-spin h-5 w-5 text-indigo-400" /></div>
                          ) : lotsData?.lots && lotsData.lots.length > 0 ? (
                            <div className="rounded-lg border border-indigo-100 overflow-hidden">
                              <Table>
                                <TableHeader className="bg-indigo-50/50">
                                  <TableRow>
                                    <TableHead className="text-[10px] uppercase font-bold text-indigo-400">Tanggal Masuk</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold text-indigo-400">Sesi Inbound</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-bold text-indigo-400">Harga Beli</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-bold text-indigo-400">Qty Awal</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-bold text-indigo-400">Sisa</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-bold text-indigo-400">Terpakai</TableHead>
                                    <TableHead className="text-center text-[10px] uppercase font-bold text-indigo-400">Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {lotsData.lots.map((lot) => (
                                    <TableRow key={lot.id} className="hover:bg-indigo-50/20 transition-colors">
                                      <TableCell className="text-sm text-slate-600">
                                        {format(new Date(lot.inboundDate), "dd MMM yyyy HH:mm", { locale: idLocale })}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs text-slate-500">
                                        {lot.inboundSessionId ? `#${lot.inboundSessionId}` : "Manual/Void"}
                                      </TableCell>
                                      <TableCell className="text-right font-mono font-bold text-slate-800">Rp {fmt(lot.purchasePrice)}</TableCell>
                                      <TableCell className="text-right font-mono text-slate-700">{lot.initialQuantity}</TableCell>
                                      <TableCell className="text-right font-mono font-bold text-emerald-700">{lot.remainingQuantity}</TableCell>
                                      <TableCell className="text-right font-mono text-red-500">{lot.consumed}</TableCell>
                                      <TableCell className="text-center">
                                        <Badge variant={lot.status === "active" ? "default" : "secondary"} className={lot.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                                          {lot.status === "active" ? "Aktif" : "Habis"}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 italic py-3">Belum ada lot tercatat untuk produk ini.</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
