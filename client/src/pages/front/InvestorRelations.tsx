import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { 
  TrendingUp, Globe, BarChart3, Target, 
  ArrowRight, ShieldCheck, Zap, Rocket 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ROADMAP = [
  {
    year: "2024",
    title: "Vertical Expansion & Ecosystem",
    status: "In Progress",
    items: [
      "Peluncuran Modul Khusus Laundry & F&B",
      "Integrasi WhatsApp Business API otomatis",
      "Sistem Kasir Offline-First tingkat lanjut",
      "Target: 5,000+ Merchant Aktif"
    ]
  },
  {
    year: "2025",
    title: "AI Core & Financial Integration",
    status: "Upcoming",
    items: [
      "Predictive Analytics untuk stok & permintaan",
      "Automated Bookkeeping AI",
      "Sistem Pembayaran Terintegrasi (Payment Gateway)",
      "Target: 20,000+ Merchant & Pendanaan Seri A"
    ]
  },
  {
    year: "2026",
    title: "SEA Expansion & Supply Chain",
    status: "Long-term",
    items: [
      "Ekspansi ke Vietnam & Thailand",
      "Konektifitas Supply Chain (B2B Marketplace)",
      "Solusi Pembiayaan Modal Kerja UMKM",
      "Target: Menjadi ERP UMKM No.1 di Asia Tenggara"
    ]
  }
];

export default function InvestorRelations() {
  return (
    <FrontLayout 
      title="Investor Relations" 
      description="Bergabunglah dalam perjalanan Kazana ERP membangun masa depan ekonomi digital untuk jutaan UMKM di Indonesia dan Asia Tenggara."
    >
      <section className="pt-40 pb-32 bg-[#020617] text-white overflow-hidden relative">
         {/* Decorative elements */}
         <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay" />
         <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-[#0044CC]/20 rounded-full blur-[150px] animate-pulse" />
         <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px]" />
         
         <div className="max-w-[1300px] mx-auto px-6 relative z-10 text-center">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 40 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            >
               <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 backdrop-blur-md">
                  <Rocket className="w-4 h-4 animate-bounce" /> Capital for Growth
               </div>
               <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-10 leading-[0.85] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                  Membangun <br/>
                  <span className="text-[#0044CC] drop-shadow-[0_0_30px_rgba(0,68,204,0.3)]">Masa Depan</span> <br/>
                  Ekonomi UMKM.
               </h1>
               <p className="text-xl lg:text-2xl text-slate-400 font-medium max-w-3xl mx-auto mb-16 leading-relaxed">
                  Kazana ERP bukan sekadar software kasir. Kami adalah <span className="text-white">infrastruktur digital</span> yang memberdayakan jutaan pengusaha untuk naik kelas.
               </p>
               <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <a href="https://wa.me/6283135183093?text=Halo%20CEO%20Kazana%2C%20saya%20tertarik%20berdiskusi%20mengenai%20peluang%20investasi" target="_blank" rel="noopener noreferrer">
                    <Button className="h-20 px-14 bg-[#0044CC] hover:bg-blue-600 text-white font-black rounded-3xl shadow-[0_20px_50px_rgba(0,68,204,0.3)] border-t border-white/20 uppercase tracking-[0.2em] text-xs transition-all hover:-translate-y-1">
                        Discuss Investment Opportunity
                    </Button>
                  </a>
                  <Button variant="outline" className="h-20 px-14 border-white/10 hover:bg-white/5 text-white font-black rounded-3xl uppercase tracking-[0.2em] text-xs backdrop-blur-md transition-all hover:border-white/20">
                     Download Pitch Deck (PDF)
                  </Button>
               </div>
            </motion.div>
         </div>
      </section>

      <section className="py-32 bg-white relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#020617] to-white opacity-100" />
         
         <div className="max-w-[1300px] mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-20 items-center mb-40">
               <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
               >
                  <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tighter mb-10 leading-[0.9]">Peluang Pasar <br/><span className="text-[#0044CC] italic underline decoration-blue-100 underline-offset-8">Unicorn</span>.</h2>
                  <p className="text-xl text-slate-600 font-medium leading-relaxed mb-12">
                     Indonesia memiliki lebih dari 64 juta UMKM, namun kurang dari 20% yang sudah terdigitalisasi secara maksimal. Kazana mengisi celah tersebut dengan sistem modular yang scalable dan terjangkau.
                  </p>
                  <div className="grid grid-cols-2 gap-12">
                     <div className="space-y-3">
                        <div className="text-5xl font-black text-[#0044CC] tracking-tighter">64M+</div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Total Target UMKM</div>
                     </div>
                     <div className="space-y-3">
                        <div className="text-5xl font-black text-[#0044CC] tracking-tighter">$10B+</div>
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Digital Economy Potential</div>
                     </div>
                  </div>
               </motion.div>
               <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="p-16 bg-slate-900 rounded-[4rem] flex items-center justify-center relative overflow-hidden shadow-2xl shadow-blue-900/20"
               >
                   <div className="absolute top-0 right-0 p-12 opacity-10">
                      <BarChart3 className="w-80 h-80 text-blue-500" />
                   </div>
                   <div className="relative z-10 text-center text-white">
                       <div className="w-24 h-24 bg-[#0044CC] rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl shadow-blue-500/20 rotate-6">
                          <TrendingUp className="w-12 h-12 text-white" />
                       </div>
                       <div className="text-3xl font-black mb-4 tracking-tight">Pilar Pertumbuhan Kazana</div>
                       <div className="text-blue-200/60 font-medium tracking-widest uppercase text-xs">Modular / Affordable / AI-Enabled</div>
                   </div>
               </motion.div>
            </div>

            <div className="mb-24">
               <div className="text-center mb-20">
                  <h2 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter mb-4">Strategi & Roadmap.</h2>
                  <p className="text-lg text-slate-500 font-medium italic">Visi jangka panjang untuk mendominasi pasar SaaS di wilayah regional.</p>
               </div>
               
               <div className="grid lg:grid-cols-3 gap-8">
                  {ROADMAP.map((step, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-10 rounded-[3rem] border relative overflow-hidden ${step.year === '2024' ? 'bg-blue-50 border-blue-200 shadow-xl' : 'bg-white border-slate-100 shadow-lg'}`}
                    >
                       <div className="flex justify-between items-start mb-8 text-slate-900">
                          <div className="text-4xl font-black">{step.year}</div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${step.year === '2024' ? 'bg-[#0044CC] text-white' : 'bg-slate-100 text-slate-500'}`}>
                             {step.status}
                          </div>
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">{step.title}</h3>
                       <ul className="space-y-4">
                          {step.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                               <div className="w-1.5 h-1.5 bg-[#0044CC] rounded-full mt-1.5" />
                               <span className="text-sm font-medium text-slate-600 leading-tight">{item}</span>
                            </li>
                          ))}
                       </ul>
                    </motion.div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      <section className="py-24 bg-[#0044CC] text-white">
         <div className="max-w-[1300px] mx-auto px-6 text-center">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-12">Ready to Build the Future?</h2>
            <p className="text-xl text-blue-100 font-medium max-w-2xl mx-auto mb-12">
               Mari berdiskusi bagaimana visi Kazana bisa memberikan dampak masif pada pertumbuhan ekonomi inklusif di Indonesia.
            </p>
            <div className="flex justify-center">
               <a href="mailto:investor@kazana.id">
                  <Button className="h-16 px-12 bg-white text-[#0044CC] hover:bg-blue-50 font-black rounded-2xl shadow-2xl uppercase tracking-widest text-xs flex items-center gap-3">
                     Contact Investor Hub <ArrowRight className="w-4 h-4" />
                  </Button>
               </a>
            </div>
         </div>
      </section>
    </FrontLayout>
  );
}
