import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { Target, Users, ShieldCheck, Zap } from "lucide-react";

export default function AboutUs() {
  const values = [
    {
      title: "Inovasi Tanpa Henti",
      desc: "Kami terus mengembangkan fitur AI terbaru untuk membantu pengusaha mengambil keputusan berbasis data.",
      icon: Zap
    },
    {
      title: "Keamanan Mutlak",
      desc: "Menjaga data bisnis pelanggan adalah amanah utama yang kami jaga dengan teknologi enkripsi tercanggih.",
      icon: ShieldCheck
    },
    {
      title: "Fokus pada UMKM",
      desc: "Solusi kami dirancang modular agar terjangkau dan tepat guna bagi segala skala usaha.",
      icon: Target
    },
    {
      title: "Kolaborasi Tim",
      desc: "Kazana dibangun oleh para ahli yang peduli pada kemajuan ekonomi digital Indonesia.",
      icon: Users
    }
  ];

  return (
    <FrontLayout 
      title="Tentang Kami" 
      description="Kenali visi Kazana ERP untuk mendigitalisasi UMKM Indonesia dan misi kami dalam memberdayakan pengusaha lokal."
    >
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
             <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
                <h1 className="text-4xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 leading-tight">
                   Membangun Masa Depan <br/><span className="text-[#0044CC]">Ekosistem Bisnis</span>.
                </h1>
                <p className="text-xl text-slate-500 font-medium leading-relaxed">
                   Kazana ERP lahir dari visi sederhana: menyederhanakan kompleksitas operasional bisnis agar pengusaha bisa fokus pada pertumbuhan, bukan administratif.
                </p>
             </motion.div>
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white">
                   <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800" alt="Office Life" className="w-full h-full object-cover" />
                </div>
             </motion.div>
          </div>

          <div className="mb-32">
             <div className="text-center mb-20">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Nilai-Nilai Kami</h2>
             </div>
             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((v, i) => {
                   const Icon = v.icon;
                   return (
                     <div key={i} className="p-8 bg-slate-50 rounded-3xl border border-slate-100 hover:border-blue-200 transition-all">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#0044CC] mb-6 shadow-sm">
                           <Icon className="w-6 h-6" />
                        </div>
                        <h4 className="text-xl font-bold text-slate-900 mb-3">{v.title}</h4>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">{v.desc}</p>
                     </div>
                   );
                })}
             </div>
          </div>

          <div className="bg-[#020617] rounded-[4rem] p-12 lg:p-24 text-center relative overflow-hidden border border-slate-800/50">
             <div className="relative z-10">
                <h2 className="text-3xl lg:text-5xl font-black mb-8 text-white">Visi Kami</h2>
                <p className="text-xl lg:text-3xl text-slate-300 font-light italic leading-snug max-w-4xl mx-auto">
                   "Menjadi partner teknologi terpercaya yang memberdayakan satu juta UMKM Indonesia untuk go-digital dan bersaing di pasar global pada tahun 2030."
                </p>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
          </div>
        </div>
      </section>
    </FrontLayout>
  );
}
