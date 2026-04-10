import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useRole } from "@/hooks/use-role";
import { useLocation } from "wouter";
import { History, Search, Filter, Loader2, ArrowLeft, User, Clock, MapPin, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function ActivityLogs() {
  const { isAdmin, isLoading: roleLoading } = useRole();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");

  const { data: logs, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/logs"],
    queryFn: async () => {
      const res = await fetch("/api/admin/logs", { credentials: "include" });
      if (!res.ok) throw new Error("Gagal mengambil log aktivitas");
      return res.json();
    },
    enabled: isAdmin,
  });

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      const matchesSearch = 
        log.username?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.details?.toLowerCase().includes(search.toLowerCase());
      
      const matchesBranch = branchFilter === "all" || log.branchId?.toString() === branchFilter;
      
      return matchesSearch && matchesBranch;
    });
  }, [logs, search, branchFilter]);

  if (roleLoading || isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    setLocation("/");
    return null;
  }

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/roles")} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <History className="w-8 h-8 text-primary" />
              Audit Log
            </h1>
            <p className="text-muted-foreground mt-1">Pantau seluruh aktivitas user berdasarkan cabang.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Cari user, aksi, atau detail..."
              className="pl-9 bg-muted/20 border-border/50 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-48 bg-muted/20 border-border/50 rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Semua Cabang" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-border">
              <SelectItem value="all">Semua Cabang</SelectItem>
              <SelectItem value="1">Cabang 1 (Utama)</SelectItem>
              <SelectItem value="2">Cabang 2</SelectItem>
              <SelectItem value="3">Cabang 3</SelectItem>
              <SelectItem value="4">Cabang 4</SelectItem>
              <SelectItem value="5">Cabang 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-muted/5 rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Cabang</th>
                  <th className="px-6 py-4">Aksi</th>
                  <th className="px-6 py-4">Detail</th>
                  <th className="px-6 py-4">Alamat IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground font-medium">
                          {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3 h-3 text-primary" />
                        <span className="font-bold text-foreground">@{log.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        <MapPin className="w-3 h-3 mr-1" />
                        #{log.branchId}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={cn(
                        "font-bold text-[10px] uppercase",
                        log.action.includes("Login") ? "bg-emerald-100 text-emerald-700" :
                        log.action.includes("Register") ? "bg-blue-100 text-blue-700" :
                        log.action.includes("Complete") ? "bg-purple-100 text-purple-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {log.details || "-"}
                    </td>
                    <td className="px-6 py-4 font-mono text-[10px] text-muted-foreground">
                      {log.ipAddress || "-"}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
                      Belum ada data log aktivitas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
