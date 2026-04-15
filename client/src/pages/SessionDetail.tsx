import { useSession, useUpdateRecord, useCompleteSession, useBackupSession, useVerifyBackup } from "@/hooks/use-sessions";
import { useCategories, useCategoryPriorities } from "@/hooks/use-products";
import { useRole } from "@/hooks/use-role";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Search, Loader2, Filter, Printer, MapPin, User, ListOrdered, AlertTriangle, ChevronDown, Activity, PackageCheck, ClipboardCheck, Download, FileArchive, RotateCcw, Calendar } from "lucide-react";
import { BatchPhotoUpload } from "@/components/BatchPhotoUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import * as React from "react";
import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { buildUrl } from "@shared/routes";
import { api } from "@shared/routes";
import type { OpnameRecordWithProduct } from "@shared/schema";

// Modular Components
import { RecordRow } from "@/components/sessions/RecordRow";
import { MobileRecordCard } from "@/components/sessions/MobileRecordCard";
import { PhotoLightbox } from "@/components/sessions/PhotoLightbox";
import { DownloadDialog } from "@/components/sessions/DownloadDialog";
import { SessionCategoryPriorityDialog } from "@/components/sessions/SessionCategoryPriorityDialog";
import { BackupStatusCard } from "@/components/sessions/BackupStatusCard";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function SessionDetail() {
  const { id } = useParams();
  const sessionId = parseInt(id!);
  const [, setLocation] = useLocation();
  const { data: session, isLoading, error } = useSession(sessionId);
  const { data: categories } = useCategories();
  const { canCount } = useRole();
  const completeSession = useCompleteSession();
  const backupSession = useBackupSession();
  const verifyBackup = useVerifyBackup();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [categoryPriorityOpen, setCategoryPriorityOpen] = useState(false);
  const { toast } = useToast();
  const { data: categoryPriorities } = useCategoryPriorities();

  const [currentCounter, setCurrentCounter] = useState<string>("");

  const staffNames = React.useMemo(() => {
    if (!session?.assignedTo) return [];
    return session.assignedTo.split(", ").map(s => s.trim());
  }, [session?.assignedTo]);

  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setVisibleCount(20);
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    if (staffNames.length > 0 && !currentCounter) {
      setCurrentCounter(staffNames[0]);
    }
  }, [staffNames, currentCounter]);

  const displayCategories = React.useMemo(() => {
    const fromTable = (categories || []).map(cat => {
      const name = typeof cat === 'string' ? cat : cat?.name;
      return name ? name.trim() : "";
    }).filter(Boolean);
    const fromProducts = (session?.records || []).map(r => r.product.category?.trim()).filter(Boolean) as string[];
    return Array.from(new Set([...fromTable, ...fromProducts])).sort();
  }, [categories, session?.records]);

  const isCompleted = session?.status === "completed";

  const records = React.useMemo(() => {
    if (!session?.records) return [];
    let filtered = session.records.filter(r => {
      const searchLower = search.toLowerCase();
      const matchesSearch = searchLower === "" || 
        r.product.name.toLowerCase().includes(searchLower) ||
        r.product.sku.toLowerCase().includes(searchLower) ||
        (r.product.productCode && r.product.productCode.toLowerCase().includes(searchLower)) ||
        (r.product.subCategory && r.product.subCategory.toLowerCase().includes(searchLower));
      const pCat = String(r.product.category || "").trim();
      const fCat = String(categoryFilter || "").trim();
      const matchesCategory = categoryFilter === "all" || (pCat === fCat);
      
      let matchesStatus = true;
      if (statusFilter === "counted") matchesStatus = r.actualStock !== null;
      if (statusFilter === "uncounted") matchesStatus = r.actualStock === null;

      return matchesSearch && matchesCategory && matchesStatus;
    });
    if (categoryPriorities && categoryPriorities.length > 0) {
      const priorityMap = new Map(categoryPriorities.map((p: any) => [p.categoryName, p.sortOrder]));
      filtered = [...filtered].sort((a, b) => {
        const aPriority = priorityMap.get(String(a.product.category || "").trim()) ?? 999;
        const bPriority = priorityMap.get(String(b.product.category || "").trim()) ?? 999;
        return aPriority - bPriority;
      });
    }
    return filtered;
  }, [session?.records, search, categoryFilter, statusFilter, categoryPriorities]);

  const hasPhotos = useMemo(() => {
    return session?.records?.some(r => r.photoUrl || (r.photos && r.photos.length > 0)) ?? false;
  }, [session?.records]);

  const stats = useMemo(() => {
    if (!session?.records) return { total: 0, counted: 0, progress: 0 };
    const total = session.records.length;
    const counted = session.records.filter(r => r.actualStock !== null).length;
    const progress = total > 0 ? Math.round((counted / total) * 100) : 0;
    return { total, counted, progress };
  }, [session?.records]);

  const isGudangSession = session?.locationType === "gudang";

  const exportToExcel = () => {
    if (!session?.records) return;

    const data = isGudangSession
      ? session.records.map(r => ({
        "Product Name": r.product.name,
        "Product Code": r.product.productCode || "",
        "Unit": r.product.units?.[0]?.unitName || "",
        "Category": r.product.category || "",
        "Sub Category": r.product.subCategory || "",
        "Actual Stock": r.actualStock ?? 0,
        "Retur": r.returnedQuantity ?? 0,
        "Notes": r.notes || "",
      }))
      : session.records.map(r => ({
        SKU: r.product.sku,
        "Product Name": r.product.name,
        Category: r.product.category || "",
        "Actual Stock": r.actualStock ?? 0,
        "Retur": r.returnedQuantity ?? 0,
        "Notes": r.notes || "",
      }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Opname Data");
    XLSX.writeFile(wb, `${session.title.replace(/\s+/g, '_')}_Report.xlsx`);

    toast({
      title: "Export Selesai",
      description: "File Excel telah berhasil diunduh.",
    });
  };

  const downloadPhotosZip = async (options?: { productIds?: number[]; date?: string }) => {
    try {
      const url = buildUrl(api.upload.downloadZip.path, { id: sessionId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options || {}),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Error", description: err.message || "Gagal download ZIP", variant: "destructive" });
        return;
      }
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${session?.title?.replace(/\s+/g, "_") || "photos"}_Photos.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast({ title: "Download Berhasil", description: "File ZIP telah didownload." });
    } catch {
      toast({ title: "Error", description: "Gagal download ZIP", variant: "destructive" });
    }
  };

  const handleComplete = () => {
    completeSession.mutate(sessionId, {
      onSuccess: () => {
        setCompletionDialogOpen(true);
      }
    });
  };

  const printSummary = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
          <Skeleton className="h-24 w-48 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Skeleton className="h-32 rounded-3xl" />
           <Skeleton className="h-32 rounded-3xl" />
           <Skeleton className="h-32 rounded-3xl" />
        </div>
        <Skeleton className="h-[60vh] w-full rounded-3xl" />
      </div>
    );
  }

  if (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/40 backdrop-blur-2xl border border-white/20 rounded-[40px] p-10 text-center space-y-6 shadow-2xl shadow-black/5">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-800">Gagal Memuat Data</h3>
            <p className="text-slate-500 font-medium">{errorMsg}</p>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="bg-slate-900 text-white h-12 rounded-2xl font-bold shadow-lg shadow-slate-200">
              <RotateCcw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/sessions")} className="h-12 rounded-2xl font-bold text-slate-500">
               Kembali ke Daftar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const isBackedUp = (session as any).isBackedUp;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Header & Stats Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-6">
          <button 
            onClick={() => setLocation("/sessions")}
            className="group flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-black text-[10px] uppercase tracking-[0.2em]"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Sesi
          </button>
          
          <div className="space-y-3">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">{session.title}</h1>
              <StatusBadge status={session.status} className="scale-110" />
            </div>
            
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur px-3 py-1.5 rounded-full border border-white shadow-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-tight text-slate-600">
                   {session.locationType === "gudang" ? "Warehouse / Gudang" : "Outlet / Toko"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-bold">{new Date(session.startedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <PackageCheck className="w-4 h-4" />
                <span className="text-sm font-bold">{session.records.length} Item</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Stat Card */}
        <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[32px] p-6 shadow-2xl shadow-black/5 flex items-center gap-6 min-w-[300px]">
          <div className="relative w-16 h-16 shrink-0">
             <svg className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray={`${stats.progress * 1.76} 176`} className="text-primary transition-all duration-1000 ease-out" />
             </svg>
             <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-primary">{stats.progress}%</span>
             </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Penyelesaian</p>
            <p className="text-2xl font-black text-slate-800 leading-tight">{stats.counted} / {stats.total}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Item Terhitung</p>
          </div>
        </div>
      </div>

      <BackupStatusCard 
        session={session} 
        onBackup={() => backupSession.mutate(sessionId)}
        onVerify={() => verifyBackup.mutate(sessionId)}
        isBackupLoading={backupSession.isPending}
        isVerifyLoading={verifyBackup.isPending}
      />

      {/* Toolbar Section */}
      <div className="sticky top-4 z-40 bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[32px] p-3 shadow-2xl shadow-black/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <Input
            placeholder="Cari SKU, Nama, atau Lokasi..."
            className="pl-12 h-14 bg-white/50 border-white/20 rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-primary shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto px-1">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-14 min-w-[160px] bg-white/50 border-white/20 rounded-2xl font-bold text-slate-700 shadow-sm">
              <Filter className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white/20 shadow-2xl">
              <SelectItem value="all" className="font-bold">Semua Kategori</SelectItem>
              {displayCategories.map((cat) => (
                <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-14 min-w-[160px] bg-white/50 border-white/20 rounded-2xl font-bold text-slate-700 shadow-sm">
              <ClipboardCheck className="w-4 h-4 mr-2 text-primary" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white/20 shadow-2xl">
              <SelectItem value="all" className="font-bold">Semua Status</SelectItem>
              <SelectItem value="counted" className="font-bold text-emerald-600">Sudah Dihitung</SelectItem>
              <SelectItem value="uncounted" className="font-bold text-amber-600">Belum Dihitung</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/5 rounded-2xl border border-white shadow-inner">
             <div className="flex items-center gap-2 pl-3 mr-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Petugas:</span>
             </div>
             <Select value={currentCounter} onValueChange={setCurrentCounter} disabled={isCompleted || !canCount}>
                <SelectTrigger className="h-10 min-w-[120px] bg-white border-transparent rounded-xl font-black text-xs text-primary shadow-sm hover:scale-105 transition-transform active:scale-95">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-white shadow-2xl">
                  {staffNames.map(name => (
                    <SelectItem key={name} value={name} className="font-bold">{name}</SelectItem>
                  ))}
                </SelectContent>
             </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pb-2">
         <div className="space-x-2">
            <Button variant="ghost" size="sm" onClick={() => setCategoryPriorityOpen(true)} className="rounded-full text-xs font-black text-slate-400 hover:text-primary transition-all">
                <ListOrdered className="w-4 h-4 mr-2" />
                SET PRIORITAS
            </Button>
         </div>
         <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel} className="rounded-xl h-10 border-white/40 bg-white/20 backdrop-blur font-black text-[10px] tracking-wider transition-all hover:bg-slate-900 hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                EXPORT EXCEL
            </Button>
            {!isCompleted && canCount && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="rounded-xl h-10 bg-slate-900 text-white font-black text-[10px] tracking-wider shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95">
                      <Activity className="w-4 h-4 mr-2" />
                      SELESAIKAN OPNAME
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[40px] border-white/20 shadow-2xl p-8">
                    <AlertDialogHeader className="space-y-4">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                         <ClipboardCheck className="w-8 h-8 text-emerald-600" />
                      </div>
                      <AlertDialogTitle className="text-3xl font-black text-center text-slate-900">Selesaikan Opname?</AlertDialogTitle>
                      <AlertDialogDescription className="text-center text-slate-500 font-medium">
                        Pastikan semua item telah dihitung dengan benar. Setelah diselesaikan, stok fisik akan diperbarui secara permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-6 space-y-3">
                       <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-50 p-4 rounded-3xl text-center space-y-1 border border-white">
                             <p className="text-[10px] font-black text-slate-400 uppercase leading-none">TOTAL</p>
                             <p className="text-xl font-black text-slate-800">{stats.total}</p>
                          </div>
                          <div className="bg-emerald-50 p-4 rounded-3xl text-center space-y-1 border border-white">
                             <p className="text-[10px] font-black text-emerald-400 uppercase leading-none">OK</p>
                             <p className="text-xl font-black text-emerald-600">{stats.counted}</p>
                          </div>
                          <div className="bg-amber-50 p-4 rounded-3xl text-center space-y-1 border border-white">
                             <p className="text-[10px] font-black text-amber-400 uppercase leading-none">SKIP</p>
                             <p className="text-xl font-black text-amber-600">{stats.total - stats.counted}</p>
                          </div>
                       </div>
                    </div>
                    <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-3">
                      <AlertDialogCancel className="h-14 rounded-2xl font-bold text-slate-500 border-transparent hover:bg-slate-100 mt-0">Batal</AlertDialogCancel>
                      <Button
                        onClick={handleComplete}
                        className="h-14 flex-1 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-xl shadow-slate-200"
                        disabled={completeSession.isPending}
                      >
                        {completeSession.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Ya, Selesaikan"}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            )}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/40 rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/[0.02] border-b border-white/20">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-10">KODE / SKU</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">INFORMASI PRODUK</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">PERHITUNGAN FISIK</th>
                {isCompleted && (
                  <th className="px-8 py-6 text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">RETUR</th>
                )}
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center min-w-[140px]">DOKUMENTASI</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {records.slice(0, visibleCount).map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  sessionId={sessionId}
                  readOnly={isCompleted || !canCount}
                  isCompleted={isCompleted}
                  isGudang={isGudangSession}
                  currentCounter={currentCounter}
                  isBackedUp={isBackedUp}
                />
              ))}
              {records.length === 0 && (
                <tr>
                   <td colSpan={7} className="py-20 text-center">
                      <div className="space-y-4">
                         <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                            <Search className="w-10 h-10 text-slate-200" />
                         </div>
                         <p className="text-slate-400 font-bold">Tidak ada produk yang ditemukan.</p>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Grid */}
        <div className="md:hidden grid grid-cols-1 gap-4 p-4 pb-10">
           {records.slice(0, visibleCount).map((record) => (
              <MobileRecordCard
                key={record.id}
                record={record}
                sessionId={sessionId}
                readOnly={isCompleted || !canCount}
                isCompleted={isCompleted}
                isGudang={isGudangSession}
                currentCounter={currentCounter}
                isBackedUp={isBackedUp}
              />
           ))}
           {records.length === 0 && (
              <div className="py-20 text-center text-slate-400 font-bold">
                 Belum ada data tersedia.
              </div>
           )}
        </div>
      </div>

      {records.length > visibleCount && (
        <div className="flex justify-center pt-4">
          <Button
            variant="ghost"
            onClick={() => setVisibleCount(prev => prev + 50)}
            className="rounded-3xl h-14 px-10 border-white/60 bg-white/20 backdrop-blur font-black text-slate-500 hover:text-primary hover:bg-white/40 transition-all active:scale-95"
          >
            Tampilkan {records.length - visibleCount} item lainnya
            <ChevronDown className="w-5 h-5 ml-3" />
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <SessionCategoryPriorityDialog
        open={categoryPriorityOpen}
        onOpenChange={setCategoryPriorityOpen}
        categories={(categories as any) ?? []}
      />

      <DownloadDialog 
        open={downloadDialogOpen} 
        onOpenChange={setDownloadDialogOpen} 
        records={session.records} 
        onDownload={downloadPhotosZip} 
      />

      {/* Success Dialog */}
      <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
         <DialogContent className="max-w-md rounded-[40px] border-white/20 shadow-2xl p-10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-in zoom-in duration-500" />
               </div>
               <div className="space-y-2">
                  <DialogTitle className="text-3xl font-black text-slate-900">Selesai Berhasil!</DialogTitle>
                  <p className="text-slate-500 font-medium">Sesi stock opname telah berhasil disinkronkan ke pusat data.</p>
               </div>
               
               <div className="w-full bg-slate-50 rounded-3xl p-6 border border-white space-y-3">
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-slate-400 uppercase tracking-wider">Total Item</span>
                     <span className="font-black text-slate-900">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                     <span className="font-bold text-slate-400 uppercase tracking-wider">Berhasil Dihitung</span>
                     <span className="font-black text-emerald-600">{stats.counted}</span>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 w-full">
                  <Button variant="outline" onClick={exportToExcel} className="h-14 rounded-2xl font-bold text-slate-600 border-transparent bg-slate-100 hover:bg-slate-200">
                     <Download className="w-4 h-4 mr-2" />
                     EXCEL
                  </Button>
                  <Button variant="outline" onClick={printSummary} className="h-14 rounded-2xl font-bold text-slate-600 border-transparent bg-slate-100 hover:bg-slate-200">
                     <Printer className="w-4 h-4 mr-2" />
                     PRINT
                  </Button>
               </div>

               <Button onClick={() => setCompletionDialogOpen(false)} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-300">
                  Tutup
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
