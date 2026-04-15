import { useState } from "react";
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/use-products";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Search, Weight, Loader2, ArrowLeft, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUnitSchema } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Units() {
  const { data: units, isLoading } = useUnits();
  const createUnit = useCreateUnit();
  const updateUnit = useUpdateUnit();
  const deleteUnit = useDeleteUnit();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(insertUnitSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: any) => {
    if (editingUnit) {
      await updateUnit.mutateAsync({ id: editingUnit.id, ...data });
      setEditingUnit(null);
    } else {
      await createUnit.mutateAsync(data);
      setIsCreateOpen(false);
    }
    form.reset();
  };

  const filteredUnits = units?.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-enter pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-amber-50/50 backdrop-blur-md p-8 rounded-3xl border border-amber-100 shadow-xl shadow-amber-900/5">
        <div className="flex items-center gap-4">
          <Link href="/master">
            <Button variant="ghost" size="icon" className="rounded-2xl bg-white hover:bg-amber-100 border border-amber-200/50 shadow-sm transition-transform active:scale-90">
              <ArrowLeft className="w-5 h-5 text-amber-700" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-amber-900">Satuan Barang (UoM)</h1>
            <p className="text-amber-700/70 mt-1 text-sm font-medium italic">Kelola unit pengukuran untuk akurasi inventaris.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen || !!editingUnit} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingUnit(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl h-12 px-6 font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200 transition-all" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Tambah Satuan
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-amber-900">{editingUnit ? "Ubah Satuan" : "Satuan Baru"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-amber-700/60">Nama Satuan</FormLabel>
                      <FormControl>
                        <Input placeholder="Cth: PCS, BOX, KG, LITER" {...field} className="rounded-xl bg-amber-50/50 border-amber-100 h-11 focus:ring-4 focus:ring-amber-500/10 transition-all font-bold uppercase tracking-widest" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-amber-700/60">Diskripsi (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Detail penggunaan satuan ini..." {...field} className="rounded-xl bg-amber-50/50 border-amber-100 h-11 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full rounded-2xl h-12 font-black text-sm bg-amber-600 hover:bg-amber-700" disabled={createUnit.isPending || updateUnit.isPending}>
                    {(createUnit.isPending || updateUnit.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingUnit ? "SIMPAN PERUBAHAN" : "SIMPAN SATUAN"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-700/40 group-focus-within:text-amber-600 transition-colors" />
          <Input 
            placeholder="Cari unit (PCS, BOX, ...)" 
            className="pl-11 bg-white border border-amber-100 rounded-2xl h-12 shadow-sm focus:ring-4 focus:ring-amber-500/5 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="rounded-3xl border-amber-100 bg-amber-50/30 animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredUnits?.map((unit) => (
              <Card key={unit.id} className="rounded-3xl border-amber-100 bg-white/70 backdrop-blur-sm hover:border-amber-400/50 transition-all duration-300 group relative overflow-hidden hover:shadow-2xl hover:shadow-amber-900/5 hover:-translate-y-1">
                <CardContent className="p-6 flex flex-col items-center gap-4 relative">
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-100">
                          <MoreVertical className="w-3.5 h-3.5 text-amber-700" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 bg-white/95 backdrop-blur-lg">
                        <DropdownMenuItem className="rounded-xl px-4 py-2 font-bold text-xs" onClick={() => {
                          setEditingUnit(unit);
                          form.reset({ name: unit.name, description: unit.description || "" });
                        }}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          UBAH
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-xl px-4 py-2 font-bold text-xs text-destructive focus:text-destructive focus:bg-destructive/5">
                              <Trash2 className="w-4 h-4 mr-2" />
                              HAPUS
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl font-black">Hapus Satuan?</AlertDialogTitle>
                              <AlertDialogDescription className="font-medium">
                                Tindakan ini tidak dapat dibatalkan. Satuan <strong className="text-foreground uppercase">{unit.name}</strong> akan dihapus permanen.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="pt-4">
                              <AlertDialogCancel className="rounded-2xl border-border/50 bg-slate-50 font-bold">Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black"
                                onClick={() => deleteUnit.mutate(unit.id)}
                              >
                                {deleteUnit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "HAPUS"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 scale-100 group-hover:scale-110 shadow-inner">
                    <Weight className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <span className="font-black text-sm tracking-widest block text-amber-900 uppercase">{unit.name}</span>
                    {unit.description && <span className="text-[10px] font-bold text-amber-700/50 line-clamp-1 uppercase tracking-tighter mt-1">{unit.description}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {!isLoading && filteredUnits?.length === 0 && (
              <div className="col-span-full py-20 text-center animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 bg-amber-50/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100">
                   <Weight className="w-10 h-10 text-amber-200" />
                </div>
                <h3 className="text-xl font-black text-amber-900">Satuan Tidak Ditemukan</h3>
                <p className="text-amber-700/60 text-sm font-medium mt-1">Coba kata kunci lain atau buat satuan baru.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
