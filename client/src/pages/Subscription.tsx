import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Shield, CreditCard, CheckCircle2, Lock, Sparkles, Loader2,
  BookOpen, Store, Settings2, Clock, RefreshCw, Calendar, Zap,
  Gem, Crown, Star, User, ChevronRight, Gift
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

declare global {
  interface Window {
    snap: any;
  }
}

const TIERS = [
  {
    id: "free",
    name: "FREE",
    description: "Sistem Inventory Dasar untuk UMKM",
    price: 0,
    features: [
      "Manajemen Produk & SKU",
      "Opname Stok Digital",
      "Multi-Gudang Basic",
      "Laporan Stok Sederhana"
    ],
    icon: User,
    color: "slate",
    buttonText: "Pakai Versi Gratis",
    popular: false
  },
  {
    id: "pro",
    name: "PRO",
    description: "Akses 1 Modul Premium Pilihan",
    price: 150000,
    features: [
      "Semua fitur Paket FREE",
      "Pilih 1 Modul: POS / Accounting / Produksi",
      "Support Email (Respon 24j)",
      "Termasuk Laporan Bulanan"
    ],
    icon: Star,
    color: "blue",
    buttonText: "Upgrade ke PRO",
    popular: true
  },
  {
    id: "vip",
    name: "VIP",
    description: "Semua Modul Terintegrasi",
    price: 450000,
    features: [
      "Semua Modul Premium Aktif",
      "Full Inventory & Stock Opname",
      "Terminal Kasir (POS Premium)",
      "Double-Entry Accounting System",
      "Modul Produksi (BOM + Perakitan)",
      "VIP Support Priority"
    ],
    icon: Crown,
    color: "amber",
    buttonText: "Beli Paket VIP",
    popular: false
  },
  {
    id: "vvip",
    name: "VVIP",
    description: "Enterprise & Priority Business",
    price: 950000,
    features: [
      "Semua Fitur VIP Unlocked",
      "Smart Planner AI Engine Unlocked",
      "Konsultasi Implementasi Bisnis",
      "Dedicated WhatsApp Support 24/7",
      "Export Data Raw (Excel/CSV/PDF)",
      "Custom Branding (Logon Admin)"
    ],
    icon: Gem,
    color: "indigo",
    buttonText: "Pilih Paket VVIP",
    popular: false
  }
];

const MODULES = [
  {
    id: "pos",
    name: "Terminal Kasir (POS Premium)",
    price: 150000,
    icon: Store,
  },
  {
    id: "accounting",
    name: "Accounting Professional",
    price: 350000,
    icon: BookOpen,
  },
  {
    id: "production",
    name: "Modul Produksi & Perakitan",
    price: 250000,
    icon: Settings2,
  }
];

const MODULE_NAMES: Record<string, string> = {
  pos: "Terminal Kasir (POS Premium)",
  accounting: "Accounting Professional",
  production: "Modul Produksi & Perakitan",
};

interface SubscriptionRecord {
  id: number;
  moduleName: string;
  orderId: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [isTrialLoading, setIsTrialLoading] = useState(false);

  const subscribedModules = (user?.subscribedModules as string[]) || [];

