import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { Quote, ArrowRight, TrendingUp, Users, Zap } from "lucide-react";

const CASE_STUDIES = [
  {
    title: "Bagaimana Kopi Kenangan Lokal Menaikkan Transaksi 40% dengan Kazana",
    client: "Kopi Kenangan Lokal",
    category: "Food & Beverage",
    result: "40% Kenaikan Transaksi",
    desc: "Melalui sistem antrean digital dan manajemen stok bahan baku yang presisi, Kopi Kenangan Lokal berhasil mengurangi pemborosan bahan sebesar 15%.",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Digitalisasi Stok Minimarket Syariah: Dari Manual ke Otomatis",
    client: "Minimarket Syariah",
    category: "Retail",
    result: "Stock Opname 5x Lebih Cepat",
    desc: "Dulu membutuhkan waktu 3 hari untuk stok opname 2.000 SKU. Sekarang hanya butuh 4 jam dengan fitur Barcode Scanner Kazana.",
    image: "https://images.unsplash.com/photo-1534452286362-623b137175f1?auto=format&fit=crop&q=80&w=800"
  }
];

export default function CaseStudiesPage() {
  return (
    <FrontLayout 
      title="Studi Kasus" 
      description="Lihat bagaimana berbagai bisnis di Indonesia sukses bertransformasi secara digital dengan menggunakan Kazana ERP."
    >
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6">
           <div className="text-center mb-24">
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 pb-3">
                 Kisah Sukses <br/><span className="text-[#0044CC]">Bersama Kazana</span>.
              </motion.h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                 Lihat bagaimana pengusaha Indonesia bertransformasi dan memenangkan pasar dengan bantuan teknologi ERP yang tepat.
              </p>
           </div>

           <div className="space-y-24">
              {CASE_STUDIES.map((cs, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`flex flex-col lg:flex-row items-center gap-16 ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
                >
                   <div className="flex-1 relative">
                      <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white relative z-10">
                         <img src={cs.image} alt={cs.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -bottom-8 -right-8 bg-[#0044CC] text-white p-8 rounded-3xl shadow-2xl z-20 hidden md:block">
                         <div className="text-3xl font-black tracking-tight mb-1">{cs.result}</div>
                         <div className="text-xs font-bold uppercase tracking-widest text-blue-200">Hasil Nyata</div>
                      </div>
                   </div>

                   <div className="flex-1 space-y-8">
                      <div className="inline-block px-4 py-1.5 bg-blue-50 text-[#0044CC] rounded-full text-xs font-black uppercase tracking-widest">
                         {cs.category}
                      </div>
                      <h2 className="text-3xl lg:text-5xl font-black text-slate-900 leading-tight">
                         {cs.title}
                      </h2>
                      <div className="flex items-center gap-2 text-slate-400">
                         <Quote className="w-8 h-8 opacity-20" />
                         <p className="text-xl text-slate-600 font-medium leading-relaxed italic">
                            {cs.desc}
                         </p>
                      </div>
                      <div className="pt-4 flex gap-4">
                         <button className="h-14 px-8 bg-[#020617] text-white font-black rounded-2xl flex items-center gap-2 hover:bg-slate-800 transition-all uppercase tracking-widest text-xs border border-slate-800">
                            Baca Dokumentasi Lengkap <ArrowRight className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 border-y border-slate-100">
         <div className="max-w-[1300px] mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12 text-center">
               <div className="space-y-4">
                  <div className="text-4xl font-black text-[#0044CC]">5.000+</div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">UMKM Terdaftar</p>
               </div>
               <div className="space-y-4">
                  <div className="text-4xl font-black text-[#0044CC]">Rp 2T+</div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Volume Transaksi Gabungan</p>
               </div>
               <div className="space-y-4">
                  <div className="text-4xl font-black text-[#0044CC]">98%</div>
                  <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Tingkat Kepuasan Pelanggan</p>
               </div>
            </div>
         </div>
      </section>
    </FrontLayout>
  );
}
