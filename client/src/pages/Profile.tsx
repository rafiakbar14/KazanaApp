import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Loader2, AlertCircle, CheckCircle2, ImagePlus, Store, History, ShieldInfo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [storeEmail, setStoreEmail] = useState("");
  const [picName, setPicName] = useState("");
  const [storeLogo, setStoreLogo] = useState("");
  const [fastMovingThreshold, setFastMovingThreshold] = useState(30);
  const [slowMovingThreshold, setSlowMovingThreshold] = useState(60);
  const [hideBranding, setHideBranding] = useState(false);


  useEffect(() => {
    if (settings) {
      setStoreName((settings as any).storeName || "Kazana Shop");
      setStoreAddress((settings as any).storeAddress || "");
      setStorePhone((settings as any).storePhone || "");
      setStoreEmail((settings as any).storeEmail || "");
      setPicName((settings as any).picName || "");
      setStoreLogo((settings as any).storeLogo || "");
      setFastMovingThreshold((settings as any).fastMovingThreshold || 30);
      setSlowMovingThreshold((settings as any).slowMovingThreshold || 60);
      setHideBranding((settings as any).hideBranding === 1);
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
    if (!storeName || !storePhone || !storeEmail) {
      toast({
        title: "Validasi Gagal",
        description: "Nama Toko, Telepon, dan Email wajib diisi.",
        variant: "destructive"
      });
      return;
    }
    updateSettings.mutate({
      storeName,
      storeAddress,
      storePhone,
      storeEmail,
      picName,
      fastMovingThreshold,
      slowMovingThreshold,
      hideBranding: hideBranding ? 1 : 0
    });

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
                    <label className="text-sm font-medium">Nama Toko <span className="text-red-500">*</span></label>
                    <Input
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Contoh: Kazana Shop"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Telepon Toko <span className="text-red-500">*</span></label>
                    <Input
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email Toko <span className="text-red-500">*</span></label>
                    <Input
                      type="email"
                      value={storeEmail}
                      onChange={(e) => setStoreEmail(e.target.value)}
                      placeholder="business@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Nama PIC / Owner</label>
                    <Input
                      value={picName}
                      onChange={(e) => setPicName(e.target.value)}
                      placeholder="Nama penanggung jawab"
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

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <History className="w-4 h-4 text-indigo-500" /> Analitik Inventaris
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Threshold Fast Moving (Hari)</label>
                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100 font-bold">NORMAL</Badge>
                      </div>
                      <Input
                        type="number"
                        value={fastMovingThreshold}
                        onChange={(e) => setFastMovingThreshold(parseInt(e.target.value))}
                        placeholder="Default: 30"
                      />
                      <p className="text-[9px] text-slate-400 italic font-medium">Barang yang habis terjual sebelum X hari dianggap Fast Moving.</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Threshold Dead Stock (Hari)</label>
                        <Badge variant="outline" className="text-[9px] bg-rose-50 text-rose-700 border-rose-100 font-bold">SLOW</Badge>
                      </div>
                      <Input
                        type="number"
                        value={slowMovingThreshold}
                        onChange={(e) => setSlowMovingThreshold(parseInt(e.target.value))}
                        placeholder="Default: 60"
                      />
                      <p className="text-[9px] text-slate-400 italic font-medium">Barang yang tidak terjual lebih dari X hari dianggap Dead Stock.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-bold text-slate-800">Sembunyikan Branding Kazana</Label>
                        {!((user?.subscribedModules && (user.subscribedModules as string[]).length > 0) || (user?.trialEndsAt && new Date(user.trialEndsAt) > new Date())) && (
                          <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-100 font-bold uppercase">Khusus Pro</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">Hilangkan tulisan "Powered by Kazana POS" di bagian bawah struk.</p>
                    </div>
                    <Switch
                      checked={hideBranding}
                      onCheckedChange={setHideBranding}
                      disabled={!((user?.subscribedModules && (user.subscribedModules as string[]).length > 0) || (user?.trialEndsAt && new Date(user.trialEndsAt) > new Date()))}
                    />
                  </div>
                </div>


                <div className="flex justify-end pt-4">
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
