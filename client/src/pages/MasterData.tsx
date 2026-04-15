import {
  Package,
  Layers,
  GitBranch,
  Weight,
  FileText,
  Receipt,
  Layout,
  Menu as MenuIcon,
  PlusSquare,
  Tags,
  Store,
  MapPin,
  Clipboard,
  Bell,
  Search,
  QrCode,
  ArrowUpCircle,
  HelpCircle,
  Settings2,
  CreditCard,
  Smartphone,
  Users,
  Building2,
  Shield,
  Truck,
  Briefcase,
  Monitor
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface MasterItem {
  name: string;
  href: string;
  icon: any;
  color?: string;
  description?: string;
}

interface MasterSection {
  title: string;
  icon: any;
  items: MasterItem[];
}

const masterSections: MasterSection[] = [
  {
    title: "General & Identity",
    icon: Building2,
    items: [
      { name: "Unit Bisnis / Cabang", href: "/admin/terminals", icon: Store, color: "bg-blue-500", description: "Atur identitas & lokasi bisnis" },
      { name: "Manajemen User", href: "/roles", icon: Users, color: "bg-indigo-500", description: "Kelola akun & hak akses" },
      { name: "Terminal & POS", href: "/admin/terminals", icon: Monitor, color: "bg-slate-500", description: "Daftarkan hardware kasir" },
      { name: "Hak Akses (Roles)", href: "/roles", icon: Shield, color: "bg-red-500", description: "Definisi permission sistem" },
    ]
  },
  {
    title: "Product & Inventory",
    icon: Package,
    items: [
      { name: "Master SKU", href: "/products", icon: Package, color: "bg-emerald-500", description: "Daftar produk & jasa" },
      { name: "Kategori Produk", href: "/master/categories", icon: Layers, color: "bg-teal-500", description: "Pengelompokan barang" },
      { name: "Satuan (UOM)", href: "/master/units", icon: Weight, color: "bg-cyan-500", description: "Konversi satuan (DUS/PCS)" },
      { name: "Barcode Generator", href: "/master/barcode", icon: QrCode, color: "bg-violet-500", description: "Cetak label barcode" },
      { name: "Import/Export Data", href: "/master/import-export", icon: ArrowUpCircle, color: "bg-amber-500", description: "Bulk upload katalog" },
    ]
  },
  {
    title: "Relationships (CRM)",
    icon: Users,
    items: [
      { name: "Daftar Pelanggan", href: "/customers", icon: Users, color: "bg-pink-500", description: "Database member & loyalti" },
      { name: "Daftar Supplier", href: "/master/suppliers", icon: Truck, color: "bg-orange-500", description: "Kontak vendor & pemasok" },
      { name: "Employee (HR)", href: "/staff", icon: Briefcase, color: "bg-sky-500", description: "Manajemen karyawan" },
    ]
  },
  {
    title: "Financial & Assets",
    icon: Receipt,
    items: [
      { name: "Daftar Akun (COA)", href: "/accounting/accounts", icon: Clipboard, color: "bg-rose-500", description: "Struktur laporan keuangan" },
      { name: "Kategori Aset", href: "/accounting/assets", icon: Building2, color: "bg-amber-600", description: "Pengelompokan harta tetap" },
      { name: "Voucher & Promo", href: "/admin/promotions", icon: Tags, color: "bg-purple-500", description: "Atur diskon & kupon" },
    ]
  }
];

export default function MasterData() {
  const [search, setSearch] = useState("");

  const filteredSections = masterSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-slate-800 p-8 lg:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary-foreground mb-2">
              <Database className="w-3 h-3" /> System Configuration
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight drop-shadow-sm font-display">
              Master Data <span className="text-primary">Hub</span>
            </h1>
            <p className="text-slate-400 max-w-lg font-medium">
              Kelola entitas inti bisnis Anda dari satu tempat. Pengaturan di sini akan berdampak pada seluruh modul transaksi.
            </p>
          </div>
          
          <div className="relative w-full md:w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <Input
              type="text"
              placeholder="Cari Master Data (misal: SKU, Supplier, Pelanggan...)"
              className="h-16 pl-12 pr-4 bg-white/5 border-white/10 rounded-2xl text-lg backdrop-blur-xl focus:ring-primary/40 focus:border-primary/40 transition-all font-medium placeholder:text-slate-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {filteredSections.map((section, idx) => (
          <div key={section.title} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="flex items-center gap-3 px-1">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                <section.icon className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{section.title}</h2>
              <div className="h-px bg-slate-100 flex-1 ml-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {section.items.map(item => (
                <Link key={item.name} href={item.href}>
                  <Card className="group relative overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-slate-100 rounded-3xl h-full p-1 active:scale-[0.98]">
                    <div className="flex items-center gap-4 p-5 h-full">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500 group-hover:scale-110",
                        item.color || "bg-slate-500"
                      )}>
                        <item.icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-black text-slate-800 leading-tight group-hover:text-primary transition-colors pr-6">
                          {item.name}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-400 leading-normal line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                        <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center">
                          <PlusSquare className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Global types/imports for icon names
import { Database } from "lucide-react";
