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
  Smartphone
} from "lucide-react";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MasterItem {
  name: string;
  href: string;
  icon: any;
}

interface MasterSection {
  title: string;
  items: MasterItem[];
}

const masterSections: MasterSection[] = [
  {
    title: "Product",
    items: [
      { name: "Product", href: "/products", icon: Package },
      { name: "Category", href: "/master/categories", icon: Layers },
      { name: "Sub Category", href: "/products", icon: GitBranch },
      { name: "Unit", href: "/master/units", icon: Weight },
      { name: "Branch Product", href: "/products", icon: Store },
      { name: "Pricelist", href: "/products", icon: Receipt },
      { name: "Customer Pricelist", href: "/products", icon: Tags },
      { name: "Document Template", href: "/products", icon: FileText },
      { name: "Barcode Generator", href: "/master/barcode", icon: QrCode },
      { name: "Import/Export", href: "/master/import-export", icon: ArrowUpCircle },
    ]
  },
  {
    title: "POS",
    items: [
      { name: "Menu Category", href: "/admin/promotions", icon: Layers },
      { name: "Menu", href: "/pos", icon: MenuIcon },
      { name: "Menu Extra", href: "/pos", icon: PlusSquare },
      { name: "Menu Package", href: "/pos", icon: Package },
      { name: "Notes Category", href: "/pos", icon: FileText },
      { name: "Menu Promotion", href: "/admin/promotions", icon: Tags },
      { name: "Station", href: "/admin/terminals", icon: MapPin },
      { name: "Branch Menu", href: "/pos", icon: GitBranch },
      { name: "Table Section", href: "/pos", icon: Layout },
      { name: "Table Management", href: "/pos", icon: Layout },
      { name: "Visit Purposes", href: "/pos", icon: Clipboard },
      { name: "Voucher", href: "/admin/promotions", icon: Receipt },
      { name: "Menu Template", href: "/pos", icon: FileText },
      { name: "Menu Recommendation", href: "/pos", icon: Bell },
      { name: "Promotion", href: "/admin/promotions", icon: Tags },
      { name: "Cancel Reason", href: "/pos", icon: HelpCircle },
      { name: "POS Menu Mapping", href: "/pos", icon: Settings2 },
      { name: "POS Data Upload", href: "/pos", icon: ArrowUpCircle },
      { name: "POS Payment Mapping", href: "/pos", icon: CreditCard },
      { name: "Menu Price", href: "/pos", icon: Receipt },
      { name: "POS Account Mapping", href: "/pos", icon: Settings2 },
      { name: "POS Multi Company", href: "/pos", icon: Store },
      { name: "Question", href: "/pos", icon: HelpCircle },
      { name: "Menu Template Layout", href: "/pos", icon: Smartphone },
    ]
  }
];

export default function MasterData() {
  const [search, setSearch] = useState("");

  const filteredSections = masterSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Master Data</h1>
          <p className="text-slate-500 mt-1">Manage core business entities and POS configurations</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Find Master Data..."
            className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus:ring-primary/20 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filteredSections.map(section => (
        <div key={section.title} className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 ml-1">{section.title}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {section.items.map(item => (
              <Link key={item.name} href={item.href}>
                <Card className="group cursor-pointer hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 border-slate-200 h-full">
                  <CardHeader className="p-4 space-y-3 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-cyan-100/50 rounded-xl flex items-center justify-center text-cyan-600 group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-300">
                      <item.icon className="w-6 h-6 animate-in zoom-in-50 duration-500" />
                    </div>
                    <CardTitle className="text-xs font-bold text-slate-700 leading-tight group-hover:text-cyan-600 transition-colors">
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
