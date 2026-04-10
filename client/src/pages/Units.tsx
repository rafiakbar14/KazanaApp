import { useState } from "react";
import { useUnits, useCreateUnit, useUpdateUnit, useDeleteUnit } from "@/hooks/use-products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/master">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Satuan Barang (UoM)</h1>
            <p className="text-muted-foreground mt-1 text-sm">Kelola satuan ukur untuk produk Anda.</p>
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
            <Button className="rounded-xl" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Satuan
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingUnit ? "Edit Satuan" : "Tambah Satuan Baru"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Satuan</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: PCS, Box, Kg, Liter" {...field} className="rounded-xl bg-slate-50" />
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
                      <FormLabel>Deskripsi (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Penjelasan singkat satuan" {...field} className="rounded-xl bg-slate-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full rounded-xl" disabled={createUnit.isPending || updateUnit.isPending}>
                    {(createUnit.isPending || updateUnit.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingUnit ? "Simpan Perubahan" : "Simpan Satuan"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari satuan..." 
              className="pl-9 bg-slate-50 border-none rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredUnits?.map((unit) => (
                <Card key={unit.id} className="hover:border-primary/50 transition-colors group relative overflow-hidden">
                  <CardContent className="p-4 flex flex-col items-center gap-3 relative">
                    <div className="absolute top-1 right-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => {
                            setEditingUnit(unit);
                            form.reset({ name: unit.name, description: unit.description || "" });
                          }}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Satuan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Satuan <strong>{unit.name}</strong> akan dihapus selamanya.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                  className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteUnit.mutate(unit.id)}
                                >
                                  {deleteUnit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus Satuan"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                      <Weight className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="font-bold text-sm tracking-widest block">{unit.name}</span>
                      {unit.description && <span className="text-[10px] text-muted-foreground line-clamp-1">{unit.description}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {!isLoading && filteredUnits?.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <Weight className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Tidak ada satuan ditemukan.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
