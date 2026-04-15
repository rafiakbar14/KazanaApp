import { useOutboundSessions, useCreateOutboundSession } from "@/hooks/use-outbound";
import { useBranches } from "@/hooks/use-branches";
import { useRole } from "@/hooks/use-role";
import { Link } from "wouter";
import { Plus, Truck, Calendar, Loader2, ClipboardList, Search, ChevronRight, Sparkles, PackageMinus, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const outboundFormSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  toBranchId: z.string().optional(),
  notes: z.string().optional(),
});

export default function OutboundSessions() {
  const { isAdmin, isSKUManager, isDriver } = useRole();
  const { data: sessions, isLoading } = useOutboundSessions();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const canCreate = isAdmin || isSKUManager || isDriver;

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [sessions, searchQuery]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
            <PackageMinus className="w-4 h-4 text-primary" />
            Logistics & Goods Issue
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Barang Keluar</h1>
            <p className="text-slate-500 font-medium max-w-lg leading-relaxed">Pantau pengiriman stok keluar untuk transfer antar cabang atau pengeluaran umum.</p>
          </div>
        </div>

        <div>
          {canCreate && (
            <CreateOutboundDialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
            />
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[32px] p-3 shadow-2xl shadow-black/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <Input
            placeholder="Cari sesi outbound atau tujuan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-white/50 border-white/20 rounded-2xl font-bold text-slate-700 placeholder:text-slate-300 focus:ring-primary shadow-inner"
          />
        </div>
      </div>

      {/* Grid Section */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 rounded-[40px] bg-white/20 animate-pulse border border-white/40" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[40px] p-20 text-center shadow-2xl shadow-black/5">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-12 h-12 text-slate-200" />
          </div>
          <h3 className="text-2xl font-black text-slate-800">Tanpa Sesi Outbound</h3>
          <p className="text-slate-500 font-medium mt-2 max-w-sm mx-auto mb-8">Belum ada pengeluaran barang yang dicatat atau hasil pencarian tidak ditemukan.</p>
          {canCreate && (
            <Button onClick={() => setIsCreateOpen(true)} className="bg-slate-900 text-white rounded-2xl h-14 px-10 font-black shadow-xl shadow-slate-200 hover:scale-105 transition-transform active:scale-95">
              Mulai Outbound Baru
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSessions.map((session) => (
            <Link key={session.id} href={`/outbound/${session.id}`}>
              <div className="group relative bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[40px] p-8 shadow-2xl shadow-black/5 transition-all duration-500 hover:-translate-y-2 hover:bg-white/60 hover:shadow-primary/10 cursor-pointer flex flex-col h-full overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:border-primary transition-all duration-500">
                    <Truck className="w-7 h-7 text-slate-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <StatusBadge status={session.status} className="scale-110" />
                    {session.toBranchId && (
                        <Badge variant="outline" className="bg-white/50 text-[10px] font-black uppercase tracking-widest border-white text-primary">
                            TRANSFER
                        </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight group-hover:text-primary transition-colors">{session.title}</h3>
                  <p className="text-sm text-slate-500 font-medium line-clamp-3 leading-relaxed">
                    {session.notes || "Sesi pengiriman stok tanpa catatan tambahan."}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(session.startedAt), 'MMM d, yyyy')}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                    <ArrowRight className="w-5 h-5" />
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

function BranchesOptions() {
  const { data: branches } = useBranches();
  return (
    <>
      <SelectItem value="none" className="rounded-xl h-12 font-bold mb-1 italic text-slate-400">
          Bukan Transfer (Umum)
      </SelectItem>
      {branches?.map(branch => (
        <SelectItem key={branch.id} value={branch.id.toString()} className="rounded-xl h-12 font-bold mb-1">
          <div className="flex items-center gap-3">
             <MapPin className="w-4 h-4 text-primary" />
             {branch.name}
          </div>
        </SelectItem>
      ))}
    </>
  );
}

function CreateOutboundDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createSession = useCreateOutboundSession();
  const form = useForm<z.infer<typeof outboundFormSchema>>({
    resolver: zodResolver(outboundFormSchema),
    defaultValues: {
      title: "",
      toBranchId: "none",
      notes: "",
    },
  });

  const onSubmit = (values: z.infer<typeof outboundFormSchema>) => {
    const data = {
      ...values,
      toBranchId: values.toBranchId && values.toBranchId !== "none" ? Number(values.toBranchId) : undefined
    };
    createSession.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 text-white rounded-2xl h-14 px-10 font-black shadow-xl shadow-slate-200 hover:scale-105 transition-transform active:scale-95">
          <Plus className="w-5 h-5 mr-3" />
          Outbound Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[40px] border-white/20 shadow-2xl p-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-orange-500" />
        
        <div className="space-y-8">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              Barang Keluar
            </div>
            <DialogTitle className="text-3xl font-black text-slate-900">Mulai Pengiriman</DialogTitle>
            <p className="text-slate-500 font-medium leading-relaxed">Catat pengiriman stok keluar untuk mutasi antar cabang atau keperluan internal lainnya.</p>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Pengiriman / Tujuan</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Kiriman Outlet B - Malioboro" className="h-16 bg-white border-slate-200 rounded-2xl text-lg font-black text-slate-800 placeholder:text-slate-200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="toBranchId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cabang Tujuan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-16 bg-white/50 border-white/40 rounded-2xl shadow-sm font-black text-slate-800 focus:ring-primary">
                          <SelectValue placeholder="Pilih Cabang (Opsional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl border-white shadow-2xl p-1">
                        <BranchesOptions />
                      </SelectContent>
                    </Select>
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
                      <Textarea placeholder="Nomor surat jalan, dsb..." className="bg-white border-slate-200 rounded-2xl min-h-[120px] p-5 font-medium text-slate-600" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-14 px-8 rounded-2xl font-bold text-slate-400">
                  Batal
                </Button>
                <Button type="submit" disabled={createSession.isPending} className="h-14 px-12 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-200 hover:scale-105 transition-transform active:scale-95">
                  {createSession.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Mulai Sesi"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
