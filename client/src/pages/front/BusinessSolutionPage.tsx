import { useRoute } from "wouter";
import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { 
  CheckCircle2, Store, Coffee, ShoppingBag, 
  Waves, Utensils, Scissors, ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const SOLUTION_DATA: Record<string, any> = {
  "coffee-shop": {
    title: "Coffee Shop & Cafe",
    subtitle: "Kelola pesanan kilat, stok biji kopi, dan loyalitas pelanggan dalam satu sistem kasir yang estetik.",
    icon: Coffee,
    color: "amber",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800",
    features: [
      "Manajemen Menu & Add-ons (Gula, Topping, Milk)",
      "Sistem Antrean & Nama Pelanggan",
      "Stok Bahan Baku (Gramasi Biji Kopi, Susu)",
      "Promo Happy Hour & Loyalitas",
      "Support Printer Struk Thermal & Bluetooth"
    ],
    agitation: "Pelanggan cafe tidak suka menunggu. Jangan biarkan kasir yang lambat merusak vibes kopi mereka."
  },
  "retail": {
    title: "Toko Retail & Minimarket",
    subtitle: "Kontrol ribuan SKU, stok opname cepat, dan manajemen supplier tanpa pusing.",
    icon: ShoppingBag,
    color: "blue",
    image: "https://images.unsplash.com/photo-1534452286362-623b137175f1?auto=format&fit=crop&q=80&w=800",
    features: [
       "Scanning Barcode Kilat",
       "Input Stok Massal via Excel",
       "Alert Stok Minimum (Gak Bakal Kehabisan)",
       "Manajemen Multi-Satuan (Pcs, Box, Dus)",
       "Laporan Laba/Rugi per Item"
    ],
    agitation: "Stok selisih? Barang hilang? Saatnya berhentikan kebocoran profit di toko Anda."
  },
  "laundry": {
    title: "Laundry & Cleaners",
    subtitle: "Tracking cucian pelanggan dari masuk hingga packing, lengkap dengan notifikasi WhatsApp.",
    icon: Waves,
    color: "indigo",
    image: "https://images.unsplash.com/photo-1545173153-93627c01ef44?auto=format&fit=crop&q=80&w=800",
    features: [
       "Tracking Status (Cuci, Jemur, Setrika, Selesai)",
       "Tagging Pakaian Per Pelanggan",
       "Manajemen Deposit & Saldo",
       "Laporan Kinerja Karyawan",
       "Hitung Biaya Berdasarkan Berat (Kg) / Satuan"
    ],
    agitation: "Baju tertukar atau lupa status cucian? Berikan kepastian pada pelanggan dengan sistem tracking."
  },
  "restoran": {
    title: "Restoran & Rumah Makan",
    subtitle: "Integrasi dapur dan meja, manajemen resep (BOM), hingga laporan HPP yang akurat.",
    icon: Utensils,
    color: "red",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    features: [
       "Manajemen Meja & Pemesanan Digital",
       "Kitchen Display System (Layar Dapur)",
       "BOM (Resep Masakan) & HPP Otomatis",
       "Manajemen Bahan Baku (Bawang, Cabai, Daging)",
       "Sistem Void & Refund Terkontrol"
    ],
    agitation: "Bahan baku terbuang sia-sia? Hitung setiap gram modal Anda dengan modul ERP Restoran."
  },
  "barbershop": {
    title: "Barbershop & Salon",
    subtitle: "Booking jadwal, bagi hasil stylist, dan manajemen produk perawatan rambut.",
    icon: Scissors,
    color: "slate",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800",
    features: [
       "Booking & Reservasi Online",
       "Manajemen Komisi & Bagi Hasil Stylist",
       "History Gaya Rambut Pelanggan",
       "Penjualan Produk (Pomade, Serum)",
       "Laporan Kunjungan Harian"
    ],
    agitation: "Stylist bingung hitung komisi? Otomatiskan gaji dan fokus pada pelayanan pelanggan."
  }
};

export default function BusinessSolutionPage() {
  const [match, params] = useRoute("/solusi/:type");
  const type = params?.type || "retail";
  const data = SOLUTION_DATA[type] || SOLUTION_DATA["retail"];
  const Icon = data.icon;

  return (
    <FrontLayout>
      {/* Hero */}
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-${data.color}-50 text-${data.color}-600`}>
               <Icon className="w-10 h-10" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-slate-900 leading-tight">
              Aplikasi Kasir {data.title}
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed">
              {data.subtitle}
            </p>
            <div className="flex gap-4">
              <Link href="/login">
                <Button className="h-14 px-8 text-base font-bold bg-[#0044CC] hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20">
                  Daftar Sekarang
                </Button>
              </Link>
              <Button variant="outline" className="h-14 px-8 text-base font-bold border border-slate-200 hover:border-slate-300 rounded-xl bg-white">
                Lihat Demo
              </Button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
              <img src={data.image} alt={data.title} className="w-full h-full object-cover" />
            </div>
            {/* Floating Element */}
            <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 max-w-[200px] hidden md:block">
               <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <Store className="w-6 h-6 text-green-600" />
               </div>
               <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Optimized for</div>
               <div className="text-lg font-bold text-slate-900">{data.title}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Agitation */}
      <section className="py-20 bg-slate-950 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-8 italic tracking-tight leading-tight">
             "{data.agitation}"
          </h2>
          <div className="h-1 w-20 bg-blue-500 mx-auto" />
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
         <div className="max-w-[1300px] mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-black text-slate-900 tracking-tight">Fitur Unggulan {data.title}</h2>
               <p className="text-slate-500 font-medium mt-4">Didesain khusus untuk menjawab tantangan operasional harian Anda.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {data.features.map((f: string, i: number) => (
                  <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group">
                     <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-6 group-hover:bg-[#0044CC] transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-[#0044CC] group-hover:text-white" />
                     </div>
                     <p className="text-lg font-bold text-slate-900 leading-snug">{f}</p>
                  </div>
               ))}
            </div>
         </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
         <div className="max-w-[1300px] mx-auto px-6 text-center">
            <h2 className="text-4xl lg:text-6xl font-black mb-8 text-slate-900 pb-2">Siap Menaikkan Level Bisnis Anda?</h2>
            <Link href="/login">
               <Button className="h-20 px-16 text-xl font-black bg-[#0044CC] text-white hover:bg-blue-700 rounded-2xl shadow-2xl shadow-blue-500/30 uppercase tracking-widest transition-transform hover:scale-105">
                  Daftar Kazana Sekarang
               </Button>
            </Link>
            <p className="mt-8 text-slate-500 font-bold">Gratis 14 Hari • Tanpa Kartu Kredit • Setup Kilat</p>
         </div>
      </section>
    </FrontLayout>
  );
}
