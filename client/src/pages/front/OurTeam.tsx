import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { Linkedin, Github, Twitter } from "lucide-react";

const TEAM_MEMBERS = [
  {
    name: "Rafi Akbar",
    role: "Founder & CEO",
    bio: "Visionary leader with a passion for digitalizing Indonesian SMEs.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    linkedin: "#",
    github: "#"
  },
  {
    name: "Sarah Utami",
    role: "Head of Product",
    bio: "Expert in UX design and product-led growth strategies.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
    linkedin: "#",
    twitter: "#"
  },
  {
    name: "Budi Santoso",
    role: "CTO",
    bio: "Technical architect specializing in scalable SaaS infrastructure.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
    linkedin: "#",
    github: "#"
  },
  {
    name: "Linda Wijaya",
    role: "Head of Marketing",
    bio: "Growth hacker focused on building enterprise-grade branding.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    linkedin: "#",
    twitter: "#"
  }
];

export default function OurTeam() {
  return (
    <FrontLayout 
      title="Tim Kazana" 
      description="Kenali sosok-sosok profesional di balik layar Kazana ERP yang berdedikasi membangun teknologi terbaik untuk bisnis Anda."
    >
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6">
           <div className="text-center mb-24">
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 pb-3">
                 Orang-Orang Hebat Di Balik <br/><span className="text-[#0044CC]">Kazana ERP</span>.
              </motion.h1>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                 Kami adalah tim yang berdedikasi tinggi untuk memberikan solusi terbaik bagi bisnis Anda.
              </p>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
              {TEAM_MEMBERS.map((m, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group"
                >
                   <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden mb-8 shadow-xl shadow-slate-200/50 group-hover:-translate-y-2 transition-all duration-500 relative">
                      <img src={m.image} alt={m.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0044CC]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                         <div className="flex gap-4">
                            {m.linkedin && <a href={m.linkedin} className="text-white hover:text-blue-200 transition-colors"><Linkedin className="w-5 h-5" /></a>}
                            {m.github && <a href={m.github} className="text-white hover:text-blue-200 transition-colors"><Github className="w-5 h-5" /></a>}
                            {m.twitter && <a href={m.twitter} className="text-white hover:text-blue-200 transition-colors"><Twitter className="w-5 h-5" /></a>}
                         </div>
                      </div>
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 mb-1">{m.name}</h3>
                   <p className="text-[#0044CC] font-bold text-sm uppercase tracking-widest mb-4">{m.role}</p>
                   <p className="text-slate-500 font-medium leading-relaxed">{m.bio}</p>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50 border-t border-slate-100">
         <div className="max-w-[1300px] mx-auto px-6 text-center">
            <h2 className="text-3xl lg:text-5xl font-black mb-8 text-slate-900">Bergabung Bersama Kami?</h2>
            <p className="text-lg text-slate-500 font-medium mb-12 max-w-xl mx-auto">Kami selalu mencari talenta hebat yang ingin membuat dampak nyata bagi ekonomi digital Indonesia.</p>
            <a href="/karir">
              <button className="h-16 px-12 bg-white border-2 border-slate-200 hover:border-[#0044CC] text-slate-900 hover:text-[#0044CC] font-black rounded-2xl transition-all uppercase tracking-widest text-sm">
                Lihat Lowongan Kerja
              </button>
            </a>
         </div>
      </section>
    </FrontLayout>
  );
}
