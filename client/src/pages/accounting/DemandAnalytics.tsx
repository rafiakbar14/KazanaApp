import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Timer,
  Info,
  Package,
  ArrowUpRight,
  TrendingDown,
  Loader2,
  Calendar,
  History
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from "recharts";


export default function DemandAnalytics() {
  const { data: settings } = useQuery<any>({
    queryKey: [api.settings.get.path],
  });

  const fastThreshold = settings?.fastMovingThreshold ?? 30;
  const slowThreshold = settings?.slowMovingThreshold ?? 60;

  const { data: analytics = [], isLoading } = useQuery<any[]>({
    queryKey: [api.analytics.inventoryDemand.path],
  });

  const { data: forecast = {}, isLoading: isLoadingForecast } = useQuery<any>({
    queryKey: [api.analytics.salesForecast.path],
  });

  const { data: categoryPerformance = [], isLoading: isLoadingCategory } = useQuery<any[]>({
    queryKey: [api.analytics.categoryPerformance.path],
  });

  const { data: agingData = { details: [], summary: {} }, isLoading: isLoadingAging } = useQuery<any>({
    queryKey: [api.analytics.inventoryAging.path],
  });

  if (isLoading || isLoadingForecast || isLoadingCategory || isLoadingAging) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-50/30">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 rounded-full animate-pulse" />
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse text-sm tracking-wide">Menganalisa data cerdas...</p>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Analitik Permintaan <span className="text-indigo-600">Pro</span></h1>
          <p className="text-slate-500 mt-1 font-medium italic">Gunakan intelijen data untuk mengoptimalkan perputaran stok Anda.</p>
        </div>
        <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/60 shadow-sm gap-2">
            <Badge variant="outline" className="bg-blue-50/50 text-blue-700 border-blue-100/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                <Timer className="w-3 h-3 mr-1.5" /> Real-time
            </Badge>
            <Badge variant="outline" className="bg-indigo-50/50 text-indigo-700 border-indigo-100/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                <TrendingUp className="w-3 h-3 mr-1.5" /> AI Augmented
            </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-2xl shadow-indigo-900/10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white rounded-[2rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Prediksi Revenue Bulan Depan</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-4xl font-black">Rp {Number(forecast.forecastNextMonth || 0).toLocaleString()}</div>
                <div className="flex items-center gap-1.5 text-[10px] mt-4 py-2 px-3 bg-white/10 rounded-xl w-fit font-bold">
                    <History className="w-3.5 h-3.5" /> Berdasarkan 3 bln terakhir
                </div>
            </CardContent>
        </Card>

        <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-[2rem] bg-white border-b-4 border-emerald-500/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Best Performance Category</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black text-slate-900 truncate">
                  {categoryPerformance.length > 0 ? categoryPerformance[0].category : "-"}
                </div>
                <div className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1 uppercase tracking-widest">
                  <TrendingUp className="w-3 h-3" /> Dominasi Pasar Lokal
                </div>
            </CardContent>
        </Card>

        <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-[2rem] bg-white border-b-4 border-rose-500/20">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Aging Inventory Risk</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black text-rose-600">{agingData.summary?.slowMovingItems || 0} Produk</div>
                <div className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase tracking-widest">
                  <AlertTriangle className="w-3 h-3 text-rose-500" /> Barang Mengendap &gt; {slowThreshold} Hari
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-[2.5rem] bg-white overflow-hidden p-6">
          <CardHeader className="px-2">
            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Tren Sales & Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] mt-4 px-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.historical || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700}}
                  formatter={(value) => [`Rp ${value.toLocaleString()}`, "Amount"]}
                />
                <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} dot={{r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-[2.5rem] bg-white overflow-hidden p-6">
          <CardHeader className="px-2">
            <CardTitle className="text-lg font-black text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" /> Performa per Kategori
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] mt-4 px-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryPerformance.slice(0, 5)}>
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700}}
                />
                <Bar dataKey="totalSales" radius={[10, 10, 0, 0]}>
                  {categoryPerformance.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-slate-900">Health Check: Prediksi Stok Habis</h2>
          <Badge className="bg-indigo-600 text-white rounded-lg px-4 py-1 font-bold text-[10px] tracking-widest">SORTED BY PRIORITY</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {analytics.slice(0, 8).map((item) => (
                <Card key={item.productId} className="border-0 shadow-lg shadow-slate-100 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 group">
                    <CardHeader className="pb-2 px-6 pt-6">
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                                <Package className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                            </div>
                            {item.daysRemaining < 7 ? (
                                <Badge variant="destructive" className="animate-pulse shadow-lg shadow-rose-200 rounded-full px-3 py-0.5 text-[8px] font-black uppercase tracking-tighter">CRITICAL</Badge>
                            ) : item.daysRemaining < 14 ? (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 rounded-full px-3 py-0.5 text-[8px] font-black uppercase tracking-tighter">WARNING</Badge>
                            ) : (
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 rounded-full px-3 py-0.5 text-[8px] font-black uppercase tracking-tighter">HEALTHY</Badge>
                            )}
                        </div>
                        <CardTitle className="mt-4 text-base font-black text-slate-800 truncate">{item.name}</CardTitle>
                        <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">{item.sku}</p>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50/80 rounded-2xl text-center border border-slate-100 shadow-inner">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sisa Hari</p>
                                <p className={cn("text-2xl font-black", item.daysRemaining < 7 ? "text-rose-600" : "text-slate-900")}>
                                    {item.daysRemaining > 365 ? "∞" : item.daysRemaining}
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50/80 rounded-2xl text-center border border-slate-100 shadow-inner">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Laju/Hari</p>
                                <p className="text-2xl font-black text-slate-900">{item.avgDailySales}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className="text-slate-400 uppercase tracking-widest">AVAILABILITY</span>
                                <span className={cn(item.daysRemaining < 7 ? "text-rose-600" : "text-slate-900")}>{item.currentStock} Unit</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-1000", item.daysRemaining < 7 ? "bg-rose-500" : "bg-indigo-500")}
                                style={{ width: `${Math.min(100, (item.currentStock / 100) * 100)}%` }}
                              />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>

      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-2xl font-black text-slate-900">Inventory Aging Analysis</h2>
          <Badge className="bg-amber-600 text-white rounded-lg px-4 py-1 font-bold text-[10px] tracking-widest">STOCK TURNOVER RISK</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-center uppercase tracking-widest">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50">
             <div className="text-[9px] font-bold text-slate-400 mb-2">Fast Moving (0-{fastThreshold} Hari)</div>
             <div className="text-3xl font-black text-emerald-500">{agingData.summary?.healthy}</div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50">
             <div className="text-[9px] font-bold text-slate-400 mb-2">Moderate ({fastThreshold + 1}-{slowThreshold} Hari)</div>
             <div className="text-3xl font-black text-amber-500">{agingData.summary?.warning}</div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 relative overflow-hidden">
             <div className="text-[9px] font-bold text-slate-400 mb-2">Dead Stock ( &gt; {slowThreshold} Hari)</div>
             <div className="text-3xl font-black text-rose-500">{agingData.summary?.critical}</div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500" />
          </div>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/60 rounded-[2.5rem] bg-white overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest uppercase">
                  <tr>
                    <th className="px-8 py-6">Product Item</th>
                    <th className="px-8 py-6">Qty Remaining</th>
                    <th className="px-8 py-6">Days in Stock</th>
                    <th className="px-8 py-6">Last Inbound</th>
                    <th className="px-8 py-6 text-right">Risk Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agingData.details.slice(0, 10).map((item: any) => (
                    <tr key={`${item.productId}-${item.inboundDate}`} className="hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700">
                      <td className="px-8 py-6">{item.name}</td>
                      <td className="px-8 py-6">{item.qty} Unit</td>
                      <td className="px-8 py-6 text-indigo-600">{item.ageInDays} Days</td>
                      <td className="px-8 py-6 text-slate-400 font-medium">{new Date(item.inboundDate).toLocaleDateString()}</td>
                      <td className="px-8 py-6 text-right">
                        {item.ageInDays > slowThreshold ? (
                          <span className="text-rose-500">Critical (Slow)</span>
                        ) : item.ageInDays > fastThreshold ? (
                          <span className="text-amber-500">Warning</span>
                        ) : (
                          <span className="text-emerald-500">Normal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {agingData.details.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-slate-400 italic">Tidak ada data penuaan stok terdeteksi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
