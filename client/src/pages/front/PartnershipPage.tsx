import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { Handshake, TrendingUp, ShieldCheck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PartnershipPage() {
  const benefits = [
    {
      title: "Komisi Menarik",
      desc: "Dapatkan bagi hasil berkelanjutan untuk setiap klien yang Anda bawa ke ekosistem Kazana.",
      icon: TrendingUp
    },
    {
      title: "Dukungan Teknis",
      desc: "Tim ahli kami siap membantu proses implementasi dan training di sisi klien Anda.",
      icon: ShieldCheck
    },
    {
      title: "Akses Eksklusif",
      desc: "Jadi yang pertama mencoba fitur beta dan mendapatkan materi marketing premium.",
      icon: Globe
    }
  ];

  return (
    <FrontLayout 
      title="Program Kemitraan" 
      description="Bergabunglah sebagai mitra Kazana ERP dan bantu UMKM Indonesia bertransformasi digital sambil meningkatkan pendapatan Anda."
    >
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 leading-tight">
              Tumbuh Bersama <br/><span className="text-[#0044CC]">Kemitraan Kazana</span>.
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
              Bergabunglah dengan jaringan mitra kami dan bantu jutaan UMKM Indonesia bertransformasi secara digital sambil meningkatkan pendapatan Anda.
            </p>
            
            <div className="space-y-8">
               {benefits.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div key={i} className="flex gap-6 items-start">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0044CC] shrink-0">
                          <Icon className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="text-xl font-bold text-slate-900 mb-1">{b.title}</h4>
                          <p className="text-slate-500 font-medium leading-relaxed">{b.desc}</p>
                       </div>
                    </div>
                  );
               })}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50"
          >
             <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Daftar Jadi Mitra</h3>
             <form className="space-y-6">
                <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                   <Input className="h-14 rounded-2xl border-slate-200 bg-white" placeholder="Nama Anda" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Perusahaan / Agensi</label>
                   <Input className="h-14 rounded-2xl border-slate-200 bg-white" placeholder="Nama Perusahaan" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email Bisnis</label>
                   <Input className="h-14 rounded-2xl border-slate-200 bg-white" placeholder="email@perusahaan.com" type="email" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Kategori Kemitraan</label>
                   <select className="w-full h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-[#0044CC]/20 transition-all">
                      <option>Mitra Penjualan (Reseller)</option>
                      <option>Mitra Teknologi (Integration)</option>
                      <option>Mitra Strategis</option>
                   </select>
                </div>
                <Button className="w-full h-16 bg-[#0044CC] hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest flex items-center justify-center gap-2">
                   Ajukan Kemitraan <Handshake className="w-5 h-5" />
                </Button>
             </form>
          </motion.div>
        </div>
      </section>
    </FrontLayout>
  );
}
