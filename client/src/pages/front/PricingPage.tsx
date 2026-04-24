import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { CheckCircle2, Package, Store, BookOpen, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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
    icon: Package,
    color: "slate",
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
  }
];

export default function PricingPage() {
  return (
    <FrontLayout 
      title="Harga Paket" 
      description="Pilih paket berlangganan Kazana ERP yang paling sesuai dengan skala bisnis Anda. Transparan, terjangkau, dan tanpa biaya tersembunyi."
    >
      <section className="pt-40 pb-20 bg-white">
         <div className="max-w-[1300px] mx-auto px-6 text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 pb-3">
               Investasi Cerdas Untuk <br/> <span className="text-[#0044CC]">Masa Depan Bisnis</span>.
            </motion.h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12">
               Pilih modul sesuai skala bisnis Anda hari ini. Upgrade kapan saja tanpa hambatan.
            </p>
         </div>
      </section>

      <section className="pb-32 bg-white">
         <div className="max-w-[1300px] mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
               {MODULES.map((module) => {
                  const Icon = module.icon;
                  return (
                    <div key={module.id} className={`p-8 rounded-[3rem] border transition-all hover:-translate-y-2 ${module.popular ? "border-[#0044CC] shadow-2xl ring-8 ring-blue-50" : "border-slate-100 shadow-xl"}`}>
                       <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
                          <Icon className="w-6 h-6" />
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">{module.name}</h3>
                       <p className="text-sm text-slate-500 font-medium mb-6 min-h-[40px]">{module.description}</p>
                       
                       <div className="flex items-baseline gap-1 mb-8">
                          <span className="text-sm font-bold text-slate-400">Rp</span>
                          <span className="text-4xl font-black text-slate-900 tracking-tighter">{module.price.toLocaleString("id-ID")}</span>
                          {module.price > 0 && <span className="text-sm font-bold text-slate-400">/bln</span>}
                       </div>

                       <div className="space-y-4 mb-10 pt-6 border-t border-slate-50">
                          {module.features.map(f => (
                            <div key={f} className="flex gap-3 text-sm font-bold text-slate-700">
                               <CheckCircle2 className="w-4 h-4 text-[#0044CC] shrink-0" />
                               {f}
                            </div>
                          ))}
                       </div>

                       <Link href={`/login?module=${module.id}`}>
                          <Button className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest ${module.popular ? "bg-[#0044CC] text-white hover:bg-blue-700" : "bg-slate-100 text-slate-900 hover:bg-slate-200"}`}>
                             Pilih Modul
                          </Button>
                       </Link>
                    </div>
                  );
               })}
            </div>
         </div>
      </section>
    </FrontLayout>
  );
}
