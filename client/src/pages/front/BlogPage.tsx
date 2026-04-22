import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, User } from "lucide-react";
import { Link } from "wouter";

const BLOG_POSTS = [
  {
    title: "5 Cara Meningkatkan Profit Coffee Shop di Masa Resesi",
    excerpt: "Pelajari strategi pengelolaan bahan baku dan loyalty program untuk menjaga arus kas tetap positif.",
    category: "Bisnis",
    date: "20 Apr 2024",
    author: "Tim Kazana",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Mengenal ERP: Kenapa UMKM Butuh Sistem Terintegrasi?",
    excerpt: "Ebook panduan lengkap memilih sistem manajemen bisnis yang tepat untuk skala kecil dan menengah.",
    category: "Edukasi",
    date: "18 Apr 2024",
    author: "Rafi Akbar",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=600"
  },
  {
    title: "Update Fitur: Integrasi Kitchen Display System (KDS)",
    excerpt: "Sekarang restoran Anda bisa memantau pesanan dapur secara real-time tanpa kertas struk.",
    category: "Update",
    date: "15 Apr 2024",
    author: "Product Team",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=600"
  }
];

export default function BlogPage() {
  return (
    <FrontLayout>
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 text-center">
           <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8 pb-3">
              Wawasan & <span className="text-[#0044CC]">Update Bisnis</span>.
           </motion.h1>
           <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
              Temukan tips, trik, dan berita terbaru seputar dunia wirausaha dan teknologi ERP.
           </p>
        </div>
      </section>

      <section className="pb-32 bg-white">
         <div className="max-w-[1300px] mx-auto px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
               {BLOG_POSTS.map((post, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="group flex flex-col cursor-pointer"
                  >
                     <div className="aspect-video rounded-[2rem] overflow-hidden mb-8 shadow-xl shadow-slate-200/50">
                        <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                     <div className="space-y-4 flex-1">
                        <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest text-[#0044CC]">
                           <span>{post.category}</span>
                           <span className="text-slate-300">•</span>
                           <span className="text-slate-400">{post.date}</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-[#0044CC] transition-colors">{post.title}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">{post.excerpt}</p>
                     </div>
                     <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                           <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                              <User className="w-3 h-3" />
                           </div>
                           {post.author}
                        </div>
                        <div className="text-[#0044CC] font-black text-xs uppercase tracking-widest flex items-center gap-2">
                           Baca Selengkapnya <ArrowRight className="w-4 h-4" />
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>
    </FrontLayout>
  );
}
