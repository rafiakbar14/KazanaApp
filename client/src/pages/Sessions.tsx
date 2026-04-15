import * as React from "react";
import { useSessions, useCreateSession } from "@/hooks/use-sessions";
import { useRole } from "@/hooks/use-role";
import { useStaff } from "@/hooks/use-staff";
import { useMotivation } from "@/hooks/use-motivation";
import type { StaffMember, MotivationMessage } from "@shared/schema";
import { Link } from "wouter";
import { Plus, ClipboardList, Calendar, Loader2, Store, Warehouse, Package, User, Settings, Search, ChevronRight, Activity, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const sessionFormSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  notes: z.string().optional(),
});

function getDefaultTab(role: string): string {
  if (role === "stock_counter_toko") return "toko";
  if (role === "stock_counter_gudang") return "gudang";
  return "semua";
}

export default function Sessions() {
  const { canCount, canCountToko, canCountGudang, role } = useRole();
  const defaultTab = getDefaultTab(role);
  const [locationType, setLocationType] = useState<string>(defaultTab);
  const queryLocationType = locationType === "semua" ? undefined : locationType;
  const { data: sessions, isLoading } = useSessions(queryLocationType);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const showAllTabs = role === "admin" || role === "sku_manager" || role === "stock_counter";

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.assignedTo && s.assignedTo.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [sessions, searchQuery]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
            <Activity className="w-4 h-4 text-primary" />
            Inventory Audit
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Stock Opname</h1>
            <p className="text-slate-500 font-medium max-w-lg leading-relaxed">Kelola dan pantau sesi perhitungan stok fisik untuk menjaga keakuratan inventaris Kazana.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {role === "admin" && <GDriveSettingsDialog />}
          {canCount && (
            <CreateSessionDialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              currentLocationType={locationType === "semua" ? "toko" : locationType}
            />
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[32px] p-3 shadow-2xl shadow-black/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <Input
            placeholder="Cari sesi opname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-white/50 border-white/20 rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-primary shadow-inner"
          />
        </div>

        <Tabs value={locationType} onValueChange={setLocationType} className="w-full md:w-auto">
          <TabsList className="h-14 bg-slate-900/5 p-1.5 rounded-2xl border border-white shadow-inner flex shrink-0">
            {showAllTabs && (
              <TabsTrigger value="semua" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Semua
              </TabsTrigger>
            )}
            {canCountToko && (
              <TabsTrigger value="toko" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Toko
              </TabsTrigger>
            )}
            {canCountGudang && (
              <TabsTrigger value="gudang" className="rounded-xl px-6 font-black text-[10px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                Gudang
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-[32px] bg-white/20 animate-pulse border border-white/40" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[40px] p-20 text-center shadow-2xl shadow-black/5">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">Tidak Ada Sesi</h3>
          <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto mb-8">Belum ada sesi stock opname yang dibuat atau tidak ditemukan hasil pencarian.</p>
          {canCount && (
            <Button onClick={() => setIsCreateOpen(true)} className="bg-slate-900 text-white rounded-2xl h-14 px-10 font-black shadow-xl shadow-slate-200 hover:scale-105 transition-transform active:scale-95">
              Buat Sesi Baru
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <div
                className="group relative bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[40px] p-8 shadow-2xl shadow-black/5 transition-all duration-500 hover:-translate-y-2 hover:bg-white/60 hover:shadow-primary/10 cursor-pointer overflow-hidden flex flex-col h-full"
              >
                {/* Accent Background Overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                    <ClipboardList className="w-7 h-7 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={session.status} className="scale-110" />
                    <Badge variant="outline" className="bg-white/50 text-[10px] font-black uppercase tracking-widest border-white">
                      {session.locationType === "gudang" ? <Warehouse className="w-3 h-3 mr-1.5 text-primary" /> : <Store className="w-3 h-3 mr-1.5 text-primary" />}
                      {session.locationType}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{session.title}</h3>
                  <p className="text-sm text-slate-500 font-medium line-clamp-3 leading-relaxed">
                    {session.notes || "Tidak ada catatan tambahan untuk sesi ini."}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-4">
                  {session.assignedTo && (
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {session.assignedTo.split(",").slice(0, 3).map((_, i) => (
                          <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                            <User className="w-3 h-3" />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-500 truncate">
                        {session.assignedTo}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(session.startedAt), 'MMM d, yyyy')}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateSessionDialog({
  open,
  onOpenChange,
  currentLocationType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocationType: string;
}) {
  const createSession = useCreateSession();
  const { data: staffList } = useStaff();
  const { data: motivationList } = useMotivation();
  const { role } = useRole();

  const [step, setStep] = useState<"staff" | "details">("staff");
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>(currentLocationType);

  const activeMotivation = useMemo(() => {
    const active = (motivationList || []).filter((m: MotivationMessage) => m.active === 1);
    if (active.length === 0) return null;
    return active[Math.floor(Math.random() * active.length)];
  }, [motivationList, open]);

  const filteredStaff = useMemo(() => {
    if (!staffList) return [];
    return (staffList as StaffMember[]).filter(
      (s) => s.active === 1 && s.locationType === selectedLocation
    );
  }, [staffList, selectedLocation]);

  const showLocationSelect = role === "admin" || role === "sku_manager" || role === "stock_counter";

  const form = useForm<z.infer<typeof sessionFormSchema>>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      title: "",
      notes: "",
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => {
        setStep("staff");
        setSelectedStaff([]);
        setSelectedLocation(currentLocationType);
        form.reset();
      }, 500);
    }
    onOpenChange(newOpen);
  };

  const onSubmit = (data: z.infer<typeof sessionFormSchema>) => {
    const staffNames = filteredStaff
      .filter((s) => selectedStaff.includes(String(s.id)))
      .map(s => s.name)
      .join(", ");

    createSession.mutate(
      {
        ...data,
        locationType: selectedLocation,
        startedByName: staffNames.split(", ")[0] || "",
        assignedTo: staffNames,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      }
    );
  };

  const toggleStaff = (id: string) => {
    setSelectedStaff(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 text-white rounded-2xl h-14 px-10 font-black shadow-xl shadow-slate-200 hover:scale-105 transition-transform active:scale-95">
          <Plus className="w-5 h-5 mr-3" />
          Mulai Opname
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl rounded-[40px] border-white/20 shadow-2xl p-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-500" />
        
        {step === "staff" ? (
          <div className="space-y-8">
            <div className="space-y-2">
              <DialogHeader>
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-1">
                   <Sparkles className="w-4 h-4" />
                   Setup Tim Auditor
                </div>
                <DialogTitle className="text-3xl font-black text-slate-900">Siapa yang bertugas hari ini?</DialogTitle>
                <p className="text-slate-500 font-medium leading-relaxed">Pilih lokasi dan petugas yang akan bertanggung jawab melakukan perhitungan stok.</p>
              </DialogHeader>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
              <div className="lg:col-span-5 space-y-6">
                {activeMotivation && (
                  <div className="bg-slate-50 rounded-3xl p-6 border border-white italic text-slate-500 text-sm font-medium relative">
                     "{activeMotivation.message}"
                     <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center border text-primary">
                        ✨
                     </div>
                  </div>
                )}

                {showLocationSelect && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Lokasi Kerja</label>
                    <Select
                      value={selectedLocation}
                      onValueChange={(val) => {
                        setSelectedLocation(val);
                        setSelectedStaff([]);
                      }}
                    >
                      <SelectTrigger className="h-16 bg-white/50 border-white/40 rounded-2xl shadow-sm text-lg font-black text-slate-800 focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-white shadow-2xl p-1">
                        <SelectItem value="toko" className="rounded-xl h-12 font-bold mb-1">
                           <div className="flex items-center gap-3">
                              <Store className="w-5 h-5 text-primary" />
                              Area Outlet / Toko
                           </div>
                        </SelectItem>
                        <SelectItem value="gudang" className="rounded-xl h-12 font-bold">
                           <div className="flex items-center gap-3">
                              <Warehouse className="w-5 h-5 text-primary" />
                              Main Warehouse / Gudang
                           </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Petugas Kazana ({filteredStaff.length})</label>
                 <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto pr-3 custom-scrollbar p-1">
                    {filteredStaff.length === 0 ? (
                      <div className="p-12 border-2 border-dashed border-slate-100 rounded-3xl text-center flex flex-col items-center justify-center shrink-0">
                         <User className="w-10 h-10 text-slate-200 mb-4" />
                         <p className="text-slate-400 font-bold">Petugas tidak tersedia</p>
                      </div>
                    ) : (
                      filteredStaff.map((staff) => (
                        <div
                          key={staff.id}
                          className={cn(
                            "flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer group shrink-0",
                            selectedStaff.includes(String(staff.id))
                              ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                              : "bg-white border-white/60 hover:border-slate-300"
                          )}
                          onClick={() => toggleStaff(String(staff.id))}
                        >
                          <Checkbox
                            checked={selectedStaff.includes(String(staff.id))}
                            className="h-6 w-6 rounded-lg border-slate-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-black text-slate-800 leading-none mb-1">{staff.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Inventory Auditor</p>
                          </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
               <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} className="h-14 px-8 rounded-2xl font-bold text-slate-400">
                  Kembali
               </Button>
               <Button 
                disabled={selectedStaff.length === 0} 
                onClick={() => setStep("details")} 
                className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-black shadow-xl shadow-slate-200 hover:scale-105 transition-transform active:scale-95"
               >
                  Lanjutkan
                  <ChevronRight className="w-5 h-5 ml-2" />
               </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-1">
                 <ClipboardList className="w-4 h-4" />
                 Detail Informasi Sesi
              </div>
              <DialogTitle className="text-3xl font-black text-slate-900">Beri Nama Sesi Anda</DialogTitle>
              <p className="text-slate-500 font-medium">Beri judul yang jelas agar mudah dilacak di laporan keuangan nantinya.</p>
            </DialogHeader>

            <div className="bg-slate-900/5 rounded-3xl p-6 border border-white space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Lokasi terpilih</span>
                  <Badge variant="outline" className="bg-white text-primary border-primary/20 font-black tracking-tight px-4 py-1.5 rounded-full">
                     {selectedLocation === "gudang" ? "WAREHOUSE" : "OUTLET TOKO"}
                  </Badge>
               </div>
               <div className="flex items-center justify-between pt-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tim Auditor</span>
                  <div className="flex flex-wrap gap-2 justify-end max-w-xs">
                      {filteredStaff.filter(s => selectedStaff.includes(String(s.id))).map((s, i, arr) => (
                        <React.Fragment key={s.id}>
                          <span className="text-xs font-black text-slate-700">{s.name}</span>
                          {i < arr.length - 1 && <span className="text-slate-300">|</span>}
                        </React.Fragment>
                      ))}
                  </div>
               </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Sesi (Contoh: Opname Bulanan Q2)</FormLabel>
                      <FormControl>
                        <Input placeholder="Tulis judul sesi di sini..." className="h-16 bg-white border-slate-200 rounded-2xl text-lg font-black text-slate-800 placeholder:text-slate-200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Tambahan (Opsional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Misal: Fokus pada kategori minuman..." className="bg-white border-slate-200 rounded-2xl min-h-[120px] p-5 font-medium text-slate-600" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between gap-3 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setStep("staff")} className="h-14 px-8 rounded-2xl font-bold text-slate-400">
                    Kembali
                  </Button>
                  <Button type="submit" disabled={createSession.isPending} className="h-14 px-12 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-200 hover:scale-105 transition-transform active:scale-95">
                    {createSession.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Mulai Sesi Sekarang"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GDriveSettingsDialog() {
  const { roleData, refetch } = useRole();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteName, setRemoteName] = useState(roleData?.gDriveRemote || "gdrive");

  useMemo(() => {
    if (open && roleData?.gDriveRemote) {
      setRemoteName(roleData.gDriveRemote);
    }
  }, [open, roleData]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/gdrive-remote", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remoteName }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      await refetch();
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-14 h-14 bg-white/40 backdrop-blur rounded-2xl border border-white/60 text-slate-400 hover:text-primary transition-all shadow-sm">
          <Settings className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[40px] border-white/20 shadow-2xl p-10">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-1">
             <Settings className="w-4 h-4" />
             System Configuration
          </div>
          <DialogTitle className="text-3xl font-black text-slate-900">Google Drive Sync</DialogTitle>
          <p className="text-slate-500 font-medium">Pengaturan remote Rclone untuk backup data otomatis ke Google Drive.</p>
        </DialogHeader>
        
        <div className="space-y-6 pt-6">
          <div className="p-6 bg-slate-50 rounded-3xl border border-white text-slate-600 text-sm leading-relaxed font-medium">
             Tentukan nama <span className="text-primary font-black">rclone remote</span> yang terkonfigurasi di server Anda. Backup foto opname akan dikirimkan ke remote ini.
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nama Remote (Default: gdrive)</label>
            <Input
              value={remoteName}
              onChange={(e) => setRemoteName(e.target.value)}
              className="h-16 bg-white border-slate-200 rounded-2xl text-lg font-black text-slate-800"
            />
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-200">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Simpan Pengaturan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
