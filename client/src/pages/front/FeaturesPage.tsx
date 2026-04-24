import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { 
  Package, Store, BookOpen, Settings2, 
  Shield, Zap, TrendingUp, CheckCircle2 
} from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      title: "Manajemen Inventory Terintegrasi",
      desc: "Lacak stok Anda secara real-time di berbagai lokasi gudang dan toko. Sinkronisasi otomatis setiap ada penjualan.",
      icon: Package,
      items: ["Multi-warehouse", "Batch Tracking", "Serial Number", "Stock Opname Digital"]
    },
    {
      title: "Terminal POS Offline-First",
      desc: "Kasir yang tetap berjalan meskipun internet mati. Data akan tersinkronisasi otomatis saat internet kembali online.",
      icon: Store,
      items: ["Support Thermal Printer", "Manajemen Shift", "Loyalty Points", "Multi-payment Methods"]
    },
    {
      title: "Akuntansi Otomatis",
      desc: "Setiap transaksi POS dan Inventory langsung menjurnal ke buku besar. Laporan keuangan siap kapan saja.",
      icon: BookOpen,
      items: ["Laba Rugi", "Neraca", "Arus Kas", "Pajak & Diskon"]
    },
    {
      title: "Manajemen Produksi & BOM",
      desc: "Hitung HPP produk jadi Anda dengan presisi melalui Bill of Materials (BOM) yang terintegrasi.",
      icon: Settings2,
      items: ["Tracking Bahan Baku", "Work Order", "Costing Produksi", "Resep Menu"]
    }
  ];

  return (
    <FrontLayout 
      title="Fitur Unggulan" 
      description="Jelajahi berbagai fitur Enterprise Resource Planning (ERP) masa depan, mulai dari manajemen inventori hingga integrasi AI."
    >
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 mb-6">
              Fitur Canggih Untuk <span className="text-[#0044CC]">Bisnis Modern</span>.
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
              Kazana ERP menyediakan modul modular yang bisa disesuaikan dengan kebutuhan unik usaha Anda.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-[1300px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0044CC] mb-8">
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{f.title}</h3>
                <p className="text-slate-500 font-medium mb-8 leading-relaxed">{f.desc}</p>
                <div className="grid grid-cols-2 gap-4">
                   {f.items.map(item => (
                     <div key={item} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-[#0044CC]" />
                        {item}
                     </div>
                   ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </FrontLayout>
  );
}
