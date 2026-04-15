import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/badge"; // Wait, Card is from ui/card
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Search, 
  Download,
  Calendar as CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function StockLedger() {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: products = [], isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: ledger = [], isLoading: loadingLedger } = useQuery<any[]>({
    queryKey: ["/api/reports/stock-ledger", { productId: selectedProductId }],
    enabled: !!selectedProductId,
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <History className="w-8 h-8 text-blue-600" />
            Kartu Stok (Mutasi)
          </h1>
          <p className="text-slate-500 mt-1">Lacak setiap pergerakan stok barang Anda secara mendetail.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50">
            <Download className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              Pilih Produk
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari SKU / Nama..." 
                className="pl-9 bg-slate-50 border-slate-100" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="max-h-[400px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {loadingProducts ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div 
                    key={product.id}
                    onClick={() => setSelectedProductId(String(product.id))}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedProductId === String(product.id) 
                        ? "bg-blue-50 border-blue-200 text-blue-900" 
                        : "border-transparent hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <p className="text-xs font-bold opacity-60">{product.sku}</p>
                    <p className="text-sm font-bold truncate">{product.name}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-8">Produk tidak ditemukan</p>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-3">
          {selectedProductId ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {products.find(p => String(p.id) === selectedProductId)?.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                      SKU: {products.find(p => String(p.id) === selectedProductId)?.sku}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Stok Saat Ini</p>
                  <p className="text-2xl font-display font-bold text-blue-600">
                    {ledger[0]?.balance || 0}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-[180px]">Tanggal</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Referensi</TableHead>
                      <TableHead className="text-right">Perubahan</TableHead>
                      <TableHead className="text-right">Saldo Akhir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingLedger ? (
                      Array(5).fill(0).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : ledger.length > 0 ? (
                      ledger.map((item, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="text-slate-500 font-medium">
                            {format(new Date(item.date), "dd MMM yyyy HH:mm", { locale: id })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.qtyChange > 0 ? (
                                <div className="bg-emerald-100 p-1.5 rounded-lg">
                                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                                </div>
                              ) : (
                                <div className="bg-rose-100 p-1.5 rounded-lg">
                                  <ArrowDownLeft className="w-3 h-3 text-rose-600" />
                                </div>
                              )}
                              <span className="font-bold text-slate-700">{item.type}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-slate-500">{item.reference}</TableCell>
                          <TableCell className={`text-right font-bold ${item.qtyChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {item.qtyChange > 0 ? '+' : ''}{item.qtyChange}
                          </TableCell>
                          <TableCell className="text-right font-display font-bold text-slate-900">
                            {item.balance}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-slate-400 italic">
                          Belum ada aktivitas mutasi untuk produk ini.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-20 text-center space-y-4">
              <div className="bg-slate-50 p-6 rounded-full">
                <Package className="w-12 h-12 text-slate-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Pilih Produk Dahulu</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Silakan pilih produk dari daftar di samping untuk melihat riwayat mutasi stok.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
