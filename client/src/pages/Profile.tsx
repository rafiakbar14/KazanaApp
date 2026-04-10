import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Loader2, AlertCircle, CheckCircle2, ImagePlus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@shared/routes";
import { Settings } from "@shared/schema";

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateProfile = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Gagal memperbarui profil");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profil Diperbarui", description: "Data profil berhasil disimpan." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const isAdmin = user && !user.adminId;

  const { data: settings } = useQuery<Settings>({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      if (!res.ok) throw new Error("Gagal mengambil pengaturan toko");
      return res.json();
    },
    enabled: !!isAdmin,
  });

  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeLogo, setStoreLogo] = useState("");

  useEffect(() => {
    if (settings) {
      setStoreName((settings as any).storeName || "Kazana Shop");
      setStoreAddress((settings as any).storeAddress || "");
      setStorePhone((settings as any).storePhone || "");
      setStoreLogo((settings as any).storeLogo || "");
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      const res = await fetch(api.settings.update.path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal memperbarui pengaturan toko");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      toast({ title: "Pengaturan Disimpan", description: "Detail toko berhasil diperbarui." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch(api.upload.storeLogo.path, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Gagal mengunggah logo");
      return res.json();
    },
    onSuccess: (data) => {
      setStoreLogo(data.url);
      updateSettings.mutate({ storeLogo: data.url });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ firstName, lastName, username });
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate({ storeName, storeAddress, storePhone });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Password baru dan konfirmasi tidak cocok", variant: "destructive" });
      return;
    }
    updateProfile.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-8 animate-enter max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          Edit Profil
        </h1>
        <p className="text-muted-foreground mt-2">Ubah informasi profil, username, dan password Anda.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
          <CardDescription>Ubah nama dan username Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Depan</label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nama depan"
                  data-testid="input-profile-first-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Belakang</label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nama belakang"
                  data-testid="input-profile-last-name"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                data-testid="input-profile-username"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending} data-testid="button-save-profile">
                {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan Profil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ganti Password</CardTitle>
          <CardDescription>Pastikan password baru minimal 6 karakter</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password Lama</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password lama"
                required
                data-testid="input-current-password"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password Baru</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
                required
                data-testid="input-new-password"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Konfirmasi Password Baru</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru"
                required
                data-testid="input-confirm-password"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateProfile.isPending} data-testid="button-change-password">
                {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ganti Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Pengaturan Toko</CardTitle>
                <CardDescription>Informasi ini akan muncul di struk thermal & invoice</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors">
                  {storeLogo ? (
                    <img src={storeLogo} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Store className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                  <ImagePlus className="w-8 h-8 text-primary" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadLogo.mutate(file);
                    }}
                  />
                </label>
                {uploadLogo.isPending && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveStore} className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama Toko</label>
                    <Input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Contoh: Kazana Shop"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Telepon Toko</label>
                    <Input
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Alamat Toko</label>
                  <Input
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Jl. Raya Kemenangan No. 8..."
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateSettings.isPending}>
                    {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Simpan Pengaturan Toko
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
