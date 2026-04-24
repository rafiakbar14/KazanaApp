import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { Search, Book, MessageSquare, PlayCircle, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

const FAQS = [
  {
    q: "Apakah Kazana ERP bisa digunakan tanpa internet?",
    a: "Ya! Kazana ERP menggunakan teknologi Offline-First. Anda tetap bisa melakukan transaksi kasir saat internet mati, dan data akan otomatis tersinkronisasi saat kembali online."
  },
  {
    q: "Berapa biaya langganan bulanan Kazana?",
    a: "Kami memiliki paket modular mulai dari Rp 0 untuk System Core hingga paket lengkap untuk Restoran dan Retail. Cek halaman Harga untuk detail lengkap."
  },
  {
    q: "Apakah saya bisa upgrade modul di tengah jalan?",
    a: "Tentu saja. Anda bisa mengaktifkan atau menonaktifkan modul kapan saja sesuai kebutuhan perkembangan bisnis Anda."
  },
  {
    q: "Bagaimana dengan keamanan data bisnis saya?",
    a: "Data Anda dienkripsi menggunakan standar perbankan. Kami melakukan backup otomatis setiap hari untuk memastikan data Anda tidak pernah hilang."
  }
];

export default function HelpCenter() {
  return (
    <FrontLayout 
      title="Pusat Bantuan" 
      description="Temukan jawaban atas pertanyaan Anda, panduan penggunaan, dan dukungan teknis untuk Kazana ERP."
    >
      <section className="pt-40 pb-20 bg-[#0044CC] text-white">
        <div className="max-w-[1300px] mx-auto px-6 text-center">
           <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-7xl font-black tracking-tighter text-white mb-8 pb-3">
              Ada yang bisa kami bantu?
           </motion.h1>
           <div className="max-w-2xl mx-auto relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0044CC] transition-colors" />
              <Input 
                className="h-20 w-full pl-16 pr-8 rounded-[2rem] bg-white text-slate-900 text-lg border-none shadow-2xl focus:ring-4 focus:ring-blue-400/30"
                placeholder="Cari bantuan, tutorial, atau pertanyaan..."
              />
           </div>
        </div>
      </section>

      <section className="py-24 bg-white">
         <div className="max-w-[1300px] mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-8 -mt-32">
               {[
                 { icon: Book, title: "Dokumentasi", desc: "Panduan lengkap penggunaan setiap modul.", color: "blue" },
                 { icon: PlayCircle, title: "Video Tutorial", desc: "Belajar visual cara setup dan operasional.", color: "green" },
                 { icon: MessageSquare, title: "Live Chat", desc: "Bicara langsung dengan tim support kami.", color: "indigo" }
               ].map((c, i) => {
                 const Icon = c.icon;
                 return (
                   <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    className="p-10 bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 hover:-translate-y-2 transition-all cursor-pointer group"
                   >
                      <div className={`w-14 h-14 bg-${c.color}-50 rounded-2xl flex items-center justify-center text-${c.color}-600 mb-8`}>
                         <Icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2">{c.title}</h3>
                      <p className="text-slate-500 font-medium mb-6">{c.desc}</p>
                      <div className="text-[#0044CC] font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                         Lihat Detail <ChevronRight className="w-4 h-4" />
                      </div>
                   </motion.div>
                 );
               })}
            </div>

            <div className="mt-32 max-w-3xl mx-auto">
               <h2 className="text-4xl font-black text-slate-900 mb-12 text-center">Pertanyaan Populer</h2>
               <div className="space-y-6">
                  {FAQS.map((faq, i) => (
                    <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                       <h4 className="text-xl font-bold text-slate-900 mb-4">{faq.q}</h4>
                       <p className="text-slate-600 font-medium leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      <section className="py-24 bg-[#020617] text-white rounded-t-[4rem] border-t border-slate-800">
         <div className="max-w-[1300px] mx-auto px-6 text-center">
            <h2 className="text-3xl lg:text-5xl font-black mb-8 text-white">Masih belum menemukan jawaban?</h2>
            <p className="text-xl text-slate-400 font-medium mb-12">Hubungi tim kami 24/7. Kami siap membantu kelancaran bisnis Anda.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <a href="https://wa.me/6283135183093?text=halo%20kak%20saya%20butuh%20bantuan%20teknis%20Kazana" target="_blank" rel="noopener noreferrer">
                 <button className="h-16 px-12 bg-[#0044CC] hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl transition-all uppercase tracking-widest text-[10px]">
                    Hubungi Support WhatsApp
                 </button>
               </a>
               <button className="h-16 px-12 bg-white/10 hover:bg-white/20 text-white border border-white/10 font-black rounded-2xl transition-all uppercase tracking-widest text-[10px]">
                  Kirim Tiket Bantuan
               </button>
            </div>
         </div>
      </section>
    </FrontLayout>
  );
}