  const { data: subscriptionHistory = [] } = useQuery<SubscriptionRecord[]>({
    queryKey: ["/api/payments/subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/payments/subscriptions");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handleStartTrial = async () => {
    try {
      setIsTrialLoading(true);
      const res = await fetch("/api/auth/start-trial", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal mengaktifkan trial");
      }
      toast({
        title: "Trial Berhasil Diaktifkan!",
        description: "Anda memiliki akses 14 hari ke semua fitur premium.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch (e: any) {
      toast({
        title: "Gagal Mengaktifkan Trial",
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setIsTrialLoading(false);
    }
  };

  const handleBuyTier = async (tierId: string, amount: number) => {
    if (tierId === "free") {
      setLocation("/");
      return;
    }

    try {
      setLoadingTier(tierId);
      // For VIP/VVIP, we might want a different payload, but for now 
      // let's assume 'all' modules. In a real scenario, this would trigger 
      // a specific tier purchase in the backend. 
      // Mapping 'pro' to 'pos' as default choice for this demo.
      const moduleName = tierId === "pro" ? "pos" : "all_modules";

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleName, amount }),
      });

      if (!res.ok) throw new Error("Gagal memproses checkout");
      const data = await res.json();

      window.snap.pay(data.token, {
        onSuccess: function () {
          toast({ title: "Pembayaran Berhasil!", description: "Paket Anda telah aktif." });
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          setTimeout(() => window.location.reload(), 2000);
        },
        onClose: () => setLoadingTier(null)
      });
    } catch (e: any) {
      toast({ title: "Kesalahan", description: e.message, variant: "destructive" });
      setLoadingTier(null);
    }
  };

  const latestPaidAt = subscriptionHistory.length > 0
    ? subscriptionHistory.reduce((latest, sub) => {
        if (!sub.paidAt) return latest;
        return !latest || new Date(sub.paidAt) > new Date(latest) ? sub.paidAt : latest;
      }, null as string | null)
    : null;

  const formatDate = (date: string | Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const isTrialActive = user?.trialEndsAt && new Date(user.trialEndsAt) > new Date();
  const hasSubs = subscribedModules.length > 0 || isTrialActive;

  return (
    <div className="flex-1 overflow-auto bg-gray-50/50 p-6 lg:p-10 scroll-smooth">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* 14-Day Trial Offering (Only for those who haven't used it) */}
        {!user?.trialEndsAt && !hasSubs && (
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0044CC] p-8 lg:p-12 text-white shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8 animate-in slide-in-from-top-10 duration-1000">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
            
            <div className="relative z-10 space-y-4 text-center lg:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-sm font-bold uppercase tracking-widest">
                <Gift className="w-4 h-4" /> Penawaran Terbatas
              </div>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter leading-tight uppercase">
                Rasakan Kekuatan PRO Gratis 14 Hari
              </h2>
              <p className="text-blue-100/70 text-lg font-medium leading-relaxed">
                Buka semua modul premium (POS, Accounting, Production) secara instan tanpa biaya. 
                Tingkatkan efisiensi bisnis Anda hari ini.
              </p>
            </div>

            <div className="relative z-10 flex flex-col gap-3 min-w-[240px]">
              <Button 
                onClick={handleStartTrial}
                disabled={isTrialLoading}
                className="h-16 px-8 bg-white text-[#0044CC] hover:bg-blue-50 font-black text-xl rounded-2xl shadow-xl shadow-black/10 transition-all active:scale-95 flex items-center gap-3"
              >
                {isTrialLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="w-6 h-6" />}
                Mulai Trial 14 Hari
              </Button>
              <p className="text-center text-blue-200/50 text-xs font-bold uppercase tracking-widest">Tanpa Kartu Kredit</p>
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100 text-blue-600">
            <Gem className="w-5 h-5" />
            <span className="text-sm font-black tracking-widest uppercase">Pilih Paket Bisnis Anda</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-gray-900 uppercase italic">
            Ambil Kendali <span className="text-[#0044CC]">Bisnis</span> Anda
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto font-medium">
            Tersedia paket fleksibel untuk setiap tahap pertumbuhan bisnis Anda. 
            Harga terjangkau untuk operasional bulanan Anda.
          </p>
        </div>

        {/* Pricing Tiers Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => {
            const Icon = tier.icon;
            const isFree = tier.id === "free";
            const isVip = tier.id === "vip" || tier.id === "vvip";
            
            return (
              <div 
                key={tier.id}
                className={`flex flex-col relative rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-2 group ${
                  tier.popular 
                    ? "bg-white border-2 border-[#0044CC] shadow-2xl shadow-blue-500/10 ring-4 ring-blue-50" 
                    : "bg-white border border-gray-100 shadow-xl shadow-black/[0.02] hover:border-gray-200"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#0044CC] text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                    Paling Populer
                  </div>
                )}

                <div className="space-y-6 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                    tier.color === "blue" ? "bg-blue-50 text-blue-600" :
                    tier.color === "amber" ? "bg-amber-50 text-amber-600" :
                    tier.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                    "bg-slate-50 text-slate-600"
                  }`}>
                    <Icon className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{tier.name}</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">{tier.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1">Rp</span>
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">
                      {tier.price.toLocaleString("id-ID")}
                    </span>
                    {!isFree && <span className="text-xs font-bold text-gray-400">/ bulan</span>}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    {tier.features.map((feature, idx) => (
                      <div key={feature} className="flex items-start gap-3 animate-in fade-in" style={{ animationDelay: `${idx*100}ms` }}>
                        <div className={`mt-1 h-4 w-4 shrink-0 rounded-full flex items-center justify-center ${tier.color === "blue" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6">
                  <Button
                    onClick={() => handleBuyTier(tier.id, tier.price)}
                    disabled={loadingTier === tier.id}
                    className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 ${
                      tier.popular 
                        ? "bg-[#0044CC] text-white hover:bg-blue-600 shadow-xl shadow-blue-500/20" 
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {loadingTier === tier.id ? <Loader2 className="animate-spin" /> : tier.buttonText}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Status Card (Polished) */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 lg:p-12 shadow-2xl shadow-black/[0.02] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl group-hover:w-48 group-hover:h-48 transition-all duration-700 pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${hasSubs ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                  <Shield className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Status Lisensi Akun</h2>
                  <p className="text-gray-500 font-medium">Monitoring akses fitur Anda secara real-time</p>
                </div>
              </div>
              
              {isTrialActive && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                    Masa Trial Aktif: {Math.ceil((new Date(user.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Hari Lagi
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 lg:max-w-2xl">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-blue-100 transition-colors">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Modul Aktif</p>
                  <div className="flex flex-col gap-2">
                    {subscribedModules.length > 0 ? subscribedModules.map(m => (
                      <div key={m} className="flex items-center gap-2 text-sm font-bold text-gray-800">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {MODULE_NAMES[m] || m}
                      </div>
                    )) : isTrialActive ? (
                      <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                        <CheckCircle2 className="w-4 h-4" /> Semua Fitur (Trial)
                      </div>
                    ) : <span className="text-sm font-bold text-gray-400">Belum Ada</span>}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Update Terakhir</p>
                  <p className="text-sm font-black text-gray-800">{latestPaidAt ? formatDate(latestPaidAt) : "-"}</p>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Berlaku Sampai</p>
                  <p className="text-sm font-black text-blue-600 uppercase tracking-tighter">
                    {isTrialActive ? formatDate(user.trialEndsAt!) : (latestPaidAt ? formatDate(new Date(new Date(latestPaidAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()) : "-")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center pb-10">
          <p className="text-sm text-gray-400 font-medium">Bantuan? Hubungi Technical Support via WhatsApp 24/7</p>
        </div>
      </div>
    </div>
  );
}
