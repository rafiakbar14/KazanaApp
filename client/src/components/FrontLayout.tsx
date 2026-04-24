import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { 
  Menu, X, ChevronDown, Rocket, 
  Store, Coffee, Shirt, UtensilsCrossed, 
  Scissors, BarChart3, Package, CreditCard,
  Target, Mail, Phone, MapPin, Download,
  Shield, Zap, TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FrontLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function FrontLayout({ children, title, description }: FrontLayoutProps) {
  const { toast } = useToast();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [lang, setLang] = useState("ID");

  const changeLang = (code: string, name: string) => {
    setLang(code);
    setIsLangOpen(false);
    toast({
      title: `Bahasa diubah ke ${name}`,
      description: code === "EN" ? "English translation is coming soon!" : "Konten sekarang dalam Bahasa Indonesia.",
    });
  };

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location]);

  useEffect(() => {
    const baseTitle = "Kazana ERP - Solusi Bisnis Digital Indonesia";
    document.title = title ? `${title} | Kazana ERP` : baseTitle;
    
    // Update meta description if provided
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }
  }, [title, description]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 bg-white/95 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-[1300px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="bg-[#0044CC] p-1.5 rounded-lg">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
                  Kazana <span className="font-normal text-slate-400">ERP</span>
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {/* Dropdown Solution */}
              <div className="group relative py-8">
                <button className="flex items-center gap-1 text-[15px] font-semibold text-slate-800 hover:text-[#0044CC] transition-colors">
                  Solusi Bisnis <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#0044CC] transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 w-[240px] bg-white shadow-2xl border border-slate-100 rounded-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                   <ul className="space-y-1">
                      {[
                        { name: "Coffee Shop", slug: "coffee-shop" },
                        { name: "Toko Retail", slug: "retail" },
                        { name: "Laundry", slug: "laundry" },
                        { name: "Restoran", slug: "restoran" },
                        { name: "Barbershop", slug: "barbershop" }
                      ].map(item => (
                        <li key={item.slug}>
                          <Link href={`/solusi/${item.slug}`}>
                            <a className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-[#0044CC] rounded-xl transition-colors">
                              Aplikasi Kasir {item.name}
                            </a>
                          </Link>
                        </li>
                      ))}
                   </ul>
                </div>
              </div>

              <Link href="/features">
                <a className="text-[15px] font-semibold text-slate-800 hover:text-[#0044CC] transition-colors cursor-pointer">Fitur Utama</a>
              </Link>
              <Link href="/pricing">
                <a className="text-[15px] font-semibold text-slate-800 hover:text-[#0044CC] transition-colors cursor-pointer">Harga Produk</a>
              </Link>
              <Link href="/blog">
                <a className="text-[15px] font-semibold text-slate-800 hover:text-[#0044CC] transition-colors cursor-pointer">Blog</a>
              </Link>
              
              {/* Dropdown Cooperation */}
              <div className="group relative py-8">
                <button className="flex items-center gap-1 text-[15px] font-semibold text-slate-800 hover:text-[#0044CC] transition-colors">
                  Kerja Sama <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#0044CC] transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 w-[200px] bg-white shadow-2xl border border-slate-100 rounded-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                   <ul className="space-y-1">
                      {[
                        { name: "Mitra Penjualan", slug: "mitra" },
                        { name: "Peluang Karir", slug: "karir" },
                        { name: "Hubungi Kami", slug: "kontak" }
                      ].map(item => (
                        <li key={item.slug}>
                          <Link href={`/${item.slug}`}>
                            <a className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-[#0044CC] rounded-xl transition-colors">
                              {item.name}
                            </a>
                          </Link>
                        </li>
                      ))}
                   </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login">
              <Button className="bg-[#0044CC] hover:bg-blue-700 text-white font-bold rounded-xl px-10 h-12 text-sm uppercase tracking-wider shadow-lg shadow-blue-500/20">
                Masuk
              </Button>
            </Link>
            
            <div className="hidden sm:block relative">
               <button 
                 onClick={() => setIsLangOpen(!isLangOpen)}
                 className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0044CC] uppercase tracking-widest transition-colors"
               >
                  {lang} <ChevronDown className={`w-3 h-3 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
               </button>
               
               <AnimatePresence>
                 {isLangOpen && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 10 }}
                     className="absolute top-full right-0 mt-4 w-32 bg-white shadow-2xl border border-slate-100 rounded-xl p-2 z-50 text-left"
                   >
                      {[
                        { code: "ID", name: "Indonesia" },
                        { code: "EN", name: "English" }
                      ].map(l => (
                        <button
                          key={l.code}
                          onClick={() => changeLang(l.code, l.name)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors ${lang === l.code ? 'bg-blue-50 text-[#0044CC]' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                           {l.name}
                           {lang === l.code && <div className="w-1 h-1 bg-[#0044CC] rounded-full" />}
                        </button>
                      ))}
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>

      {/* Footer Section */}
      <footer className="bg-[#020617] text-white pt-32 pb-12 relative overflow-hidden">
        {/* Subtle Decorative Gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0044CC]/50 to-transparent" />
        
        <div className="max-w-[1300px] mx-auto px-6">
          <div className="mb-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
             <div className="flex items-center gap-3">
                <div className="bg-[#0044CC] p-2 rounded-xl">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-black tracking-tighter text-white">Kazana <span className="text-slate-500 font-normal">ERP</span></span>
             </div>
             <p className="text-slate-400 font-medium max-w-sm text-sm">
                Solusi ERP terlengkap untuk modernisasi ekosistem UMKM Indonesia.
             </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-16 mb-24 pr-8">
            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-200">Home</h4>
              <ul className="space-y-4 text-slate-400 font-medium hover:text-slate-300 transition-colors">
                <li><a href="/pricing" className="hover:text-blue-400 transition-colors flex items-center gap-2">Unduh Aplikasi <Download className="w-4 h-4"/></a></li>
                <li><Link href="/features"><a className="hover:text-blue-400 transition-colors">Mesin Kasir</a></Link></li>
                <li><Link href="/mitra"><a className="hover:text-blue-400 transition-colors">Kerjasama dengan Kazana</a></Link></li>
                <li><Link href="/privacy"><a className="hover:text-blue-400 transition-colors">Kebijakan Privasi</a></Link></li>
                <li><Link href="/terms"><a className="hover:text-blue-400 transition-colors">Syarat & Ketentuan</a></Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-200">Tentang Kami</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><Link href="/about" className="text-slate-400 hover:text-white transition-colors">Tentang Kami</Link></li>
               <li><Link href="/team" className="text-slate-400 hover:text-white transition-colors">Tim Kami</Link></li>
               <li><Link href="/career" className="text-slate-400 hover:text-white transition-colors">Karir</Link></li>
               <li><Link href="/investor" className="text-[#0044CC] font-bold hover:text-blue-400 transition-colors">Investor Relations</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-200">Blog</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><Link href="/events"><a className="hover:text-blue-400 transition-colors">Event</a></Link></li>
                <li><Link href="/blog"><a className="hover:text-blue-400 transition-colors">Inspirasi</a></Link></li>
                <li><Link href="/events"><a className="hover:text-blue-400 transition-colors">Promo Kazana</a></Link></li>
                <li><Link href="/case-studies"><a className="hover:text-blue-400 transition-colors">Studi Kasus</a></Link></li>
                <li><Link href="/blog"><a className="hover:text-blue-400 transition-colors">Tips</a></Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-200">Support</h4>
              <ul className="space-y-4 text-slate-400 font-medium">
                <li><Link href="/help"><a className="hover:text-blue-400 transition-colors">Bantuan</a></Link></li>
                <li><Link href="/help"><a className="hover:text-blue-400 transition-colors">Video Tutorial</a></Link></li>
              </ul>
            </div>

            <div className="space-y-6 col-span-2 lg:col-span-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Office</h4>
              <ul className="space-y-4 text-slate-300 font-medium text-sm leading-relaxed">
                <li>
                  <span className="block font-bold text-white mb-1">Jakarta Office</span>
                  Gedung Kazana Center, Jl. Jend. Sudirman Kav 52-53, Jakarta Selatan, 12190
                </li>
                <li>
                  <span className="block font-bold text-white mb-1">Phone</span>
                  +62 21 2782 9547
                </li>
                <li>
                  <span className="block font-bold text-white mb-1">Email</span>
                  hello@kazana.id
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <a href="#" className="text-white hover:text-blue-400 transition-colors"><Shield className="w-5 h-5" /></a>
              <a href="#" className="text-white hover:text-blue-400 transition-colors"><Zap className="w-5 h-5" /></a>
              <a href="#" className="text-white hover:text-blue-400 transition-colors"><Package className="w-5 h-5" /></a>
              <a href="#" className="text-white hover:text-blue-400 transition-colors"><TrendingUp className="w-5 h-5" /></a>
            </div>
            
            <div className="flex items-center gap-6">
               <a href="https://instagram.com/kazana.id" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
               </a>
               <a href="https://linkedin.com/company/kazana-erp" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
               </a>
               <a href="https://youtube.com/@kazana.id" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
               </a>
            </div>
          </div>
          
          <div className="mt-12 text-center text-slate-500 text-xs font-medium">
            &copy; {new Date().getFullYear()} PT Si Pemalas Itu Akhirnya Sukses Juga. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
