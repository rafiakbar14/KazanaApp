import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProducts } from "@/hooks/use-products";
import { useSessions } from "@/hooks/use-sessions";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { useAccounting } from "@/hooks/use-accounting";
import { useAssemblySessions } from "@/hooks/use-production";
import { useAnnouncements } from "@/hooks/use-announcements";
import { useBranch } from "@/hooks/use-branch";
import { api, buildUrl } from "@shared/routes";
import { 
  Package, ClipboardList, AlertTriangle, Clock,
  TrendingUp, Wallet, ShoppingBag, ChevronRight,
  BarChart3, PieChart as PieIcon, Activity, Plus,
  ArrowUpRight, ArrowDownRight, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, isToday, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const CHART_COLORS = ['#0044CC', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'];

export default function Dashboard() {
  const { user } = useAuth();
  const { role } = useRole();
  const { selectedBranchId, selectedBranch } = useBranch();
  const { data: products } = useProducts(undefined, selectedBranchId);
  const { data: sessions } = useSessions(undefined, selectedBranchId);
  const { profitLoss, isLoadingProfitLoss } = useAccounting(selectedBranchId);
  const { data: announcements } = useAnnouncements();
  
  const subscribedModules = (user?.subscribedModules as string[]) || [];
  const hasPOS = subscribedModules.includes("pos");
  const hasAccounting = subscribedModules.includes("accounting");

  // 1. Fetch sales history (Last 60 days for MoM)
  const { data: salesHistory } = useQuery<any[]>({
    queryKey: [api.pos.sales.list.path, selectedBranchId, "discovery"],
    queryFn: async () => {
      const params: any = {};
      if (selectedBranchId) params.branchId = selectedBranchId;
      const url = buildUrl(api.pos.sales.list.path, params);
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sales");
      return res.json();
    },
    enabled: hasPOS,
  });

  const { data: customers } = useQuery<any[]>({
    queryKey: [api.pos.customers.list.path],
    enabled: hasPOS,
  });

  const { data: assemblySessions } = useAssemblySessions();

  // 2. Performance Calculations
  const metrics = useMemo(() => {
    if (!salesHistory) return { revenue: 0, growth: 0, dailyTrend: [] };
    
    const now = new Date();
    const currentMonthInterval = { start: startOfMonth(now), end: endOfMonth(now) };
    const lastMonthInterval = { start: startOfMonth(subDays(startOfMonth(now), 1)), end: endOfMonth(subDays(startOfMonth(now), 1)) };

    const currentMonthSales = salesHistory.filter(s => isWithinInterval(new Date(s.createdAt), currentMonthInterval));
    const lastMonthSales = salesHistory.filter(s => isWithinInterval(new Date(s.createdAt), lastMonthInterval));

    const currentTotal = currentMonthSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const lastTotal = lastMonthSales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    
    const growth = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;

    // Daily trend for sparkline (last 7 days)
    const dailyTrend = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i);
      const daySales = salesHistory.filter(s => format(new Date(s.createdAt), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'));
      return { 
        value: daySales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
      };
    });

    return { 
      revenue: currentTotal, 
      growth: Math.round(growth * 10) / 10,
      dailyTrend
    };
  }, [salesHistory]);

  const todaySalesHistory = salesHistory?.filter((s: any) => isToday(new Date(s.createdAt))) || [];
  const todayRevenue = todaySalesHistory.reduce((sum: number, s: any) => sum + Number(s.totalAmount), 0);
  
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      total: 0
    }));
    
    todaySalesHistory.forEach(s => {
      const h = new Date(s.createdAt).getHours();
      hours[h].total += Number(s.totalAmount);
    });
    return hours;
  }, [todaySalesHistory]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    todaySalesHistory.forEach(s => {
      (s.items || []).forEach((item: any) => {
        const cat = item.product?.category || "Lainnya";
        cats[cat] = (cats[cat] || 0) + Number(item.unitPrice) * item.quantity;
      });
    });
    
    if (Object.keys(cats).length === 0) {
      return [
        { name: 'Makanan', value: 400 },
        { name: 'Minuman', value: 300 },
        { name: 'Elektronik', value: 300 },
        { name: 'Jasa', value: 200 },
      ];
    }

    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [todaySalesHistory]);

  const activeSessions = sessions?.filter(s => s.status === 'in_progress') || [];
  const lowStockItems = products?.filter(p => p.currentStock < (p.minStock || 10)) || [];
  
  const now = new Date();
  const activeAnnouncements = announcements?.filter((a: any) => !a.expiresAt || new Date(a.expiresAt) > now) || [];

  const roleLabel: Record<string, string> = {
    admin: "Super Admin",
    sku_manager: "Manager SKU",
    stock_counter: "Penghitung Stok",
    cashier: "Kasir",
  };

  return (
    <div className="space-y-8 animate-enter p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase italic">
            Dashboard <span className="text-[#0044CC]">Intel</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">
            Selamat datang kembali, <span className="text-gray-900 font-bold">{user?.firstName || user?.username}</span> 
            <Badge variant="outline" className="bg-blue-50 text-[#0044CC] border-blue-100 font-black text-[10px] uppercase">
              {roleLabel[role] || role}
            </Badge>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/reports">
             <Button variant="outline" className="rounded-2xl h-12 px-6 border-gray-200 font-bold text-gray-600 gap-2">
               <Activity className="w-5 h-5 text-indigo-500" /> Analitik Lanjut
             </Button>
          </Link>
          <Link href="/pos">
             <Button className="bg-[#0044CC] text-white hover:bg-blue-600 rounded-2xl font-bold h-12 px-6 shadow-xl shadow-blue-500/20 gap-2 transition-all active:scale-95">
               <Plus className="w-5 h-5" /> Transaksi Baru
             </Button>
          </Link>
        </div>
      </div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard 
          label="Omzet Hari Ini" 
          value={`Rp ${todayRevenue.toLocaleString('id-ID')}`} 
          sub={metrics.growth >= 0 ? `+${metrics.growth}% vs Bln Lalu` : `${metrics.growth}% vs Bln Lalu`}
          icon={TrendingUp} 
          color="emerald" 
          trend={metrics.dailyTrend}
        />
        
        <StatCard 
          label="Total SKU Produk" 
          value={products?.length || 0} 
          sub={`${lowStockItems.length} Stok Kritis`} 
          icon={Package} 
          color="blue" 
          trend={[ {value: 10}, {value: 15}, {value: 8}, {value: 12}, {value: 20}, {value: lowStockItems.length > 0 ? 5 : 25} ]}
        />

        {hasAccounting ? (
          <StatCard 
            label="Laba Bersih" 
            value={`Rp ${(profitLoss?.netProfit ?? 0).toLocaleString('id-ID')}`} 
            sub="Profit Est. Bulan Ini"
            icon={Wallet} 
            color="indigo" 
            trend={metrics.dailyTrend.map(t => ({ value: t.value * 0.3 }))}
          />
        ) : (
          <StatCard 
            label="Sesi Opname" 
            value={activeSessions.length} 
            sub="Audit Berjalan"
            icon={ClipboardList} 
            color="purple" 
          />
        )}

        <StatCard 
          label="Customer Loyalti" 
          value={customers?.length || 0}
          sub="Basis Konsumen"
          icon={ShoppingBag} 
          color="slate" 
          trend={[ {value: 2}, {value: 5}, {value: 3}, {value: 8}, {value: 12}, {value: 15}, {value: 18} ]}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-2xl shadow-black/[0.03] overflow-hidden bg-white p-8 space-y-6 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-2xl text-[#0044CC]">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">Visualizer Arus Kas</h3>
            </div>
            <div className="flex gap-2">
                <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">LIVE TRANSACTION</Badge>
                {hasAccounting && (
                   <Link href="/accounting/analytics">
                      <Button variant="ghost" size="sm" className="text-[10px] font-bold text-gray-400 gap-1">AI INSIGHTS <ChevronRight className="w-3 h-3" /></Button>
                   </Link>
                )}
            </div>
          </div>
          
          <div className="h-[300px] w-full mt-4 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0044CC" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0044CC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{stroke: '#0044CC', strokeWidth: 2, strokeDasharray: '5 5'}}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: 800, padding: '16px' }}
                  formatter={(val: number) => [`Rp ${val.toLocaleString('id-ID')}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="total" stroke="#0044CC" strokeWidth={5} fillOpacity={1} fill="url(#colorTotal)" dot={{r: 4, fill: '#fff', strokeWidth: 2, stroke: '#0044CC'}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-[2rem] border-none shadow-2xl shadow-black/[0.03] bg-white p-8 space-y-6 flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <PieIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">Top Categories</h3>
          </div>

          <div className="h-[240px] w-full flex items-center justify-center relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(255,255,255,0.8)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
               <Sparkles className="w-6 h-6 text-indigo-200 animate-pulse" />
               <span className="text-[10px] font-black text-gray-300 tracking-widest uppercase">Hot Items</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            {categoryData.slice(0, 4).map((cat, idx) => (
              <div key={cat.name} className="flex items-center gap-2 bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: CHART_COLORS[idx]}} />
                <span className="text-[9px] font-black text-gray-500 uppercase truncate tracking-tighter">{cat.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/[0.02] bg-white overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Activity className="w-5 h-5 text-gray-400" />
               <h3 className="font-black text-lg tracking-tight uppercase italic">Operational Logs</h3>
             </div>
             <Link href="/sessions">
               <Button variant="ghost" className="text-[10px] font-bold text-[#0044CC] tracking-widest">VIEW ALL</Button>
             </Link>
          </div>
          <div className="p-4 space-y-4">
             {activeSessions.length === 0 ? (
               <div className="py-12 text-center text-gray-200">
                 <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-5 italic" />
                 <p className="text-sm font-medium italic opacity-40">No active operational sessions</p>
               </div>
             ) : (
               activeSessions.slice(0, 4).map(session => (
                 <Link key={session.id} href={`/sessions/${session.id}`}>
                   <div className="p-5 hover:bg-slate-50 transition-all rounded-[2rem] cursor-pointer flex items-center justify-between group border border-transparent hover:border-slate-100">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-sm">
                          <ClipboardList className="w-6 h-6" />
                       </div>
                       <div>
                         <h4 className="font-black text-slate-800 group-hover:text-[#0044CC] transition-colors leading-tight">{session.title}</h4>
                         <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Started {format(new Date(session.startedAt), 'dd MMM y')}</p>
                       </div>
                     </div>
                     <StatusBadge status={session.status} />
                   </div>
                 </Link>
               ))
             )}
          </div>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/[0.02] bg-white overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-rose-500" />
               <h3 className="font-black text-lg tracking-tight uppercase italic">Inventory Criticals</h3>
             </div>
             <Link href="/products">
               <Button variant="ghost" className="text-[10px] font-bold text-rose-600 hover:text-rose-700 tracking-widest uppercase">Inspect</Button>
             </Link>
          </div>
          <div className="p-4 space-y-2">
            {lowStockItems.length === 0 ? (
               <div className="py-12 text-center text-emerald-100">
                 <Package className="w-12 h-12 mx-auto mb-2 opacity-15" />
                 <p className="text-sm font-medium italic opacity-40">All inventory levels are healthy</p>
               </div>
            ) : (
              lowStockItems.slice(0, 4).map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between rounded-2xl hover:bg-rose-50/20 transition-all border border-transparent hover:border-rose-50 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:rotate-6 transition-transform">
                       <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800">{item.name}</h4>
                      <p className="text-[9px] text-slate-400 font-black tracking-[0.2em] uppercase">{item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-rose-600 tracking-tighter">{item.currentStock}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Units Left</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, trend }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-[#0044CC]",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    indigo: "bg-indigo-50 text-indigo-600",
    slate: "bg-slate-50 text-slate-600",
  };

  const isGrowth = sub?.includes('+');
  const isLoss = sub?.includes('-');

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <Card className="rounded-[2.5rem] p-7 border-none shadow-xl shadow-black/[0.02] bg-white group hover:scale-[1.03] transition-all duration-500 ring-4 ring-transparent hover:ring-slate-50 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className={`p-4 rounded-[1.25rem] ${colorMap[color] || colorMap.blue} transition-all duration-700 group-hover:rotate-6 shadow-sm`}>
            <Icon className="w-7 h-7" />
          </div>
          <div className="flex flex-col items-end">
            {trend && (
               <div className="h-[40px] w-[80px]">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={trend}>
                        <Line type="monotone" dataKey="value" stroke={isLoss ? '#f43f5e' : '#10b981'} strokeWidth={2.5} dot={false} />
                     </LineChart>
                  </ResponsiveContainer>
               </div>
            )}
            <Badge variant="outline" className={cn(
               "mt-1 text-[9px] font-black tracking-widest uppercase border-none",
               isGrowth ? "bg-emerald-50 text-emerald-600" : isLoss ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
            )}>
              {isGrowth ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : isLoss ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : null}
              {sub}
            </Badge>
          </div>
        </div>
        <div className="relative z-10">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">{label}</h4>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tighter leading-none">{value}</p>
        </div>
        
        {/* Dynamic Background Ornament */}
        <div className={cn(
          "absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-20 transition-all duration-700 group-hover:scale-150",
          color === 'emerald' ? "bg-emerald-400" : color === 'blue' ? "bg-blue-400" : "bg-indigo-400"
        )} />
      </Card>
    </motion.div>
  );
}
