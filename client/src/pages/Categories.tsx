import { useState } from "react";
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/use-products";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Layers, Loader2, ArrowLeft, Edit2, Trash2, Save, X, Download, Upload } from "lucide-react";
import { Link } from "wouter";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Categories() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  
  // Edit state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  
  // New category state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const filteredCategories = categories?.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await updateCategory.mutateAsync({
        id: editingId,
        name: editName,
        description: editDescription,
      });
      setEditingId(null);
      toast({ title: "Berhasil", description: "Kategori berhasil diupdate" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal update kategori", variant: "destructive" });
    }
  };

  const handleCreateNew = async () => {
    if (!newName.trim()) {
      toast({ title: "Error", description: "Nama kategori harus diisi", variant: "destructive" });
      return;
    }
    try {
      await createCategory.mutateAsync({
        name: newName,
        description: newDescription,
      });
      setNewName("");
      setNewDescription("");
      setIsCreating(false);
      toast({ title: "Berhasil", description: "Kategori baru berhasil ditambahkan" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal menambah kategori", variant: "destructive" });
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCategories?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCategories?.map(c => c.id) || []);
    }
  };

  const handleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await deleteCategory.mutateAsync(id);
      }
      setSelectedIds([]);
      toast({ title: "Berhasil", description: `${selectedIds.length} kategori berhasil dihapus` });
    } catch (error) {
      toast({ title: "Error", description: "Gagal menghapus kategori", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-enter pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-border/50 shadow-xl">
        <div className="flex items-center gap-4">
          <Link href="/master">
            <Button variant="ghost" size="icon" className="rounded-2xl bg-white hover:bg-slate-50 border border-border/50 shadow-sm">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Kategori Produk</h1>
            <p className="text-muted-foreground text-sm">Kelola kategori untuk pengelompokan produk</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus ({selectedIds.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus {selectedIds.length} Kategori?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Kategori yang dipilih akan dihapus permanen.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-xl bg-destructive"
                      onClick={handleBulkDelete}
                    >
                      Hapus Semua
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          <Button
            onClick={() => setIsCreating(true)}
            className="rounded-xl h-10 px-4 font-bold shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Kategori
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari kategori..."
            className="pl-10 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === filteredCategories?.length && filteredCategories?.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="font-bold">Nama Kategori</TableHead>
              <TableHead className="font-bold">Deskripsi</TableHead>
              <TableHead className="text-right font-bold w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={4}>
                    <div className="h-12 bg-muted/20 animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <>
                {/* New Category Row */}
                {isCreating && (
                  <TableRow className="bg-blue-50/50 border-l-4 border-l-blue-500">
                    <TableCell>
                      <Layers className="w-5 h-5 text-blue-500" />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Nama kategori..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="h-9 rounded-lg"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateNew();
                          if (e.key === "Escape") {
                            setIsCreating(false);
                            setNewName("");
                            setNewDescription("");
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Deskripsi (opsional)..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        className="h-9 rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateNew();
                          if (e.key === "Escape") {
                            setIsCreating(false);
                            setNewName("");
                            setNewDescription("");
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          onClick={handleCreateNew}
                          disabled={createCategory.isPending}
                          className="h-8 rounded-lg"
                        >
                          {createCategory.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsCreating(false);
                            setNewName("");
                            setNewDescription("");
                          }}
                          className="h-8 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Existing Categories */}
                {filteredCategories?.map((cat) => (
                  editingId === cat.id ? (
                    // Edit Mode
                    <TableRow key={cat.id} className="bg-amber-50/50 border-l-4 border-l-amber-500">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(cat.id)}
                          onCheckedChange={() => handleSelect(cat.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-9 rounded-lg"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="h-9 rounded-lg"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={updateCategory.isPending}
                            className="h-8 rounded-lg"
                          >
                            {updateCategory.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-8 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // View Mode
                    <TableRow key={cat.id} className="hover:bg-muted/20 transition-colors group">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(cat.id)}
                          onCheckedChange={() => handleSelect(cat.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground">{cat.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit(cat)}
                            className="h-8 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Kategori <strong>{cat.name}</strong> akan dihapus permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  className="rounded-xl bg-destructive"
                                  onClick={() => deleteCategory.mutate(cat.id)}
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                ))}

                {/* Empty State */}
                {!isLoading && filteredCategories?.length === 0 && !isCreating && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Layers className="w-10 h-10 text-muted-foreground/20" />
                        <p className="text-muted-foreground font-medium">
                          {search ? "Kategori tidak ditemukan" : "Belum ada kategori"}
                        </p>
                        {!search && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCreating(true)}
                            className="rounded-xl mt-2"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Tambah Kategori Pertama
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
