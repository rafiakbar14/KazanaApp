import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import FrontLayout from "@/components/FrontLayout";
import { Link } from "wouter";
import { 
  ArrowRight, CheckCircle2, Shield, Zap, TrendingUp,
  Package, Store, BookOpen, Settings2
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

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
    buttonText: "Coba Gratis",
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
    buttonText: "Lihat Kasir",
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
    buttonText: "Lihat Akuntansi",
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
    buttonText: "Lihat Produksi",
    popular: false
  }
];

export default function LandingPage() {
  return (
    <FrontLayout 
      title="ERP Masa Depan untuk UMKM" 
      description="Kazana ERP adalah platform manajemen bisnis terlengkap di Indonesia dengan integrasi AI, manajemen stok pintar, dan kasir cloud."
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden px-6 bg-[#FAFAFA]">
        <div className="max-w-[1300px] mx-auto">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left Content */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="space-y-8 relative z-10 text-center lg:text-left mb-16 lg:mb-0">
              <motion.h1 variants={fadeIn} className="text-5xl lg:text-[4.5rem] font-bold tracking-tight text-slate-900 leading-[1.1]">
                Sistem Manajemen <br className="hidden lg:block"/>
                Bisnis Profesional
              </motion.h1>
              
              <motion.p variants={fadeIn} className="text-lg text-slate-500 font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed pr-8">
                Kelola stok, gudang, dan penjualan dalam satu platform terpadu yang aman dan cerdas.
              </motion.p>
              
              <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link href="/login">
                  <Button className="w-full sm:w-auto h-14 px-8 text-base font-bold bg-[#0044CC] hover:bg-blue-700 text-white rounded-lg shadow-md shadow-blue-500/20">
                    Coba Sekarang
                  </Button>
                </Link>
                 <a href="https://wa.me/6283135183093?text=halo%20kak%20saya%20mau%20jadwalkan%20demo" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto h-14 px-8 flex items-center justify-center text-base font-bold border border-slate-300 hover:border-[#0044CC] hover:text-[#0044CC] text-slate-700 bg-white shadow-sm rounded-lg transition-all">
                   Hubungi WhatsApp
                 </a>
              </motion.div>
            </motion.div>

            {/* Right Content - Premium SaaS 3D Visual */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 1, delay: 0.2 }} 
              className="relative z-10 w-full h-[500px] flex items-center justify-center lg:justify-end perspective-[2000px]"
            >
              {/* Decorative Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

              {/* The "Main Dashboard" Card (The Foundation) */}
              <motion.div 
                animate={{ 
                  rotateY: [-10, -5, -10],
                  rotateX: [5, 10, 5],
                  y: [0, -10, 0]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-full max-w-[500px] aspect-video bg-white rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Dashboard Sidebar Placeholder */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-slate-50 border-r border-slate-100 p-4 space-y-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 rounded-lg bg-slate-200/50" />)}
                </div>
                {/* Dashboard Content Placeholder */}
                <div className="ml-16 p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                    <div className="h-8 w-8 rounded-full bg-blue-50" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-50 border border-slate-100" />)}
                  </div>
                  <div className="h-32 rounded-xl bg-blue-50/30 border border-blue-100 relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent" />
                  </div>
                </div>
              </motion.div>

              {/* The "Terminal POS" Tablet (Floating in front) */}
              <motion.div 
                animate={{ 
                   y: [-20, 20, -20],
                   rotateY: [-15, -25, -15],
                   x: [0, 10, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-[-40px] bottom-[-20px] w-[280px] h-[400px] bg-white rounded-3xl shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] border border-slate-200 p-6 z-20 hidden md:block"
              >
                <div className="h-full rounded-2xl border border-slate-100 flex flex-col">
                  <div className="p-4 border-b border-slate-50 flex justify-between">
                     <div className="w-8 h-2 bg-slate-200 rounded" />
                     <Package className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 p-4 grid grid-cols-2 gap-2 content-start">
                     {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square bg-slate-50 rounded-lg" />)}
                  </div>
                  <div className="p-4 bg-blue-600 rounded-xl m-2">
                     <div className="h-3 w-full bg-white/20 rounded" />
                  </div>
                </div>
              </motion.div>

              {/* Floating Insight Bubbles */}
              <motion.div 
                animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-10 left-[-20px] bg-white px-5 py-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 z-30"
              >
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth</div>
                   <div className="text-lg font-bold text-slate-900">+24.8%</div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 30, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-[40%] right-[-60px] bg-white p-3 rounded-2xl shadow-2xl border border-slate-100 z-30 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                   <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <div className="pr-2">
                   <div className="text-[9px] font-bold text-slate-600">Stock Alert</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Emotional Agitation Section */}
      <section id="masalah" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-[1300px] mx-auto px-6 relative z-10 text-center lg:text-left">
          <div className="lg:max-w-3xl mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight text-slate-900">Kami Tahu Apa yang Membuat Anda Tidak Bisa Tidur Nyenyak.</h2>
            <p className="text-slate-500 text-lg font-medium">Menjalankan bisnis itu berat. Menjalankan bisnis dengan sistem yang membabi-buta? Itu mimpi buruk.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <CardPain 
              icon={<Package className="w-10 h-10 text-red-500" />}
              title="Stok Bocor Diam-diam"
              desc="Barang di gudang dan di catatan komputer selalu berbeda? Kebocoran ini diam-diam membunuh profit Anda setiap hari tanpa Anda sadari."
            />
            <CardPain 
              icon={<Store className="w-10 h-10 text-orange-500" />}
              title="Kasir Mati Saat Ramai"
              desc="Konsumen marah karena kasir macet saat internet putus. Antrean mengular, potensi omzet hilang begitu saja di depan mata Anda."
            />
            <CardPain 
              icon={<TrendingUp className="w-10 h-10 text-blue-600" />}
              title="Kebutaan Finansial"
              desc="Tiap hari jualan laris, tapi uang kas kosong di akhir bulan? Pencatatan manual membuat Anda buta arah dan rawan kebangkrutan."
            />
          </div>
        </div>
      </section>

      {/* Product Detail Sections */}
      <section id="inventory" className="py-24 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
              <Package className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Inventory & Supply Chain <span className="text-[#0044CC]">Solid</span>.</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              Akar dari setiap bisnis yang sukses adalah manajemen stok yang presisi. Kazana memastikan setiap SKU Anda terdata, setiap mutasi stok tercatat, dan stok opname tidak lagi menjadi mimpi buruk akhir bulan.
            </p>
            <ul className="space-y-3">
              {[
                "Multi-gudang dan Multi-lokasi",
                "Riwayat Mutasi Stok Real-time",
                "Barcode & QR Code Printing",
                "Laporan Stok Minimum (Low Stock Alert)"
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-[#0044CC]" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-inner">
             <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 italic text-slate-500 text-sm">
                "Dulu stok kami sering selisih jutaan rupiah setiap bulan. Sejak pakai Kazana, selisih stok hampir 0%."
             </div>
          </div>
        </div>
      </section>

      <section id="pos" className="py-24 bg-slate-50">
        <div className="max-w-[1300px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center lg:direction-rtl">
          <div className="lg:order-2 space-y-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#0044CC]">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Kasir yang <span className="text-[#0044CC]">Mencintai</span> Pelanggan Anda.</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              Jangan biarkan teknologi yang lambat merusak momen belanja pelanggan. POS Kazana didesain untuk kecepatan tinggi, kemudahan penggunaan (zero learning curve), dan tetap bekerja meski koneksi internet terputus.
            </p>
            <ul className="space-y-3">
              {[
                "Sinkronisasi Offline-First",
                "Support Printer Thermal & Bluetooth",
                "Manajemen Shift & Kas Keluar-Masuk",
                "Loyalty Program & Customer Database"
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-[#0044CC]" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:order-1 relative group rounded-3xl overflow-hidden min-h-[400px] flex items-center justify-center bg-[#020617] border border-slate-800 shadow-2xl">
             {/* Dynamic Background */}
             <div className="absolute inset-0 bg-gradient-to-br from-[#0044CC] via-[#0055EE] to-[#002288] opacity-90" />
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
             
             {/* Animated Glows */}
             <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 rounded-full blur-[100px]" 
             />
             
             {/* Glassmorphic Card */}
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               whileInView={{ y: 0, opacity: 1 }}
               viewport={{ once: true }}
               className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-12 rounded-[2.5rem] shadow-3xl text-center max-w-[85%]"
             >
                <div className="flex justify-center mb-6">
                   <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center border border-white/20 shadow-inner">
                      <Zap className="w-10 h-10 text-white fill-white/20" />
                   </div>
                </div>
                <div className="text-5xl font-black mb-3 tracking-tightest text-white drop-shadow-2xl">
                   OFFLINE <span className="text-blue-300 italic">READY</span>
                </div>
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent mx-auto mb-4" />
                <p className="text-blue-100 font-extrabold uppercase tracking-[0.3em] text-[10px] leading-tight opacity-90">
                   Jualan Jalan Terus <br/> Tanpa Internet
                </p>
             </motion.div>

             {/* Background Store Icon - More Subtle */}
             <Store className="w-64 h-64 text-white/5 absolute -bottom-10 -right-10 rotate-12" />
          </div>
        </div>
      </section>

      <section id="accounting" className="py-24 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Akuntansi Otomatis, <span className="text-[#0044CC]">Keputusan Cerdas</span>.</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              Anda tidak perlu menjadi akuntan untuk menguasai keuangan bisnis. Kazana menjurnal setiap transaksi secara otomatis ke dalam Buku Besar, sehingga Laporan Laba/Rugi selalu siap saat Anda membutuhkannya.
            </p>
            <ul className="space-y-3">
              {[
                "Jurnal Umum Otomatis",
                "Buku Besar & Neraca Saldo",
                "Laporan Laba/Rugi Konsolidasi",
                "Manajemen Aset & Depresiasi"
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-[#0044CC]" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#020617] rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800/50">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <TrendingUp className="w-48 h-48" />
             </div>
             <div className="relative z-10">
                <div className="text-xs font-black text-blue-300 uppercase tracking-widest mb-4">Financial Insight</div>
                <div className="text-3xl font-bold mb-6 italic tracking-tight">"Profit bersih Anda naik 24% bulan ini."</div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full w-[74%] bg-blue-500" />
                </div>
             </div>
          </div>
        </div>
      </section>

      <section id="production" className="py-24 bg-slate-50">
        <div className="max-w-[1300px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center lg:direction-rtl">
          <div className="lg:order-2 space-y-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <Settings2 className="w-6 h-6" />
            </div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-900">Produksi Terukur, <span className="text-[#0044CC]">HPP Akurat</span>.</h2>
            <p className="text-lg text-slate-600 leading-relaxed font-medium">
              Mengontrol bahan baku untuk produk jadi sering kali membingungkan. Modul Produksi Kazana membantu Anda merancang Resep (BOM), menghitung biaya produksi per item, dan menjaga konsistensi kualitas.
            </p>
            <ul className="space-y-3">
              {[
                "Bill of Materials (Resep Produk)",
                "Tracking Batch Produksi",
                "Perhitungan Bahan Baku Otomatis",
                "Optimasi Kapasitas Produksi"
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-slate-700 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-[#0044CC]" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:order-1 bg-white border border-slate-200 rounded-3xl p-12 shadow-xl flex flex-col justify-center">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl" />
                <div>
                   <div className="text-sm font-black text-slate-900 tracking-tight">Produksi #782 - Roti Tawar</div>
                   <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Selesai • 500 Unit</div>
                </div>
             </div>
             <div className="space-y-4">
                <div className="h-8 bg-slate-50 rounded border border-slate-100 w-full" />
                <div className="h-8 bg-slate-50 rounded border border-slate-100 w-4/5" />
                <div className="h-8 bg-slate-50 rounded border border-slate-100 w-3/4" />
             </div>
          </div>
        </div>
      </section>

      {/* Pricing / Modules Section */}
      <section id="harga" className="py-24 bg-slate-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 mb-6">
              Bayar Hanya Modul yang Anda Butuhkan.
            </h2>
            <p className="text-xl text-slate-600 font-medium">
              Sistem SaaS modular pertama di Indonesia. Kustomisasi ERP Anda sesuai skala bisnis.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {MODULES.map((module) => {
              const Icon = module.icon;
              const isFree = module.id === "inventory";
              
              return (
                <div 
                  key={module.id}
                  className={`flex flex-col relative rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 bg-white ${
                    module.popular 
                      ? "border-2 border-[#0044CC] shadow-2xl shadow-blue-500/10 ring-4 ring-blue-50" 
                      : "border border-slate-200 shadow-xl shadow-slate-200/50 hover:border-slate-300"
                  }`}
                >
                  {module.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#0044CC] text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg whitespace-nowrap">
                      Paling Dibutuhkan
                    </div>
                  )}

                  <div className="space-y-6 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      module.color === "blue" ? "bg-blue-50 text-blue-600" :
                      module.color === "amber" ? "bg-amber-50 text-amber-600" :
                      module.color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      <Icon className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">{module.name}</h3>
                      <p className="text-sm font-medium text-slate-500 mt-2 min-h-[40px]">{module.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1 py-4">
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mr-1">Rp</span>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">
                        {module.price.toLocaleString("id-ID")}
                      </span>
                      {!isFree && <span className="text-sm font-bold text-slate-400">/ bln</span>}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      {module.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <CheckCircle2 className={`w-5 h-5 shrink-0 ${module.color === "blue" ? "text-blue-600" : "text-slate-400"}`} />
                          <span className="text-sm font-medium text-slate-700 leading-tight">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6">
                    <Link href={`/login?module=${module.id}`}>
                      <Button
                        className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${
                          module.popular
                            ? "bg-[#0044CC] text-white hover:bg-blue-700"
                            : isFree
                            ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                            : "bg-white border-2 border-slate-200 text-slate-900 hover:border-slate-300"
                        }`}
                      >
                        {module.buttonText}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Consultation / Help CTA */}
      <section className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 mb-6">
            Ingin tahu lebih lanjut?
          </h2>
          <p className="text-xl text-slate-500 font-medium mb-10">
            Jika Anda butuh saran fitur apa yang tepat untuk usahamu, tim kami akan dengan senang hati membantu.
          </p>
          <a href="https://wa.me/6283135183093?text=halo%20kak%20saya%20butuh%20bantuan%20teknis%20Kazana" target="_blank" rel="noopener noreferrer">
                 <button className="h-16 px-12 bg-[#0044CC] hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-[10px]">
                    Hubungi Support WhatsApp
                 </button>
               </a>
        </div>
      </section>

    </FrontLayout>
  );
}

function CardPain({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:border-slate-200 transition-all duration-300">
      <div className="mb-6 bg-slate-50 w-16 h-16 flex items-center justify-center rounded-2xl">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-slate-900">{title}</h3>
      <p className="text-slate-600 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}

function SparklesIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
