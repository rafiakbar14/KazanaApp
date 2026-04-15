import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingBag, 
  DollarSign, 
  PieChart,
  Calendar as CalendarIcon
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalesSummary() {
  const { data: summary, isLoading } = useQuery<any>({
    queryKey: ["/api/reports/sales-summary"],
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const stats = [
    {
      label: "Total Omzet",
      value: summary?.revenue || 0,
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50",
      desc: "Total pendapatan kotor"
    },
    {
      label: "Total HPP (COGS)",
      value: summary?.cogs || 0,
      icon: ShoppingBag,
      color: "text-rose-600",
      bg: "bg-rose-50",
      desc: "Modal barang terjual"
    },
    {
      label: "Laba Kotor",
      value: summary?.grossProfit || 0,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      desc: "Keuntungan sebelum biaya ops"
    },
    {
      label: "Rata-rata Order",
      value: summary?.averageOrderValue || 0,
      icon: PieChart,
      color: "text-amber-600",
      bg: "bg-amber-50",
      desc: "Nilai rata-rata per transaksi"
    }
  ];

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Ringkasan Penjualan
        </h1>
        <p className="text-slate-500 mt-1">Performa finansial bisnis Anda dalam angka.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : (
          stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow rounded-3xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className={`${stat.bg} p-3 rounded-2xl`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none rounded-full text-[10px] py-0 px-2">30 Hari Terakhir</Badge>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <h3 className={`text-xl font-display font-bold mt-1 ${stat.color}`}>
                    {formatCurrency(stat.value)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium italic">{stat.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Statistik Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x divide-slate-100">
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Transaksi</p>
                <h4 className="text-4xl font-display font-bold text-slate-900">{summary?.transactionCount || 0}</h4>
                <div className="flex items-center justify-center gap-1 text-emerald-500 text-xs font-bold">
                  <ArrowUpRight className="w-3 h-3" />
                  +12% vs bulan lalu
                </div>
              </div>
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Diskon</p>
                <h4 className="text-4xl font-display font-bold text-rose-500">{formatCurrency(summary?.discount || 0)}</h4>
                <p className="text-xs text-slate-400 font-medium italic">Potongan harga promo</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 rounded-3xl shadow-sm bg-gradient-to-br from-[#0055EE] to-[#0033BB] text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-colors" />
          <CardHeader className="relative z-10 p-6">
            <CardTitle className="text-lg font-bold opacity-90 tracking-tight">Kesehatan Margin</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 p-6 pt-0 space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">Gross Profit Margin</p>
                <p className="text-3xl font-display font-bold">
                  {summary?.revenue > 0 ? ((summary.grossProfit / summary.revenue) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-1000 ease-out" 
                  style={{ width: `${summary?.revenue > 0 ? (summary.grossProfit / summary.revenue) * 100 : 0}%` }} 
                />
              </div>
              <p className="text-[10px] mt-2 opacity-60">*Idealnya di atas 30% untuk retail umum.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Internal Badge helper since it's not imported correctly above
function Badge({ className, children }: { className?: string, children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${className}`}>
      {children}
    </span>
  );
}
