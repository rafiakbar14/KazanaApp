import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useRole } from "@/hooks/use-role";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Plus, AlertCircle, KeyRound } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLocation } from "wouter";

type UserWithRole = {
  id: number;
  userId: string;
  role: string;
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  adminId?: string | null;
  branchId?: number | null;
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  sku_manager: "SKU Manager",
  stock_counter: "Stock Counter",
  cashier: "Cashier / Kasir",
  production: "Production / Dapur",
  driver: "Driver / Tim Kirim",
};

const roleBadgeColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  sku_manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  stock_counter: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cashier: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  production: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  driver: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

export default function RoleManagement() {
  const { isAdmin, isLoading: roleLoading } = useRole();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: users, isLoading } = useQuery<UserWithRole[]>({
    queryKey: [api.roles.list.path],
    queryFn: async () => {
      const res = await fetch(api.roles.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: isAdmin,
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(api.roles.set.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update role");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.roles.list.path] });
      toast({ title: "Role Diperbarui", description: "Role user berhasil diubah." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateBranch = useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: number }) => {
      const res = await fetch("/api/admin/user/branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, branchId }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update branch");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.roles.list.path] });
      toast({ title: "Cabang Diperbarui", description: "Cabang penugasan user berhasil diubah." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (roleLoading || isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    setLocation("/");
    return null;
  }

  const subUsers = users?.filter(u => u.adminId !== null) || [];
  const adminUser = users?.find(u => u.adminId === null);

  return (
    <div className="space-y-8 animate-enter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            User Roles
          </h1>
          <p className="text-muted-foreground mt-2">Kelola user dan akses tim Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="rounded-xl border-primary/20 text-primary hover:bg-primary/5"
            onClick={() => setLocation("/admin/logs")}
            data-testid="button-view-logs"
          >
            <History className="w-4 h-4 mr-2" />
            Audit Log
          </Button>
          <CreateUserDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="px-6 py-4 font-medium text-muted-foreground">User</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Tipe</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Cabang</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Role Saat Ini</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Ubah Role</th>
                <th className="px-6 py-4 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {adminUser && (
                <tr className="bg-muted/10" data-testid={`row-user-${adminUser.userId}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white text-xs font-bold">
                          {getInitials(adminUser)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium text-foreground block">
                          {adminUser.firstName && adminUser.lastName ? `${adminUser.firstName} ${adminUser.lastName}` : adminUser.username || "-"}
                        </span>
                        {adminUser.username && (
                          <span className="text-xs text-muted-foreground">@{adminUser.username}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary">Owner</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="text-[10px] font-bold bg-slate-50">PUSAT / HQ</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={roleBadgeColors[adminUser.role] || ""} data-testid={`badge-role-${adminUser.userId}`}>
                      {roleLabels[adminUser.role] || adminUser.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">-</td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">-</td>
                </tr>
              )}
              {subUsers.map((user) => (
                <tr key={user.userId} className="hover:bg-muted/20 transition-colors" data-testid={`row-user-${user.userId}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white text-xs font-bold">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medium text-foreground block">
                          {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "-"}
                        </span>
                        {user.username && (
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline">Anggota</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={user.branchId?.toString() || "1"}
                      onValueChange={(value) => updateBranch.mutate({ userId: user.userId, branchId: parseInt(value) })}
                    >
                      <SelectTrigger className="w-40 border-primary/20 bg-primary/5 text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-border shadow-xl">
                        <SelectItem value="1">Cabang 1 (Utama)</SelectItem>
                        <SelectItem value="2">Cabang 2</SelectItem>
                        <SelectItem value="3">Cabang 3</SelectItem>
                        <SelectItem value="4">Cabang 4</SelectItem>
                        <SelectItem value="5">Cabang 5</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={roleBadgeColors[user.role] || ""} data-testid={`badge-role-${user.userId}`}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Select
                      value={user.role}
                      onValueChange={(value) => updateRole.mutate({ userId: user.userId, role: value })}
                    >
                      <SelectTrigger className="w-40" data-testid={`select-role-${user.userId}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-border shadow-xl">
                        <SelectItem value="sku_manager">SKU Manager</SelectItem>
                        <SelectItem value="stock_counter">Stock Counter</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <SetPinButton userId={user.userId} userName={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "User"} />
                      <ResetPasswordButton userId={user.userId} userName={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || "User"} />
                    </div>
                  </td>
                </tr>
              ))}
              {subUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada anggota tim. Klik "Tambah User" untuk membuat user baru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-muted/30 border border-border/50 rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-foreground">Keterangan Role</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Admin (Owner)</strong> - Akses penuh: kelola produk, sesi, dan user tim</p>
          <p><strong className="text-foreground">SKU Manager</strong> - Bisa membuat, edit, dan hapus produk/SKU. Tidak bisa kelola sesi atau role</p>
          <p><strong className="text-foreground">Stock Counter</strong> - Bisa membuat dan mengisi sesi stock opname untuk Toko dan Gudang</p>
          <p><strong className="text-foreground">Cashier</strong> - Petugas penjualan (Akses modul POS Kasir, buka/tutup shift)</p>
          <p><strong className="text-foreground">Production</strong> - Tim dapur/pabrik (Akses modul daftar tugas produksi & perakitan)</p>
          <p><strong className="text-foreground">Driver</strong> - Tim pengiriman (Akses modul logistik & transfer barang)</p>
        </div>
      </div>
    </div>
  );
}

function getInitials(user: UserWithRole): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  return (user.username || "U").substring(0, 2).toUpperCase();
}

function ResetPasswordButton({ userId, userName }: { userId: string; userName: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const resetPassword = useMutation({
    mutationFn: async (data: { userId: string; newPassword: string }) => {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal reset password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password Direset", description: `Password ${userName} berhasil diubah.` });
      setOpen(false);
      setNewPassword("");
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    resetPassword.mutate({ userId, newPassword });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setNewPassword(""); setError(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-reset-password-${userId}`}>
          <KeyRound className="w-4 h-4 mr-1.5" />
          Reset Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Reset Password - {userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="text-reset-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password Baru</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              data-testid="input-reset-password"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={resetPassword.isPending} data-testid="button-submit-reset">
              {resetPassword.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset Password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("stock_counter");
  const [branchId, setBranchId] = useState("1");
  const [error, setError] = useState("");

  const createUser = useMutation({
    mutationFn: async (data: { username: string; password: string; firstName: string; lastName: string; role: string; branchId: number }) => {
      const res = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal membuat user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.roles.list.path] });
      toast({ title: "User Dibuat", description: "User baru berhasil ditambahkan ke tim." });
      onOpenChange(false);
      setUsername("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setRole("stock_counter");
      setBranchId("1");
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    createUser.mutate({ username, password, firstName, lastName, role });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-user">
          <Plus className="w-4 h-4 mr-2" />
          Tambah User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Tambah User Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="text-create-user-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Depan</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nama depan"
                data-testid="input-new-first-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Belakang</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Nama belakang"
                data-testid="input-new-last-name"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              data-testid="input-new-username"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              data-testid="input-new-password"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger data-testid="select-new-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-xl">
                <SelectItem value="sku_manager">SKU Manager</SelectItem>
                <SelectItem value="stock_counter">Stock Counter</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Cabang Tugas</label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger data-testid="select-new-branch">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-xl">
                <SelectItem value="1">Cabang 1 (Utama)</SelectItem>
                <SelectItem value="2">Cabang 2</SelectItem>
                <SelectItem value="3">Cabang 3</SelectItem>
                <SelectItem value="4">Cabang 4</SelectItem>
                <SelectItem value="5">Cabang 5</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">User hanya bisa melihat data Stock Opname di cabang pilihannya.</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" disabled={createUser.isPending} data-testid="button-submit-new-user">
              {createUser.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Buat User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SetPinButton({ userId, userName }: { userId: string; userName: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const updatePin = useMutation({
    mutationFn: async (data: { userId: string; pin: string }) => {
      const res = await fetch("/api/admin/user/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal mengatur PIN");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "PIN Diatur", description: `PIN POS untuk ${userName} berhasil diperbarui.` });
      setOpen(false);
      setPin("");
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError("PIN harus 6 digit angka");
      return;
    }
    setError("");
    updatePin.mutate({ userId, pin });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPin(""); setError(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-primary/20 hover:border-primary/50 text-primary" data-testid={`button-set-pin-${userId}`}>
          <Shield className="w-4 h-4 mr-1.5" />
          Set PIN POS
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Atur PIN POS - {userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">PIN Baru (6 Digit Angka)</label>
            <Input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="Masukkan 6 digit angka"
              required
              data-testid="input-set-pin"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={updatePin.isPending} data-testid="button-submit-pin">
              {updatePin.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan PIN
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
