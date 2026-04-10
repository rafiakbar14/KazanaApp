import { useState } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl,FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Search, Layers, Loader2, ArrowLeft, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Categories() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const form = useForm({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: any) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...data });
      setEditingCategory(null);
    } else {
      await createCategory.mutateAsync(data);
      setIsCreateOpen(false);
    }
    form.reset();
  };

  const filteredCategories = categories?.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase())
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
            <h1 className="text-3xl font-bold tracking-tight">Manajemen Kategori</h1>
            <p className="text-muted-foreground mt-1 text-sm">Kelola kategori produk untuk pengelompokan yang lebih baik.</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen || !!editingCategory} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingCategory(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Kategori</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Makanan, Minuman, Elektronik" {...field} className="rounded-xl bg-slate-50" />
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
                        <Input placeholder="Penjelasan singkat kategori" {...field} className="rounded-xl bg-slate-50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full rounded-xl" disabled={createCategory.isPending || updateCategory.isPending}>
                    {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingCategory ? "Simpan Perubahan" : "Simpan Kategori"}
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
              placeholder="Cari kategori..." 
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCategories?.map((cat) => (
                <Card key={cat.id} className="hover:border-primary/50 transition-colors group relative overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-sm tracking-tight block">{cat.name}</span>
                        {cat.description && <span className="text-[10px] text-muted-foreground line-clamp-1">{cat.description}</span>}
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => {
                          setEditingCategory(cat);
                          form.reset({ name: cat.name, description: cat.description || "" });
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
                              <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tindakan ini tidak dapat dibatalkan. Kategori <strong>{cat.name}</strong> akan dihapus selamanya.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteCategory.mutate(cat.id)}
                              >
                                {deleteCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hapus Kategori"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              ))}
              
              {!isLoading && filteredCategories?.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Tidak ada kategori ditemukan.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
