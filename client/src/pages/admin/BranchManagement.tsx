import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { Branch } from "@shared/schema";
import { 
  Building2, 
  Plus, 
  MapPin, 
  Warehouse, 
  Store, 
  Factory, 
  MoreVertical, 
  Pencil, 
  Trash2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function BranchManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: [api.branches.list.path],
  });

  const createMutation = useMutation({
    mutationFn: async (branch: any) => {
      const res = await fetch(api.branches.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branch),
      });
      if (!res.ok) throw new Error("Gagal membuat cabang");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.branches.list.path] });
      toast({ title: "Berhasil", description: "Cabang baru telah ditambahkan" });
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(buildUrl(api.branches.update.path, { id }), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui cabang");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.branches.list.path] });
      toast({ title: "Berhasil", description: "Cabang telah diperbarui" });
      setIsDialogOpen(false);
      setEditingBranch(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.branches.delete.path, { id }), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Gagal menghapus cabang");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.branches.list.path] });
      toast({ title: "Berhasil", description: "Cabang telah dihapus" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      address: formData.get("address"),
      type: formData.get("type"),
    };

    if (editingBranch) {
      updateMutation.mutate({ id: editingBranch.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "warehouse": return <Warehouse className="w-5 h-5 text-amber-500" />;
      case "factory": return <Factory className="w-5 h-5 text-blue-500" />;
      default: return <Store className="w-5 h-5 text-emerald-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Manajemen Cabang</h1>
          <p className="text-gray-500 mt-1">Kelola gudang, toko, dan lokasi distribusi bisnis Anda.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingBranch(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-lg shadow-blue-200 border-0 rounded-xl px-6">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Cabang
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBranch ? "Edit Cabang" : "Tambah Cabang Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Cabang</Label>
                <Input id="name" name="name" defaultValue={editingBranch?.name || ""} placeholder="Contoh: Toko Pusat Jakarta" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipe Lokasi</Label>
                <Select name="type" defaultValue={editingBranch?.type || "store"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store">Toko (Retail)</SelectItem>
                    <SelectItem value="warehouse">Gudang (Logistik)</SelectItem>
                    <SelectItem value="factory">Pabrik (Produksi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Input id="address" name="address" defaultValue={editingBranch?.address || ""} placeholder="Alamat cabang..." />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingBranch ? "Simpan Perubahan" : "Terbitkan Cabang"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <Card key={branch.id} className="group relative overflow-hidden border-0 shadow-xl shadow-blue-900/5 bg-white/80 backdrop-blur-md hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 rounded-3xl">
            <div className="absolute top-0 right-0 p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-gray-100">
                  <DropdownMenuItem onClick={() => {
                    setEditingBranch(branch);
                    setIsDialogOpen(true);
                  }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => {
                    if (confirm("Hapus cabang ini?")) deleteMutation.mutate(branch.id);
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                {getIcon(branch.type || "store")}
              </div>
              <div>
                <CardTitle className="text-lg font-bold">{branch.name}</CardTitle>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                  {branch.type || "store"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 text-sm text-gray-500 min-h-[40px]">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="line-clamp-2">{branch.address || "Alamat belum diatur"}</p>
              </div>
            </CardContent>
          </Card>
        ))}

        {branches.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Belum ada cabang</h3>
            <p className="text-gray-500">Mulai tambahkan lokasi pertama Anda untuk mengaktifkan fitur transfer antar-gudang.</p>
          </div>
        )}
      </div>
    </div>
  );
}
