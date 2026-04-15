import {
  BarChart3,
  TrendingUp,
  Box,
  ShoppingBag,
  Users,
  ClipboardList,
  History,
  PieChart,
  Activity,
  ArrowUpRight,
  FileText,
  DollarSign,
  Search,
  Download,
  Calendar,
  Layers
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReportItem {
  name: string;
  href: string;
  icon: any;
  color: string;
  description: string;
}

interface ReportSection {
  title: string;
  icon: any;
  items: ReportItem[];
}

const reportSections: ReportSection[] = [
  {
    title: "Penjualan (Sales)",
    icon: TrendingUp,
    items: [
      { name: "Ringkasan Penjualan", href: "/reports/sales-summary", icon: BarChart3, color: "bg-blue-500", description: "Laba kotor & volume transaksi" },
      { name: "Penjualan per Produk", href: "/reports/sales-items", icon: Box, color: "bg-indigo-500", description: "Ranking produk terlaris" },
      { name: "Laporan Kasir", href: "/pos-sessions", icon: Users, color: "bg-cyan-500", description: "Rekap shift & uang fisik" },
    ]
  },
  {
    title: "Persediaan (Inventory)",
    icon: Box,
    items: [
      { name: "Status Stok Real-time", href: "/products", icon: Box, color: "bg-emerald-500", description: "Sisa kuantitas & nilai barang" },
      { name: "Kartu Stok (Mutasi)", href: "/reports/stock-ledger", icon: History, color: "bg-teal-500", description: "Riwayat keluar masuk barang" },
      { name: "Akurasi Opname", href: "/sessions", icon: ClipboardList, color: "bg-green-600", description: "Laporan selisih barang" },
    ]
  },
  {
    title: "Keuangan (Accounting)",
    icon: DollarSign,
    items: [
      { name: "Laba Rugi (P&L)", href: "/accounting/reports", icon: TrendingUp, color: "bg-rose-500", description: "Pendapatan vs Beban" },
      { name: "Neraca (Balance Sheet)", href: "/accounting/reports", icon: PieChart, color: "bg-orange-500", description: "Posisi aset & liabilitas" },
      { name: "Buku Besar (Ledger)", href: "/accounting/journal", icon: FileText, color: "bg-amber-600", description: "Detail transaksi per akun" },
      { name: "Valuasi Persediaan (FIFO)", href: "/accounting/inventory-valuation", icon: Layers, color: "bg-purple-600", description: "Penilaian stok berdasarkan lot masuk" },
    ]
  },
  {
    title: "Audit & Sistem",
    icon: Activity,
    items: [
      { name: "Log Aktivitas", href: "/activity-logs", icon: Activity, color: "bg-slate-700", description: "Siapa melakukan apa & kapan" },
      { name: "Ekspor Data Custom", href: "/reports-export", icon: Download, color: "bg-violet-500", description: "Download CSV/Excel data" },
    ]
  }
];

export default function ReportHub() {
  const [search, setSearch] = useState("");

  const filteredSections = reportSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 to-slate-900 p-8 lg:p-12 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -ml-32 -mb-32" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary-foreground mb-2">
              <BarChart3 className="w-3 h-3" /> Business Intelligence
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight font-display">
              Report <span className="text-secondary">Hub</span>
            </h1>
            <p className="text-indigo-200/60 max-w-lg font-medium">
              Analisa performa bisnis Anda secara real-time. Semua data disajikan secara transparan dan akurat.
            </p>
          </div>

          <div className="relative w-full md:w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-indigo-400" />
            </div>
            <Input
              type="text"
              placeholder="Cari Laporan..."
              className="h-16 pl-12 pr-4 bg-white/5 border-white/10 rounded-2xl text-lg backdrop-blur-xl focus:ring-primary/40 focus:border-primary/40 transition-all font-medium placeholder:text-indigo-700 text-white"
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
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-500">
                <section.icon className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{section.title}</h2>
              <div className="h-px bg-slate-100 flex-1 ml-4" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {section.items.map(item => (
                <Link key={item.name} href={item.href}>
                  <Card className="group relative overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border-slate-100 rounded-3xl h-full p-1 active:scale-[0.98]">
                    <div className="flex flex-col p-6 h-full">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all duration-500 group-hover:scale-110 mb-4",
                        item.color
                      )}>
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-black text-slate-800 leading-tight group-hover:text-primary transition-colors pr-6">
                          {item.name}
                        </h3>
                        <p className="text-[11px] font-medium text-slate-400 leading-normal">
                          {item.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-primary transition-colors">Lihat Detail</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-200 group-hover:text-primary transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
