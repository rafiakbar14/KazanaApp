import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Box, 
  Trophy, 
  TrendingUp, 
  ArrowUpRight, 
  Search,
  Filter,
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function SalesItems() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"revenue" | "qty">("revenue");

  const { data: salesItems = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/reports/sales-items", { sortBy }],
  });

  const filteredItems = salesItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Box className="w-8 h-8 text-indigo-600" />
            Penjualan per Produk
          </h1>
          <p className="text-slate-500 mt-1">Analisis ranking produk terlaris berdasarkan volume dan omzet.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-slate-200">
            <Download className="w-4 h-4" />
            Download Laporan
          </Button>
        </div>
      </div>

      {/* Top Performers Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-3xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Trophy className="w-16 h-16" />
              </div>
              <CardContent className="p-6">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80">Best Seller (Omzet)</p>
                <div className="mt-2">
                  <h3 className="text-lg font-bold truncate leading-tight">{salesItems[0]?.name || "-"}</h3>
                  <p className="text-2xl font-display font-bold mt-1">{formatCurrency(salesItems[0]?.revenue || 0)}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white border border-slate-100 rounded-3xl">
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Volume</p>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="mt-2">
                  <h3 className="text-3xl font-display font-bold text-slate-900">
                    {salesItems.reduce((acc, item) => acc + item.qty, 0)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Total unit barang terjual</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white border border-slate-100 rounded-3xl text-slate-900">
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Rataan Profit</p>
                  <ArrowUpRight className="w-4 h-4 text-blue-500" />
                </div>
                <div className="mt-2">
                  <h3 className="text-3xl font-display font-bold text-slate-900">
                    {salesItems.length > 0 
                      ? formatCurrency(salesItems.reduce((acc, item) => acc + item.profit, 0) / salesItems.length)
                      : "Rp 0"
                    }
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Laba kotor per SKU</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Table */}
      <Card className="border-slate-100 rounded-3xl shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-lg font-bold text-slate-800">Daftar Peringkat SKU</CardTitle>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari produk..." 
                className="pl-9 h-10 bg-slate-50 border-slate-100 rounded-xl w-full md:w-64" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <Button 
                variant={sortBy === "revenue" ? "secondary" : "ghost"} 
                size="sm" 
                className="rounded-lg h-8 text-[11px] font-bold"
                onClick={() => setSortBy("revenue")}
              >
                By Omzet
              </Button>
              <Button 
                variant={sortBy === "qty" ? "secondary" : "ghost"} 
                size="sm" 
                className="rounded-lg h-8 text-[11px] font-bold"
                onClick={() => setSortBy("qty")}
              >
                By Volume
              </Button>
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-slate-100">
                <TableHead className="w-16 text-center">#</TableHead>
                <TableHead>Informasi Produk</TableHead>
                <TableHead className="text-right">Qty Terjual</TableHead>
                <TableHead className="text-right">Total Omzet</TableHead>
                <TableHead className="text-right">Total Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50 border-slate-50 transition-colors">
                    <TableCell className="text-center font-display font-bold text-slate-400">{idx + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-slate-800 leading-none">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{item.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{item.qty}</TableCell>
                    <TableCell className="text-right font-display font-medium text-slate-900">{formatCurrency(item.revenue)}</TableCell>
                    <TableCell className="text-right font-display font-bold text-emerald-600">{formatCurrency(item.profit)}</TableCell>
                    <TableCell className="text-right">
                      <span className="bg-slate-100 text-slate-500 font-bold text-[10px] px-2 py-1 rounded-full border border-slate-200">
                        {item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : 0}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">
                    Data penjualan produk tidak ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
