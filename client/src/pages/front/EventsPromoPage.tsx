import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { Ticket, Calendar, Gift, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const PROMOS = [
  {
    title: "Ramadan Super Sale: Diskon 50% Seluruh Modul",
    expiry: "30 Apr 2024",
    code: "RAMADAN50",
    desc: "Sambut lebaran dengan sistem kasir baru. Berlaku untuk langganan tahunan.",
    type: "Promo"
  },
  {
    title: "Webinar: Strategi Profitabilitas Cafe 2024",
    date: "15 Mei 2024",
    time: "14:00 - 16:00 WIB",
    desc: "Belajar langsung dari pakar bisnis F&B tentang cara mengoptimalkan HPP.",
    type: "Event"
  }
];

export default function EventsPromoPage() {
  return (
    <FrontLayout 
      title="Event & Promo" 
      description="Temukan berbagai promo menarik dan daftar event eksklusif dari Kazana ERP untuk pertumbuhan bisnis Anda."
    >
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6">
           <div className="text-center mb-24">
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 pb-3">
                 Event & <span className="text-[#0044CC]">Promo Menarik</span>.
              </motion.h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                 Jangan lewatkan berbagai penawaran spesial dan sesi belajar eksklusif bersama komunitas pengusaha Kazana.
              </p>
           </div>

           <div className="grid lg:grid-cols-2 gap-12 mb-32">
              {PROMOS.map((p, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className={`p-12 rounded-[3.5rem] border relative overflow-hidden ${p.type === 'Promo' ? 'bg-[#0044CC] text-white border-blue-500 shadow-2xl shadow-blue-500/20' : 'bg-slate-50 text-slate-900 border-slate-100 shadow-xl'}`}
                >
                   <div className="relative z-10 flex flex-col h-full">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-10 ${p.type === 'Promo' ? 'bg-white/20' : 'bg-blue-100 text-[#0044CC]'}`}>
                         {p.type === 'Promo' ? <Gift className="w-8 h-8" /> : <Calendar className="w-8 h-8" />}
                      </div>
                      <div className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-70">{p.type}</div>
                      <h3 className={`text-3xl font-black mb-6 leading-tight ${p.type === 'Promo' ? 'text-white' : 'text-slate-900'}`}>{p.title}</h3>
                      <p className={`font-medium mb-12 flex-1 ${p.type === 'Promo' ? 'text-blue-50/90' : 'text-slate-500'}`}>
                         {p.desc}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                         {p.type === 'Promo' ? (
                           <>
                             <div className="px-8 h-16 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center gap-4">
                                <span className="text-xs font-bold opacity-60 uppercase">Kode</span>
                                <span className="text-xl font-black tracking-widest">{p.code}</span>
                             </div>
                             <Button className="h-16 px-10 bg-white text-blue-600 hover:bg-slate-100 font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs">
                                Ambil Promo
                             </Button>
                           </>
                         ) : (
                           <Button className="h-16 px-10 bg-[#0044CC] text-white hover:bg-blue-700 font-black rounded-2xl shadow-xl uppercase tracking-widest text-xs flex items-center gap-2">
                              Daftar Event <Ticket className="w-5 h-5" />
                           </Button>
                         )}
                      </div>
                   </div>
                   
                   {p.type === 'Promo' && (
                     <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
                   )}
                </motion.div>
              ))}
           </div>
        </div>
      </section>
    </FrontLayout>
  );
}
