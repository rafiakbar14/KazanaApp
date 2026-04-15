import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Supplier } from "@shared/schema";
import { 
  Users, 
  Plus, 
  Search, 
  Building2,
  Mail,
  Phone,
  MapPin,
  MoreVertical,
  Loader2,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Suppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: [api.procurement.suppliers.list.path],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.procurement.suppliers.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal menyimpan data supplier");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.procurement.suppliers.list.path] });
      toast({ title: "Berhasil", description: "Data supplier telah disimpan." });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const url = api.procurement.suppliers.update.path.replace(':id', id.toString());
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal mengupdate data supplier");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.procurement.suppliers.list.path] });
      toast({ title: "Berhasil", description: "Data supplier telah diperbarui." });
      closeDialog();
    },
  });

  const openDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setName(supplier.name);
      setContactPerson(supplier.contactPerson || "");
      setEmail(supplier.email || "");
      setPhone(supplier.phone || "");
      setAddress(supplier.address || "");
    } else {
      setEditingSupplier(null);
      setName("");
      setContactPerson("");
      setEmail("");
      setPhone("");
      setAddress("");
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSupplier(null);
  };

  const handleSubmit = () => {
    const data = { name, contactPerson, email, phone, address };
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-2xl">
            <Building2 className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Data Supplier</h1>
            <p className="text-gray-500 mt-1">Kelola data vendor dan pemasok barang Anda.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              className="pl-10 w-[250px] rounded-xl border-gray-200" 
              placeholder="Cari nama supplier..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 rounded-xl px-6 shadow-xl shadow-purple-200"
            onClick={() => openDialog()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Supplier
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} className="border-0 shadow-xl shadow-purple-900/5 rounded-3xl overflow-hidden group hover:shadow-purple-900/10 transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-purple-50 transition-colors">
                    <Building2 className="w-6 h-6 text-gray-400 group-hover:text-purple-600" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-purple-600" onClick={() => openDialog(supplier)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1">{supplier.name}</h3>
                {supplier.contactPerson && (
                  <p className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
                    <Users className="w-3 h-3" /> PIC: {supplier.contactPerson}
                  </p>
                )}
                
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                  {supplier.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-6 flex justify-center"><Phone className="w-3.5 h-3.5 text-gray-400" /></div>
                      <span className="truncate">{supplier.phone}</span>
                    </div>
                  )}
                  {supplier.email && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="w-6 flex justify-center"><Mail className="w-3.5 h-3.5 text-gray-400" /></div>
                      <span className="truncate">{supplier.email}</span>
                    </div>
                  )}
                  {supplier.address && (
                    <div className="flex items-start gap-3 text-sm text-gray-600">
                      <div className="w-6 flex justify-center mt-0.5"><MapPin className="w-3.5 h-3.5 text-gray-400" /></div>
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingSupplier ? 'Edit Supplier' : 'Supplier Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nama Perusahaan / Supplier *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: PT. Sumber Makmur" />
            </div>
            <div className="space-y-2">
              <Label>Contact Person (PIC)</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Contoh: Budi Santoso" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor Telepon</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0812..." />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@perusahaan.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alamat Lengkap</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Raya Kemerdekaan No. 123" />
            </div>
            
            <Button 
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 rounded-xl mt-4"
              disabled={!name || createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit}
            >
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin" /> : 'Simpan Data Supplier'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
