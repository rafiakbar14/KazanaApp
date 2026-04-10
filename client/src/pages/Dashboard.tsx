import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProducts } from "@/hooks/use-products";
import { useSessions } from "@/hooks/use-sessions";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { useAccounting } from "@/hooks/use-accounting";
import { useAssemblySessions } from "@/hooks/use-production";
import { useAnnouncements } from "@/hooks/use-announcements";
import { api } from "@shared/routes";
import { 
  Package, ClipboardList, AlertTriangle, Clock,
  TrendingUp, Wallet, ShoppingBag, ChevronRight,
  BarChart3, PieChart as PieIcon, Activity, Plus
} from "lucide-react";
import { Link } from "wouter";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const CHART_COLORS = ['#0044CC', '#6366F1', '#8B5CF6', '#EC4899', '#F43F5E'];

export default function Dashboard() {
  const { user } = useAuth();
  const { role } = useRole();
  const { data: products } = useProducts();
  const { data: sessions } = useSessions();
  const { data: announcements } = useAnnouncements();
  
  // Modular Hooks
  const subscribedModules = (user?.subscribedModules as string[]) || [];
  const hasPOS = subscribedModules.includes("pos");
  const hasAccounting = subscribedModules.includes("accounting");
  const hasProduction = subscribedModules.includes("production");

  // Fetch sales data directly instead of using usePOS (which requires POSProvider)
  const { data: salesHistory } = useQuery<any[]>({
    queryKey: [api.pos.sales.list.path],
    enabled: hasPOS,
  });

  // Fetch customers data directly
  const { data: customers } = useQuery<any[]>({
    queryKey: [api.pos.customers.list.path],
    enabled: hasPOS,
  });

  const acc = useAccounting();
  const { data: assemblySessions } = useAssemblySessions();

  // 1. Processing Sales Data (Today & Hourly)
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

  // 2. Processing Category Distribution (Donut Chart)
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    todaySalesHistory.forEach(s => {
      // Logic: Simple mock cat for now if not detailed in items, 
      // but let's assume we can group by category of products
      (s.items || []).forEach((item: any) => {
        const cat = item.product?.category || "Lainnya";
        cats[cat] = (cats[cat] || 0) + Number(item.unitPrice) * item.quantity;
      });
    });
    
    // Fallback data if no sales today for visual
    if (Object.keys(cats).length === 0) {
      return [
        { name: 'Kategori A', value: 400 },
        { name: 'Kategori B', value: 300 },
        { name: 'Kategori C', value: 300 },
      ];
    }

    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [todaySalesHistory]);

  // 3. Processing Inventory Health
  const activeSessions = sessions?.filter(s => s.status === 'in_progress') || [];
  const lowStockItems = products?.filter(p => p.currentStock < (p.minStockThreshold || 10)) || [];
  
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
      {/* 1. Header & Quick Actions */}
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
          <Button className="bg-[#0044CC] text-white hover:bg-blue-600 rounded-2xl font-bold h-12 px-6 shadow-xl shadow-blue-500/20 gap-2">
            <Plus className="w-5 h-5" /> Transaksi Baru
          </Button>
          <Button variant="outline" className="rounded-2xl h-12 px-5 border-gray-200">
            <Clock className="w-5 h-5 text-gray-400" />
          </Button>
        </div>
      </div>

      {/* 2. Top Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat: Total Products (Common) */}
        <StatCard 
          label="Total SKU Produk" 
          value={products?.length || 0} 
          sub="Aktif di Gudang" 
          icon={Package} 
          color="blue" 
        />
        
        {/* Stat: Sales (If POS) */}
        {hasPOS ? (
          <StatCard 
            label="Omzet Hari Ini" 
            value={`Rp ${todayRevenue.toLocaleString('id-ID')}`} 
            sub={`${todaySalesHistory.length} Transaksi`}
            icon={TrendingUp} 
            color="emerald" 
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

        {/* Stat: Accounting (If Subscribed) */}
        {hasAccounting ? (
          <StatCard 
            label="Laba Bersih" 
            value={`Rp ${(acc.profitLoss?.netProfit ?? 0).toLocaleString('id-ID')}`} 
            sub="Profit Bulan Ini"
            icon={Wallet} 
            color="indigo" 
          />
        ) : (
          <StatCard 
            label="Stok Rendah" 
            value={lowStockItems.length} 
            sub="Perlu Restok"
            icon={AlertTriangle} 
            color="orange" 
          />
        )}

        <StatCard 
          label="Customer Loyalti" 
          value={customers?.length || 0}
          sub="Member Terdaftar"
          icon={ShoppingBag} 
          color="slate" 
        />
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Peak Hours Area Chart (2/3 width) */}
        <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-2xl shadow-black/[0.03] overflow-hidden bg-white p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-2xl text-[#0044CC]">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">Jam Laku Transaksi</h3>
            </div>
            <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">24 Jam Terakhir</Badge>
          </div>
          
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0044CC" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0044CC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => `Rp ${val.toLocaleString('id-ID')}`}
                />
                <Area type="monotone" dataKey="total" stroke="#0044CC" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut Chart (1/3 width) */}
        <Card className="rounded-[2rem] border-none shadow-2xl shadow-black/[0.03] bg-white p-8 space-y-6 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <PieIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">Kontribusi Kategori</h3>
          </div>

          <div className="h-[240px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} cornerRadius={8} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {categoryData.slice(0, 4).map((cat, idx) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: CHART_COLORS[idx]}} />
                <span className="text-[10px] font-bold text-gray-500 uppercase truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 4. Secondary Bento Section (Lists) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Inventory Section (Conditional vs POS History) */}
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/[0.02] bg-white overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Activity className="w-5 h-5 text-gray-400" />
               <h3 className="font-black text-lg tracking-tight uppercase italic">Aktivitas Terkini</h3>
             </div>
             <Link href="/sessions">
               <Button variant="ghost" className="text-xs font-bold text-[#0044CC]">SEMUA</Button>
             </Link>
          </div>
          <div className="p-4 space-y-4">
             {activeSessions.length === 0 ? (
               <div className="py-12 text-center text-gray-300">
                 <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-10" />
                 <p className="text-sm font-medium italic">Belum ada sesi aktif</p>
               </div>
             ) : (
               activeSessions.map(session => (
                 <Link key={session.id} href={`/sessions/${session.id}`}>
                   <div className="p-5 hover:bg-gray-50 transition-all rounded-[1.5rem] cursor-pointer flex items-center justify-between group border border-transparent hover:border-blue-50">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ClipboardList className="w-5 h-5" />
                       </div>
                       <div>
                         <h4 className="font-bold text-gray-900 group-hover:text-[#0044CC] transition-colors">{session.title}</h4>
                         <p className="text-xs text-gray-400 font-medium">Dimulai {format(new Date(session.startedAt), 'dd MMM y')}</p>
                       </div>
                     </div>
                     <StatusBadge status={session.status} />
                   </div>
                 </Link>
               ))
             )}
          </div>
        </Card>

        {/* Low Stock Alerts (Crucial Widget) */}
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-black/[0.02] bg-white overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-orange-500" />
               <h3 className="font-black text-lg tracking-tight uppercase italic">Peringatan Stok Rendah</h3>
             </div>
             <Link href="/products">
               <Button variant="ghost" className="text-xs font-bold text-orange-600 hover:text-orange-700">MANAJEMEN</Button>
             </Link>
          </div>
          <div className="p-4 space-y-2">
            {lowStockItems.length === 0 ? (
               <div className="py-12 text-center text-emerald-100">
                 <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                 <p className="text-sm font-medium italic">Semua stok terpantau sehat</p>
               </div>
            ) : (
              lowStockItems.slice(0, 5).map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between rounded-2xl hover:bg-orange-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                       <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 font-mono tracking-widest">{item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-orange-600 tracking-tighter">{item.currentStock}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sisa Unit</p>
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

function StatCard({ label, value, sub, icon: Icon, color }: any) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-[#0044CC]",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    indigo: "bg-indigo-50 text-indigo-600",
    slate: "bg-slate-50 text-slate-600",
  };

  return (
    <Card className="rounded-[2rem] p-6 border-none shadow-xl shadow-black/[0.02] bg-white group hover:scale-[1.02] transition-all duration-300 ring-2 ring-transparent hover:ring-blue-50">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color] || colorMap.blue} transition-transform duration-500 group-hover:rotate-12`}>
          <Icon className="w-6 h-6" />
        </div>
        <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-blue-500 transition-colors" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{label}</h4>
        <p className="text-3xl font-black text-gray-900 mt-2 tracking-tighter">{value}</p>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 opacity-60 italic">{sub}</p>
      </div>
    </Card>
  );
}
