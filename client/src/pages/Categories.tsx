import { useState } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-products";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Search, Layers, Loader2, ArrowLeft, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategorySchema } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8 animate-enter pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-border/50 shadow-xl shadow-gray-900/5">
        <div className="flex items-center gap-4">
          <Link href="/master">
            <Button variant="ghost" size="icon" className="rounded-2xl bg-white hover:bg-slate-50 border border-border/50 shadow-sm transition-transform active:scale-90">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Katalog Kategori</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium italic">Kelola pengelompokan produk secara cerdas.</p>
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
            <Button className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{editingCategory ? "Ubah Kategori" : "Kategori Baru"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nama Kategori</FormLabel>
                      <FormControl>
                        <Input placeholder="Cth: Makanan, Minuman, Elektronik" {...field} className="rounded-xl bg-slate-50 border-none h-11 focus:ring-4 focus:ring-primary/10 transition-all" />
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
                      <FormLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Diskripsi (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Berikan penjelasan singkat..." {...field} className="rounded-xl bg-slate-50 border-none h-11 focus:ring-4 focus:ring-primary/10 transition-all" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full rounded-2xl h-12 font-black text-sm" disabled={createCategory.isPending || updateCategory.isPending}>
                    {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingCategory ? "SIMPAN PERUBAHAN" : "SIMPAN KATEGORI"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div className="relative group max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Cari kategori produk..." 
            className="pl-11 bg-white border border-border/50 rounded-2xl h-12 shadow-sm focus:ring-4 focus:ring-primary/5 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="rounded-3xl border-border/30 bg-white/50 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredCategories?.map((cat) => (
              <Card key={cat.id} className="rounded-3xl border-border/50 bg-white/70 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 group relative overflow-hidden hover:shadow-2xl hover:shadow-gray-900/5 hover:-translate-y-1">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 scale-100 group-hover:scale-110">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-black text-sm tracking-tight block text-foreground">{cat.name}</span>
                      {cat.description && <span className="text-[10px] font-bold text-muted-foreground line-clamp-1 uppercase tracking-wider mt-0.5">{cat.description}</span>}
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 bg-white/95 backdrop-blur-lg">
                      <DropdownMenuItem className="rounded-xl px-4 py-2 font-bold text-xs" onClick={() => {
                        setEditingCategory(cat);
                        form.reset({ name: cat.name, description: cat.description || "" });
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
                            <AlertDialogTitle className="text-xl font-black">Hapus Kategori?</AlertDialogTitle>
                            <AlertDialogDescription className="font-medium">
                              Tindakan ini tidak dapat dibatalkan. Kategori <strong className="text-foreground">{cat.name}</strong> akan dihapus permanen dari sistem.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="pt-4">
                            <AlertDialogCancel className="rounded-2xl border-border/50 bg-slate-50 font-bold">Batal</AlertDialogCancel>
                            <AlertDialogAction 
                              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black"
                              onClick={() => deleteCategory.mutate(cat.id)}
                            >
                              {deleteCategory.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "HAPUS PERMANEN"}
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
              <div className="col-span-full py-20 text-center animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50">
                   <Layers className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-xl font-black">Kategori Tidak Ketemu</h3>
                <p className="text-muted-foreground text-sm font-medium mt-1">Coba kata kunci lain atau buat kategori baru.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
