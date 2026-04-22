import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Settings } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, Store, Phone, Mail, User, MapPin, 
  Building2, Globe, FileText, ChevronDown, 
  CheckCircle2, Package, Landmark, Receipt, 
  Clock, Coins, CreditCard, ArrowRight, ArrowLeft
} from "lucide-react";
import { DAFTAR_PROVINSI, getKotaByProvinsi } from "@/lib/indonesiaRegions";
import { motion, AnimatePresence } from "framer-motion";

const JENIS_USAHA = ["PT", "CV", "UD", "Perorangan", "Firma", "Koperasi", "Yayasan", "Lainnya"];
const CURRENCIES = ["IDR", "USD", "SGD", "MYR", "EUR"];
const TIMEZONES = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "UTC"];

export default function StoreSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const isAdmin = user && !user.adminId;

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      if (!res.ok) throw new Error("Gagal mengambil pengaturan");
      return res.json();
    },
    enabled: !!isAdmin,
  });

  // Form state
  const [formData, setFormData] = useState({
    storeName: "",
    storeType: "",
    storeNpwp: "",
    storePhone: "",
    storeEmail: "",
    storeWebsite: "",
    picName: "",
    storeProvince: "",
    storeCity: "",
    storeDistrict: "",
    storeAddress: "",
    storePostalCode: "",
    currency: "IDR",
    timezone: "Asia/Jakarta",
    bankName: "",
    bankAccountNo: "",
    bankAccountName: "",
    taxStatus: "Non-PKP",
    businessDescription: "",
  });

  const kotaList = useMemo(() => {
    if (!formData.storeProvince) return [];
    return getKotaByProvinsi(formData.storeProvince);
  }, [formData.storeProvince]);

  useEffect(() => {
    if (settings) {
      const s = settings as any;
      setFormData(prev => ({
        ...prev,
        storeName: s.storeName || "",
        storeType: s.storeType || "",
        storeNpwp: s.storeNpwp || "",
        storePhone: s.storePhone || "",
        storeEmail: s.storeEmail || "",
        storeWebsite: s.storeWebsite || "",
        picName: s.picName || "",
        storeProvince: s.storeProvince || "",
        storeCity: s.storeCity || "",
        storeDistrict: s.storeDistrict || "",
        storeAddress: s.storeAddress || "",
        storePostalCode: s.storePostalCode || "",
        currency: s.currency || "IDR",
        timezone: s.timezone || "Asia/Jakarta",
        bankName: s.bankName || "",
        bankAccountNo: s.bankAccountNo || "",
        bankAccountName: s.bankAccountName || "",
        taxStatus: s.taxStatus || "Non-PKP",
        businessDescription: s.businessDescription || "",
      }));

      if (s.storeName && s.storePhone && s.storeEmail && s.storeName !== "Kazana Shop") {
         setLocation("/");
      }
    }
  }, [settings, setLocation]);

  const updateSettings = useMutation({
    mutationFn: async (data: Partial<Settings>) => {
      const res = await fetch(api.settings.update.path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Gagal menyimpan pengaturan" }));
        throw new Error(err.message || "Gagal menyimpan pengaturan");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      toast({ title: "Selamat! ✓", description: "Profil bisnis Anda telah siap. Selamat menggunakan Kazana ERP." });
      setLocation("/");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (step === 1 && (!formData.storeName || !formData.storeType)) {
      toast({ title: "Ops!", description: "Lengkapi Nama Bisnis dan Jenis Usaha.", variant: "destructive" });
      return;
    }
    if (step === 2 && (!formData.storePhone || !formData.storeEmail)) {
      toast({ title: "Ops!", description: "Lengkapi Kontak Bisnis (HP & Email).", variant: "destructive" });
      return;
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      nextStep();
      return;
    }
    updateSettings.mutate(formData as any);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (step < 3) {
        e.preventDefault();
        nextStep();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0044CC] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-white/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0044CC] font-sans relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-[100px]" />

      <div className="z-10 flex items-center justify-between p-8">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Kazana ERP</span>
        </div>
        
        <div className="hidden md:flex gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'w-8 bg-white' : 'w-4 bg-white/20'}`} 
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 pb-20 relative z-10">
        <div className="w-full max-w-4xl bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
            
            <div className="hidden lg:flex md:w-1/3 bg-gradient-to-br from-blue-600 to-indigo-700 p-10 flex-col justify-between text-white">
              <div>
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={step}
                  className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md"
                >
                  {step === 1 && <Store className="w-8 h-8 text-white" />}
                  {step === 2 && <MapPin className="w-8 h-8 text-white" />}
                  {step === 3 && <Landmark className="w-8 h-8 text-white" />}
                </motion.div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1 className="text-3xl font-black uppercase leading-tight mb-4 tracking-tighter text-white">
                      {step === 1 && "Profil\nBisnis"}
                      {step === 2 && "Lokasi &\nKontak"}
                      {step === 3 && "Finansial &\nPajak"}
                    </h1>
                    <p className="text-blue-100/70 text-sm font-medium leading-relaxed">
                      {step === 1 && "Mulai identitas brand Anda. Informasi ini akan muncul di dashboard utama."}
                      {step === 2 && "Detail alamat dan kontak resmi untuk keperluan korespondensi sistem."}
                      {step === 3 && "Pengaturan mata uang dan rekening bank untuk mempermudah transaksi invoice."}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-white/80">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                   <span className="text-xs font-bold uppercase tracking-widest">Enterprise Ready</span>
                </div>
                <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-bold">
                  Sistem Setup Bertahap v2.0
                </p>
              </div>
            </div>

            <div className="flex-1 flex flex-col p-8 md:p-12 overflow-hidden bg-slate-50/30">
               <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="wait">
                      {step === 1 && (
                        <motion.div 
                          key="step1"
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -30, opacity: 0 }}
                          className="space-y-8 pb-4"
                        >
                          <section className="space-y-4">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-6">Tahap 1: Identitas Brand</Label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2 space-y-2">
                                <Label className="text-xs font-bold text-slate-700">Nama Bisnis / Perusahaan <span className="text-red-500">*</span></Label>
                                <Input 
                                  name="storeName"
                                  value={formData.storeName} 
                                  onChange={handleInputChange}
                                  placeholder="Contoh: Kazana Cafe & Resto"
                                  className="h-14 rounded-2xl border-slate-200 bg-white font-bold text-slate-800"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                 <Label className="text-xs font-bold text-slate-700">Jenis Usaha <span className="text-red-500">*</span></Label>
                                 <div className="relative">
                                   <select 
                                     name="storeType"
                                     value={formData.storeType}
                                     onChange={handleInputChange}
                                     className="w-full h-14 pl-4 pr-10 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                   >
                                     <option value="">Pilih...</option>
                                     {JENIS_USAHA.map(j => <option key={j} value={j}>{j}</option>)}
                                   </select>
                                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                 </div>
                              </div>

                              <div className="space-y-2">
                                 <Label className="text-xs font-bold text-slate-700">Website (Opsional)</Label>
                                 <Input 
                                   name="storeWebsite"
                                   value={formData.storeWebsite}
                                   onChange={handleInputChange}
                                   placeholder="https://www.bisnisanda.com"
                                   className="h-14 rounded-2xl border-slate-200 bg-white font-medium italic text-slate-500"
                                 />
                              </div>

                              <div className="md:col-span-2 space-y-2">
                                 <Label className="text-xs font-bold text-slate-700">Deskripsi Singkat Bisnis</Label>
                                 <textarea 
                                   name="businessDescription"
                                   value={formData.businessDescription}
                                   onChange={handleInputChange}
                                   placeholder="Jelaskan mengenai lini bisnis Anda..."
                                   rows={3}
                                   className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                 />
                              </div>
                            </div>
                          </section>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <motion.div 
                          key="step2"
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -30, opacity: 0 }}
                          className="space-y-8 pb-4"
                        >
                          <section className="space-y-6">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tahap 2: Kontak & Operasional</Label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label className="text-xs font-bold text-slate-700">No. HP Bisnis <span className="text-red-500">*</span></Label>
                                  <Input 
                                    name="storePhone"
                                    value={formData.storePhone}
                                    onChange={handleInputChange}
                                    placeholder="0812-xxxx-xxxx"
                                    className="h-14 rounded-2xl border-slate-200 bg-white font-bold"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-xs font-bold text-slate-700">Email Bisnis <span className="text-red-500">*</span></Label>
                                  <Input 
                                    name="storeEmail"
                                    type="email"
                                    value={formData.storeEmail}
                                    onChange={handleInputChange}
                                    placeholder="bisnis@email.com"
                                    className="h-14 rounded-2xl border-slate-200 bg-white font-bold"
                                  />
                               </div>
                               <div className="md:col-span-2 space-y-2">
                                  <Label className="text-xs font-bold text-slate-700">Nama PIC Perusahaan (Penanggung Jawab)</Label>
                                  <Input 
                                    name="picName"
                                    value={formData.picName}
                                    onChange={handleInputChange}
                                    placeholder="Nama Lengkap Pemilik / Manager"
                                    className="h-14 rounded-2xl border-slate-200 bg-white font-bold"
                                  />
                               </div>

                               <div className="space-y-2">
                                  <Label className="text-xs font-bold text-slate-700">Provinsi</Label>
                                  <div className="relative">
                                    <select 
                                      name="storeProvince"
                                      value={formData.storeProvince}
                                      onChange={handleInputChange}
                                      className="w-full h-14 pl-4 pr-10 rounded-2xl border border-slate-200 bg-white text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                      <option value="">Pilih Provinsi</option>
                                      {DAFTAR_PROVINSI.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-xs font-bold text-slate-700">Kota / Kabupaten</Label>
                                  <div className="relative">
                                    <select 
                                      name="storeCity"
                                      value={formData.storeCity}
                                      onChange={handleInputChange}
                                      disabled={!formData.storeProvince}
                                      className="w-full h-14 pl-4 pr-10 rounded-2xl border border-slate-200 bg-white text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                      <option value="">{formData.storeProvince ? "Pilih Kota" : "Pilih Provinsi Dulu"}</option>
                                      {kotaList.map(k => <option key={k} value={k}>{k}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  </div>
                               </div>
                            </div>
                          </section>
                        </motion.div>
                      )}

                      {step === 3 && (
                        <motion.div 
                          key="step3"
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -30, opacity: 0 }}
                          className="space-y-8 pb-4"
                        >
                          <section className="space-y-6">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tahap 3: Finansial & Parameter Sistem</Label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label className="text-xs font-bold text-slate-700">Status Pajak (PPN)</Label>
                                  <div className="relative">
                                    <select 
                                      name="taxStatus"
                                      value={formData.taxStatus}
                                      onChange={handleInputChange}
                                      className="w-full h-14 pl-4 pr-10 rounded-2xl border border-slate-200 bg-white text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                      <option value="Non-PKP">Non-PKP (Tidak Pungut Pajak)</option>
                                      <option value="PKP">PKP (Wajib Pungut PPN 11%)</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  </div>
                               </div>
                               <div className="space-y-2">
                                  <Label className="text-xs font-bold text-slate-700">Mata Uang Dasar</Label>
                                  <div className="relative">
                                    <select 
                                      name="currency"
                                      value={formData.currency}
                                      onChange={handleInputChange}
                                      className="w-full h-14 pl-4 pr-10 rounded-2xl border border-slate-200 bg-white text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                      {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  </div>
                               </div>

                               <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-blue-50 rounded-3xl border border-blue-100">
                                   <div className="space-y-2">
                                      <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Nama Bank</Label>
                                      <Input 
                                        name="bankName"
                                        value={formData.bankName}
                                        onChange={handleInputChange}
                                        placeholder="BCA / Mandiri / dll"
                                        className="h-12 rounded-xl bg-white border-transparent"
                                      />
                                   </div>
                                   <div className="space-y-2">
                                      <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">No. Rekening</Label>
                                      <Input 
                                        name="bankAccountNo"
                                        value={formData.bankAccountNo}
                                        onChange={handleInputChange}
                                        placeholder="1234567890"
                                        className="h-12 rounded-xl bg-white border-transparent"
                                      />
                                   </div>
                                   <div className="space-y-2">
                                      <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Atas Nama</Label>
                                      <Input 
                                        name="bankAccountName"
                                        value={formData.bankAccountName}
                                        onChange={handleInputChange}
                                        placeholder="PT Bisnis Jaya"
                                        className="h-12 rounded-xl bg-white border-transparent"
                                      />
                                   </div>
                               </div>

                               <div className="md:col-span-2 space-y-2">
                                  <Label className="text-xs font-bold text-slate-700">Zona Waktu Sistem</Label>
                                  <div className="relative">
                                    <select 
                                      name="timezone"
                                      value={formData.timezone}
                                      onChange={handleInputChange}
                                      className="w-full h-14 pl-4 pr-10 rounded-2xl border border-slate-200 bg-white text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                      {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  </div>
                                  <p className="text-[10px] text-slate-400 ml-1 italic">Mempengaruhi laporan tanggal dan waktu transaksi.</p>
                               </div>
                            </div>
                          </section>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
                      {step > 1 ? (
                        <Button 
                          type="button"
                          variant="ghost"
                          onClick={prevStep}
                          className="h-14 px-6 gap-2 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
                        >
                          <ArrowLeft className="w-4 h-4" /> Kembali
                        </Button>
                      ) : <div />}

                      {step < 3 ? (
                        <Button 
                          type="button"
                          onClick={nextStep}
                          className="h-14 px-10 gap-2 bg-[#0044CC] hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-blue-500/20 transition-all uppercase tracking-widest"
                        >
                          Lanjut <ArrowRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button 
                          type="submit"
                          className="h-14 px-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/20 transition-all uppercase tracking-widest"
                          disabled={updateSettings.isPending}
                        >
                          {updateSettings.isPending ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...</>
                          ) : (
                            <><CheckCircle2 className="w-5 h-5" /> Selesaikan Setup</>
                          )}
                        </Button>
                      )}
                  </div>
               </form>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}} />
    </div>
  );
}
