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

const MODULES = [
  {
    id: "inventory",
    name: "System Core (Inventory)",
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
    buttonText: "Modul Dasar",
    popular: false
  },
  {
    id: "pos",
    name: "Terminal Kasir/POS",
    description: "Kasir offline-first multi-cabang",
    price: 150000,
    features: [
       "Terminal Kasir Tablet & Desktop",
       "Support Printer Thermal",
       "Sinkronisasi Data Offline",
       "Manajemen Multi-Lokasi Kasir"
    ],
    icon: Store,
    color: "blue",
    buttonText: "Beli Modul Kasir",
    popular: true
  },
  {
    id: "accounting",
    name: "Modul Akuntansi",
    description: "Jurnal Otomatis & Buku Besar",
    price: 350000,
    features: [
       "Double Entry Accounting",
       "Laporan Laba/Rugi Real-time",
       "Manajemen Multi Kurs",
       "Manajemen Aset Tetap"
    ],
    icon: BookOpen,
    color: "amber",
    buttonText: "Beli Modul Akuntansi",
    popular: false
  },
  {
    id: "production",
    name: "Modul Produksi",
    description: "Manajemen Resep (BOM) & Pabrik",
    price: 250000,
    features: [
       "Bill of Materials",
       "Tracking Biaya Produksi",
       "Perhitungan HPP Otomatis",
       "Integrasi dengan Inventory"
    ],
    icon: Settings2,
    color: "indigo",
    buttonText: "Beli Modul Produksi",
    popular: false
  }
];

const MODULE_NAMES: Record<string, string> = {
  inventory: "System Core (Inventory)",
  pos: "Terminal Kasir/POS",
  accounting: "Modul Akuntansi",
  production: "Modul Produksi",
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

  const handleBuyModule = async (moduleId: string, amount: number) => {
    if (moduleId === "inventory") {
      setLocation("/");
      return;
    }

    try {
      setLoadingTier(moduleId);

      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleName: moduleId, amount }),
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

        {/* Modules Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const isFree = module.id === "inventory";
            const isActive = subscribedModules.includes(module.id);
            
            return (
              <div 
                key={module.id}
                className={`flex flex-col relative rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 group ${
                  module.popular 
                    ? "bg-white border-2 border-[#0044CC] shadow-2xl shadow-blue-500/10 ring-4 ring-blue-50" 
                    : isActive || isFree
                    ? "bg-green-50/20 border border-green-100 shadow-xl shadow-black/[0.01]"
                    : "bg-white border border-gray-100 shadow-xl shadow-black/[0.02] hover:border-gray-200"
                }`}
              >
                {module.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[#0044CC] text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                    Rekomendasi
                  </div>
                )}

                <div className="space-y-6 flex-1">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                    module.color === "blue" ? "bg-blue-50 text-blue-600" :
                    module.color === "amber" ? "bg-amber-50 text-amber-600" :
                    module.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                    "bg-slate-50 text-slate-600"
                  }`}>
                    <Icon className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{module.name}</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">{module.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-1">Rp</span>
                    <span className="text-4xl font-black text-gray-900 tracking-tighter">
                      {module.price.toLocaleString("id-ID")}
                    </span>
                    {!isFree && <span className="text-xs font-bold text-gray-400">/ bulan</span>}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    {module.features.map((feature, idx) => (
                      <div key={feature} className="flex items-start gap-3 animate-in fade-in" style={{ animationDelay: `${idx*100}ms` }}>
                        <div className={`mt-1 h-4 w-4 shrink-0 rounded-full flex items-center justify-center ${module.color === "blue" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6">
                  <Button
                    onClick={() => handleBuyModule(module.id, module.price)}
                    disabled={loadingTier === module.id || isActive || isFree}
                    className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      isActive || isFree
                        ? "bg-transparent text-green-600 border-2 border-green-200 cursor-default opacity-100"
                        : module.popular
                        ? "bg-[#0044CC] text-white hover:bg-blue-600 shadow-xl shadow-blue-500/20"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {loadingTier === module.id ? <Loader2 className="animate-spin" /> : 
                     isActive || isFree ? (
                       <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/> Telah Aktif</span>
                     ) : module.buttonText}
                    {(!isFree && !isActive) && <ChevronRight className="w-4 h-4" />}
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
