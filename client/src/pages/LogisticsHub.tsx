import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { StockTransferWithItems, Branch } from "@shared/schema";
import { 
  Truck, 
  ArrowRight, 
  Warehouse, 
  Store, 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  User, 
  Clock, 
  LayoutDashboard,
  Zap,
  ArrowRightLeft,
  ChevronRight,
  TrendingUp,
  History,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function LogisticsHub() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: transfers = [], isLoading: isLoadingTransfers } = useQuery<StockTransferWithItems[]>({
    queryKey: [api.transfers.list.path],
  });

  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery<any[]>({
    queryKey: [api.logistics.suggestions.path],
  });

  const inTransit = Array.isArray(transfers) ? transfers.filter(t => t.status === "in_transit") : [];
  const recentHistory = Array.isArray(transfers) ? transfers.filter(t => t.status !== "in_transit").slice(0, 5) : [];

  const stats = [
    { label: "Dalam Perjalanan", value: inTransit.length, icon: Truck, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Saran Mutasi", value: Array.isArray(suggestions) ? suggestions.length : 0, icon: Zap, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Urgent (Stok Kosong)", value: Array.isArray(suggestions) ? suggestions.filter(s => s.urgency === "high").length : 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    { label: "Selesai 24 Jam", value: Array.isArray(transfers) ? transfers.filter(t => t.status === "received" && t.receivedAt && new Date(t.receivedAt).getTime() > Date.now() - 86400000).length : 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
  ];

  const handleApplySuggestion = (suggestion: any) => {
    toast({
      title: "Saran Diterima",
      description: `Menyiapkan transfer ${suggestion.productName} dari ${suggestion.fromBranchName} ke ${suggestion.toBranchName}`,
    });
    setLocation(`/logistics/transfers?productId=${suggestion.productId}&from=${suggestion.fromBranchId}&to=${suggestion.toBranchId}&qty=${suggestion.suggestedQty}`);
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200">
               <LayoutDashboard className="w-6 h-6 text-white" />
             </div>
             <div>
               <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">Logistics Command Hub</h1>
               <div className="flex items-center gap-2 mt-1">
                 <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 font-bold px-2 py-0 h-5">PHASE 18</Badge>
                 <p className="text-gray-500 font-medium text-sm">Pusat kendali pergerakan barang dan optimasi stok antar gudang.</p>
               </div>
             </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="h-12 px-6 rounded-2xl font-bold border-gray-200 hover:bg-gray-50"
            onClick={() => setLocation("/logistics/transfers")}
          >
            <History className="w-4 h-4 mr-2" />
            Riwayat Mutasi
          </Button>
          <Button 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 h-12 px-6 rounded-2xl font-bold"
            onClick={() => setLocation("/logistics/transfers")}
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Buat Mutasi Baru
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <Card key={idx} className="border-none shadow-xl shadow-gray-200/40 rounded-[2rem] overflow-hidden bg-white group hover:scale-105 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl", s.bg)}>
                  <s.icon className={cn("w-6 h-6", s.color)} />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</p>
                  <p className="text-2xl font-black text-gray-900 leading-none mt-1">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Smart Suggestions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              Saran Mutasi Cerdas (Stock Sync)
            </h2>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-amber-200 bg-amber-50 text-amber-600">AI DETECTED</Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(!Array.isArray(suggestions) || suggestions.length === 0) && !isLoadingSuggestions && (
              <div className="bg-white/60 backdrop-blur-xl border-2 border-dashed border-gray-100 rounded-[2rem] p-12 text-center">
                 <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                 </div>
                 <h3 className="font-bold text-gray-900">Stok Cabang Seimbang</h3>
                 <p className="text-sm text-gray-500 mt-1">Sistem belum menemukan ketidakseimbangan stok yang memerlukan mutasi.</p>
              </div>
            )}
            {Array.isArray(suggestions) && suggestions.map((s, idx) => (
              <Card key={idx} className="border border-white/40 bg-white/60 backdrop-blur-xl shadow-xl shadow-gray-200/30 rounded-[2rem] overflow-hidden group">
                <CardContent className="p-6">
                   <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                         <div className={cn(
                           "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                           s.urgency === 'high' ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-white'
                         )}>
                            <TrendingUp className="w-6 h-6" />
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <h3 className="font-black text-gray-900 uppercase tracking-tight">{s.productName}</h3>
                               {s.urgency === 'high' && <Badge className="bg-red-100 text-red-600 text-[9px] font-black h-4 px-1">URGENT</Badge>}
                            </div>
                            <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">{s.sku}</p>
                         </div>
                      </div>

                      <div className="flex-1 flex items-center justify-center gap-4 px-6">
                         <div className="text-right">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">DARI</p>
                           <p className="text-xs font-black text-gray-900">{s.fromBranchName}</p>
                         </div>
                         <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                           <ArrowRight className="w-4 h-4 text-gray-300" />
                         </div>
                         <div className="text-left">
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">KE</p>
                           <p className="text-xs font-black text-gray-900">{s.toBranchName}</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-6">
                         <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SUGESTI</p>
                            <p className="text-lg font-black text-indigo-600">+{s.suggestedQty}</p>
                         </div>
                         <Button 
                           className="bg-gray-900 hover:bg-black text-white h-12 px-6 rounded-2xl font-bold shadow-lg transition-all active:scale-95"
                           onClick={() => handleApplySuggestion(s)}
                         >
                           Gunakan Saran
                           <ArrowRight className="w-4 h-4 ml-2" />
                         </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-xl shadow-indigo-100/50 rounded-[2rem] bg-indigo-600 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 text-white opacity-10">
              <Info className="w-24 h-24" />
            </div>
            <CardContent className="p-8 relative z-10">
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Cara Kerja Saran Mutasi</h3>
              <p className="text-indigo-100/80 text-sm leading-relaxed max-w-xl font-medium">
                Sistem secara cerdas menganalisis tingkat stok di setiap cabang. Jika sebuah cabang mencapai ambang batas minimum (*Min Stock*) sementara cabang lain memiliki surplus yang aman, sistem akan menyarankan pemindahan barang untuk meminimalkan peluang kehilangan penjualan.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: In-Transit Monitoring */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-500" />
              Traffic Pengiriman
            </h2>
             <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest animate-pulse">Live</span>
          </div>

          <div className="space-y-4">
             {inTransit.length === 0 && (
               <div className="bg-white rounded-[2rem] p-10 text-center border-2 border-dashed border-gray-100">
                  <Package className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-medium">Tidak ada pengiriman aktif</p>
               </div>
             )}
             {inTransit.map((t) => (
               <Card key={t.id} className="border-none shadow-xl shadow-gray-200/30 rounded-[2rem] bg-white overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => setLocation(`/logistics/transfers`)}>
                  <CardContent className="p-6">
                     <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-[10px]">#{t.id}</div>
                           <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[9px] uppercase tracking-wider">IN TRANSIT</Badge>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400">{format(new Date(t.createdAt), "HH:mm")}</p>
                     </div>

                     <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex-1">
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ASAL</p>
                           <p className="text-xs font-black truncate">{t.fromBranch?.name}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                           <ChevronRight className="w-3 h-3 text-gray-400" />
                        </div>
                        <div className="flex-1 text-right">
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">TUJUAN</p>
                           <p className="text-xs font-black truncate">{t.toBranch?.name}</p>
                        </div>
                     </div>

                     <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-slate-500" />
                           </div>
                           <span className="text-[10px] font-bold text-gray-600 truncate max-w-[80px]">{t.driverName || "Driver Pribadi"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                           <Clock className="w-3 h-3" />
                           <span className="text-[10px] font-bold">1-2 Jam</span>
                        </div>
                     </div>
                  </CardContent>
               </Card>
             ))}
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="px-2 text-xs font-black text-gray-400 uppercase tracking-widest">Riwayat Selesai Terakhir</h3>
            <div className="space-y-3">
              {recentHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-gray-900">Mutasi #{h.id}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">TIBA: {h.receivedAt ? format(new Date(h.receivedAt), "dd MMM") : "-"}</p>
                    </div>
                  </div>
                  <Badge variant="ghost" className="text-emerald-600 font-black text-[9px]">{h.toBranch?.name}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
