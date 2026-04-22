import FrontLayout from "@/components/FrontLayout";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ContactPage() {
  return (
    <FrontLayout>
      <section className="pt-40 pb-20 bg-white">
        <div className="max-w-[1300px] mx-auto px-6 grid lg:grid-cols-2 gap-16">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl lg:text-7xl font-black tracking-tighter text-slate-900 mb-8">
              Hubungi <br/><span className="text-[#0044CC]">Tim Kazana</span>.
            </h1>
            <p className="text-xl text-slate-500 font-medium mb-12">
              Punya pertanyaan teknis atau ingin kolaborasi bisnis? Kami siap mendengarkan aspirasi Anda.
            </p>

            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0044CC] shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Email</h4>
                  <p className="text-lg font-bold text-slate-600">hello@kazana.id</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Phone</h4>
                  <p className="text-lg font-bold text-slate-600">+62 21 2782 9547</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Office</h4>
                  <p className="text-lg font-bold text-slate-600">Gedung Kazana Center, Jl. Jend. Sudirman Kav 52-53, Jakarta Selatan</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }} 
            animate={{ opacity: 1, x: 0 }}
            className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100"
          >
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                  <Input className="h-14 rounded-2xl border-slate-200 bg-white" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nama Bisnis</label>
                  <Input className="h-14 rounded-2xl border-slate-200 bg-white" placeholder="PT Sukses Bersama" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email</label>
                <Input className="h-14 rounded-2xl border-slate-200 bg-white" placeholder="john@example.com" type="email" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Pesan</label>
                <Textarea className="min-h-[150px] rounded-[2rem] border-slate-200 bg-white py-4" placeholder="Apa yang bisa kami bantu?" />
              </div>
              <Button className="w-full h-16 bg-[#0044CC] hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest flex items-center justify-center gap-2">
                Kirim Pesan <Send className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </FrontLayout>
  );
}
