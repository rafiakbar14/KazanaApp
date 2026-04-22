import { Link } from "wouter";
import { 
  Package, ChevronDown, Shield, Zap, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FrontLayoutProps {
  children: React.ReactNode;
}

export default function FrontLayout({ children }: FrontLayoutProps) {
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
            
            <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer">
               ID <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>
      </nav>

      <main>
        {children}
      </main>

      {/* Footer Section */}
      <footer className="bg-slate-950 text-white pt-24 pb-12">
        <div className="max-w-[1300px] mx-auto px-6">
          <div className="mb-16">
             <div className="flex items-center gap-2 mb-8">
                <div className="bg-[#0044CC] p-1.5 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl font-black tracking-tighter text-white">Kazana</span>
             </div>
             <div className="h-px bg-slate-800 w-full" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-24">
            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Home</h4>
              <ul className="space-y-4 text-slate-300 font-medium">
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Unduh Aplikasi</a></Link></li>
                <li><Link href="/#pos"><a className="hover:text-blue-400 transition-colors">Mesin Kasir</a></Link></li>
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Kerjasama dengan Kazana</a></Link></li>
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Kebijakan Privasi</a></Link></li>
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Syarat & Ketentuan</a></Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Tentang Kami</h4>
              <ul className="space-y-4 text-slate-300 font-medium">
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Tentang Kazana</a></Link></li>
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Karir</a></Link></li>
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Tim Kazana</a></Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Blog</h4>
              <ul className="space-y-4 text-slate-300 font-medium">
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Event</a></Link></li>
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Inspirasi</a></Link></li>
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Promo Kazana</a></Link></li>
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Studi Kasus</a></Link></li>
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Tips</a></Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-slate-400">Support</h4>
              <ul className="space-y-4 text-slate-300 font-medium">
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Bantuan</a></Link></li>
                <li><Link href="#"><a className="hover:text-blue-400 transition-colors">Video Tutorial</a></Link></li>
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
            
            <div className="flex items-center gap-4">
               <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm font-medium flex items-center gap-2">
                  <span>Indonesia</span>
                  <ChevronDown className="w-3 h-3 rotate-90" />
               </div>
            </div>
          </div>
          
          <div className="mt-12 text-center text-slate-500 text-xs font-medium">
            &copy; {new Date().getFullYear()} PT Kazana Global Teknologi. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
