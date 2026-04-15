import { useQuery } from "@tanstack/react-query";
import { useRole } from "@/hooks/use-role";
import { useLocation } from "wouter";
import { 
  History, Search, Filter, Loader2, ArrowLeft, User, Clock, 
  MapPin, Activity, Download, Calendar, ShieldAlert, Users, 
  Package, ShoppingCart, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ExcelJS from "exceljs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ActivityLogs() {
  const { isAdmin, isLoading: roleLoading } = useRole();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});

  const { data: logs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logs", { credentials: "include" });
      if (!res.ok) throw new Error("Gagal mengambil log aktivitas");
      return res.json();
    },
    enabled: isAdmin,
  });

  const categories = useMemo(() => ([
    { id: "all", name: "Semua Kategori", icon: Activity },
    { id: "auth", name: "Keamanan & Login", icon: ShieldAlert, keywords: ["LOGIN", "REGISTER", "PASSWORD", "LOGOUT"] },
    { id: "inventory", name: "Inventaris", icon: Package, keywords: ["STOCK", "PRODUCT", "INBOUND", "OUTBOUND", "TRANSFER"] },
    { id: "sales", name: "Penjualan & POS", icon: ShoppingCart, keywords: ["SALE", "POS", "VOUCHER", "INVOICE"] },
    { id: "admin", name: "Administrasi", icon: Settings, keywords: ["UPDATE_USER", "SET_ROLE", "BRANCH", "MODULE"] },
  ]), []);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      const matchesSearch = 
        log.username?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.details?.toLowerCase().includes(search.toLowerCase());
      
      const matchesBranch = branchFilter === "all" || log.branchId?.toString() === branchFilter;
      
      let matchesCategory = true;
      if (categoryFilter !== "all") {
        const cat = categories.find(c => c.id === categoryFilter);
        matchesCategory = cat?.keywords?.some(k => log.action.toUpperCase().includes(k)) || false;
      }

      let matchesDate = true;
      if (dateRange.start || dateRange.end) {
        const logDate = new Date(log.createdAt);
        const start = dateRange.start ? startOfDay(new Date(dateRange.start)) : new Date(0);
        const end = dateRange.end ? endOfDay(new Date(dateRange.end)) : new Date();
        matchesDate = isWithinInterval(logDate, { start, end });
      }
      
      return matchesSearch && matchesBranch && matchesCategory && matchesDate;
    });
  }, [logs, search, branchFilter, categoryFilter, dateRange, categories]);

  const stats = useMemo(() => {
    if (!logs) return { loginCount: 0, distinctUsers: 0, suspiciousAlerts: 0 };
    const logins = logs.filter(l => l.action.includes("LOGIN"));
    const users = new Set(logs.map(l => l.userId));
    const failed = logs.filter(l => l.action === "LOGIN_FAILED").length;
    return {
      loginCount: logins.length,
      distinctUsers: users.size,
      suspiciousAlerts: failed
    };
  }, [logs]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Audit Log");

    worksheet.columns = [
      { header: "Waktu", key: "time", width: 25 },
      { header: "User", key: "user", width: 15 },
      { header: "Cabang", key: "branch", width: 10 },
      { header: "Aksi", key: "action", width: 20 },
      { header: "Detail", key: "details", width: 50 },
      { header: "IP Address", key: "ip", width: 20 },
    ];

    filteredLogs.forEach(log => {
      worksheet.addRow({
        time: format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss"),
        user: `@${log.username}`,
        branch: `#${log.branchId || '-'}`,
        action: log.action,
        details: log.details,
        ip: log.ipAddress || "-"
      });
    });

    // Formatting
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Kazana_AuditLog_${format(new Date(), "yyyyMMdd")}.xlsx`;
    link.click();
  };

  if (roleLoading || isLoading) {
    return (
      <div className="p-12 flex justify-center h-[80vh] items-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!isAdmin) {
    setLocation("/");
    return null;
  }

  return (
    <div className="p-8 space-y-8 bg-zinc-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/branches")} className="hover:bg-white rounded-full bg-white shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
              <History className="w-8 h-8 text-indigo-600" />
              Audit Explorer
            </h1>
            <p className="text-zinc-500 mt-1">Sistem akuntabilitas dan jejak aktivitas perusahaan.</p>
          </div>
        </div>
        <Button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-100 h-11 px-6">
          <Download className="w-4 h-4" />
          Ekspor Excel (Laporan)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm h-32 flex items-center">
          <CardContent className="flex items-center gap-4 py-0">
            <div className="p-3 bg-indigo-100 rounded-2xl">
              <Activity className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Sesi Login</p>
              <h3 className="text-2xl font-bold">{stats.loginCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm h-32 flex items-center">
          <CardContent className="flex items-center gap-4 py-0">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">User Aktif</p>
              <h3 className="text-2xl font-bold">{stats.distinctUsers}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm h-32 flex items-center relative overflow-hidden group">
          <CardContent className="flex items-center gap-4 py-0 z-10">
            <div className={cn("p-3 rounded-2xl", stats.suspiciousAlerts > 0 ? "bg-rose-100" : "bg-emerald-100")}>
              <ShieldAlert className={cn("h-6 w-6", stats.suspiciousAlerts > 0 ? "text-rose-600" : "text-emerald-600")} />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500">Security Alerts</p>
              <h3 className="text-2xl font-bold">{stats.suspiciousAlerts}</h3>
            </div>
          </CardContent>
          {stats.suspiciousAlerts > 0 && <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />}
        </Card>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative group col-span-1 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Cari user atau detail..."
              className="pl-9 bg-zinc-50 border-zinc-200 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-zinc-50 border-zinc-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Semua Kategori" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="w-4 h-4" />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="bg-zinc-50 border-zinc-200 rounded-xl">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <SelectValue placeholder="Semua Cabang" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang</SelectItem>
              {[1, 2, 3, 4, 5].map(b => (
                <SelectItem key={b} value={b.toString()}>Cabang #{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input 
              type="date" 
              className="bg-zinc-50 border-zinc-200 rounded-xl h-10" 
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
            <Input 
              type="date" 
              className="bg-zinc-50 border-zinc-200 rounded-xl h-10" 
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200 font-bold uppercase text-[11px] tracking-wider text-zinc-500">
                  <th className="px-6 py-4">Waktu & User</th>
                  <th className="px-6 py-4">Lokasi</th>
                  <th className="px-6 py-4">Aksi</th>
                  <th className="px-6 py-4">Informasi Detail</th>
                  <th className="px-6 py-4">Keamanan IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredLogs.slice(0, 100).map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span className="text-zinc-900 font-semibold">
                            {format(new Date(log.createdAt), "dd MMM HH:mm", { locale: id })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <User className="w-3 h-3 text-indigo-400" />
                          <span className="text-zinc-600">@{log.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200 rounded-md font-mono">
                        #{log.branchId || '-'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "font-bold text-[10px] uppercase h-6 px-2 rounded-md",
                        log.action.includes("FAILED") ? "bg-rose-500 text-white shadow-sm shadow-rose-200" :
                        log.action.includes("LOGIN") ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        log.action.includes("CREATE") ? "bg-blue-50 text-blue-700 border-blue-200" :
                        log.action.includes("DELETE") ? "bg-rose-50 text-rose-700 border-rose-200" :
                        "bg-zinc-50 text-zinc-700 border-zinc-200"
                      )}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 max-w-xs truncate lg:max-w-md">
                      {log.details || "-"}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-zinc-400 group-hover:text-zinc-600 transition-colors">
                      {log.ipAddress || "-"}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center text-zinc-400 bg-zinc-50/20">
                      <Activity className="w-16 h-16 mx-auto text-zinc-100 mb-4" />
                      <p className="text-lg font-medium text-zinc-400">Belum ada jejak aktivitas.</p>
                      <p className="text-sm">Coba sesuaikan filter atau rentang tanggal Anda.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredLogs.length > 100 && (
            <div className="p-4 bg-zinc-50 text-center text-xs text-zinc-400 border-t border-zinc-200">
              Menampilkan 100 aktivitas terbaru. Gunakan filter untuk pencarian mendetail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
