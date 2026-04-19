import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Loader2 } from "lucide-react";

interface CustomerDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (customer: any) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CustomerDialog({ trigger, onSuccess, open, onOpenChange }: CustomerDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);

  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(api.pos.customers.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal menyimpan data pelanggan");
      }
      return res.json();
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: [api.pos.customers.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.crm.customers.listWithStats.path] });
      toast({
        title: "Berhasil",
        description: `Pelanggan ${newCustomer.name} berhasil didaftarkan.`,
      });
      setFormData({ name: "", phone: "", email: "" });
      setOpen(false);
      if (onSuccess) onSuccess(newCustomer);
    },
    onError: (err: Error) => {
      toast({
        title: "Gagal",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    createCustomerMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-indigo-600" />
            Daftarkan Pelanggan Baru
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                placeholder="Contoh: Budi Santoso"
                className="rounded-xl h-12"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                placeholder="Contoh: 08123456789"
                className="rounded-xl h-12"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="budi@example.com"
                className="rounded-xl h-12"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-12 px-6"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-xl h-12 px-8 bg-indigo-600 hover:bg-indigo-700"
              disabled={createCustomerMutation.isPending}
            >
              {createCustomerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Daftarkan Sekarang"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
