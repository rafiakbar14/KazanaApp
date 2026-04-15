import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, TrendingUp, AlertTriangle, CheckCircle, RefreshCcw, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Insight {
  title: string;
  content: string;
  type: "info" | "warning" | "success";
}

interface StockHealth {
  totalItems: number;
  outOfStock: number;
  lowStock: number;
  healthy: number;
}

export default function SmartInsights() {
  const { 
    data: insights, 
    isLoading: loadingInsights, 
    refetch: refetchInsights,
    isRefetching: isRefreshing 
  } = useQuery<Insight[]>({
    queryKey: ["/api/analytics/ai-insights"],
  });

  const { data: health, isLoading: loadingHealth } = useQuery<StockHealth>({
    queryKey: ["/api/analytics/stock-health"],
  });

  const { data: categoryData, isLoading: loadingCategory } = useQuery<any[]>({
    queryKey: ["/api/analytics/category-performance"],
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "success": return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      default: return <TrendingUp className="h-5 w-5 text-blue-500" />;
    }
  };

  const getHealthColor = (label: string) => {
    switch (label) {
      case "Out of Stock": return "bg-rose-500";
      case "Low Stock": return "bg-amber-500";
      default: return "bg-emerald-500";
    }
  };

  return (
    <div className="p-8 space-y-8 bg-zinc-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <Brain className="h-8 w-8 text-indigo-600" />
            Smart Insights AI
          </h1>
          <p className="text-zinc-500 mt-2">Wawasan bisnis otomatis bertenaga Google Gemini AI.</p>
        </div>
        <Button 
          onClick={() => refetchInsights()} 
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh AI
        </Button>
      </div>

      {/* Stock Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loadingHealth ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <Card className="border-none shadow-sm bg-white overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">Total Produk</p>
                    <h3 className="text-2xl font-bold mt-1">{health?.totalItems}</h3>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Activity className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {[
              { label: "Healthy", value: health?.healthy, icon: <CheckCircle />, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Low Stock", value: health?.lowStock, icon: <AlertTriangle />, color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Out of Stock", value: health?.outOfStock, icon: <Activity />, color: "text-rose-600", bg: "bg-rose-50" },
            ].map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                      <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                    </div>
                    <div className={`p-2 ${stat.bg} rounded-lg ${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <Progress 
                    value={health ? (stat.value! / health.totalItems) * 100 : 0} 
                    className="h-1.5 mt-4" 
                    indicatorClassName={getHealthColor(stat.label)}
                  />
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* AI Insights Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Rekomendasi Strategis
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {loadingInsights ? (
              Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl" />
              ))
            ) : (
              insights?.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-none shadow-md bg-white hover:shadow-lg transition-all duration-300 h-full overflow-hidden relative">
                    <div className={`absolute top-0 right-0 p-4 opacity-10`}>
                      {getIcon(insight.type)}
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          insight.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                          insight.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {getIcon(insight.type)}
                        </div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-zinc-600 leading-relaxed whitespace-pre-line">
                        {insight.content}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Category Performance & Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-md bg-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Performa Stok per Kategori
            </CardTitle>
            <CardDescription>Visualisasi nilai inventaris berdasarkan kategori produk.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {loadingCategory ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: -20, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="category" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    width={100}
                    style={{ fontSize: '12px', fontWeight: 500 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f4f4f5' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`Rp${value.toLocaleString()}`, 'Total Nilai']}
                  />
                  <Bar dataKey="totalValue" radius={[0, 4, 4, 0]} barSize={24}>
                    {categoryData?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'][index % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-indigo-600 to-violet-700 text-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-indigo-200" />
              Kazana Smart Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <p className="text-sm text-indigo-100">Nilai Aset Inventaris</p>
              <h4 className="text-2xl font-bold mt-1">
                Rp{categoryData?.reduce((acc, curr) => acc + curr.totalValue, 0).toLocaleString()}
              </h4>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-indigo-100">Rata-rata Stok/Kategori</span>
                <span className="font-semibold">
                  {categoryData?.length ? Math.round(categoryData.reduce((acc, curr) => acc + curr.totalStock, 0) / categoryData.length) : 0} unit
                </span>
              </div>
              <div className="w-full h-px bg-white/10" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-indigo-100">Kategori Aktif</span>
                <span className="font-semibold">{categoryData?.length} Kategori</span>
              </div>
            </div>

            <div className="pt-4">
              <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-semibold py-6 rounded-xl shadow-lg">
                Download Laporan PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
