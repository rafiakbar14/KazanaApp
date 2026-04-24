import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const JOBS = [
  {
    title: "Senior Fullstack Developer",
    location: "Jakarta / Remote",
    type: "Full-time",
    dept: "Engineering"
  },
  {
    title: "Product Marketing Manager",
    location: "Jakarta",
    type: "Full-time",
    dept: "Marketing"
  },
  {
    title: "UX Designer",
    location: "Remote",
    type: "Contract",
    dept: "Design"
  },
  {
    title: "B2B Sales Executive",
    location: "Surabaya",
    type: "Full-time",
    dept: "Sales"
  }
];

export default function CareersPage() {
  return (
    <FrontLayout 
      title="Karir di Kazana" 
      description="Bergabunglah dengan tim inovatif Kazana ERP dan bantu kami membangun masa depan ekonomi digital Indonesia."
    >
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6">
           <div className="text-center mb-24">
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 pb-3">
                 Bangun Masa Depan <br/><span className="text-[#0044CC]">Ekonomi Digital</span>.
              </motion.h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                 Bergabunglah dengan tim Kazana dan bantu kami mengubah cara pengusaha Indonesia mengelola bisnis mereka.
              </p>
           </div>

           <div className="grid lg:grid-cols-3 gap-8 mb-32">
              <div className="col-span-1 lg:col-span-1 space-y-8">
                 <div className="p-10 bg-blue-50 rounded-[3rem] border border-blue-100">
                    <h3 className="text-2xl font-black text-slate-900 mb-4">Budaya Kami</h3>
                    <p className="text-slate-600 font-medium leading-relaxed">
                       Di Kazana, kami percaya pada otonomi, transparansi, dan inovasi berbasis data. Kami bekerja keras, namun tetap menjaga keseimbangan hidup.
                    </p>
                 </div>
                 <div className="p-10 bg-[#020617] rounded-[3rem] text-white border border-slate-800">
                    <h3 className="text-2xl font-black mb-4">Benefit</h3>
                    <ul className="space-y-4 text-slate-300 font-medium">
                       <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#0044CC] rounded-full"/> Gaji Kompetitif</li>
                       <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#0044CC] rounded-full"/> Flexible Working Hours</li>
                       <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#0044CC] rounded-full"/> Asuransi Kesehatan</li>
                       <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-[#0044CC] rounded-full"/> Dana Pengembangan Diri</li>
                    </ul>
                 </div>
              </div>

              <div className="col-span-1 lg:col-span-2 space-y-6">
                 <h3 className="text-3xl font-black text-slate-900 mb-8 px-4">Lowongan Aktif</h3>
                 {JOBS.map((j, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                       className="group p-8 bg-white rounded-3xl border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                    >
                       <div className="space-y-2">
                          <div className="text-xs font-black text-[#0044CC] uppercase tracking-widest">{j.dept}</div>
                          <h4 className="text-2xl font-black text-slate-900">{j.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-slate-400 font-bold">
                             <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4"/> {j.location}</div>
                             <div className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {j.type}</div>
                          </div>
                       </div>
                       <a 
                         href="https://www.kalibrr.id/c/kazana-erp/jobs" 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="h-14 px-8 rounded-2xl bg-slate-50 text-slate-900 group-hover:bg-[#0044CC] group-hover:text-white transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2 border border-slate-100"
                       >
                          Lamar di Kalibrr <ArrowRight className="w-4 h-4" />
                       </a>
                    </motion.div>
                 ))}
              </div>
           </div>
        </div>
      </section>
    </FrontLayout>
  );
}
