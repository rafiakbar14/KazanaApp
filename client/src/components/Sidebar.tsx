import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Box,
  ClipboardList,
  Warehouse,
  Truck,
  Shield,
  Users,
  Megaphone,
  MessageSquare,
  Heart,
  UserCog,
  LogOut,
  Package,
  Menu,
  X,
  Loader2,
  Settings2,
  BookOpen,
  Play,
  Store,
  Sparkles,
  Terminal,
  Clock,
  ShoppingBag,
  Banknote,
  Building2,
  BarChart3,
  Database,
  Search
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBackgroundUpload } from "@/components/BackgroundUpload";

interface NavItemProps {
  name: string;
  href: string;
  icon: any;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ name, href, icon: Icon, isActive, onClick }: NavItemProps) {
  return (
    <Link href={href}>
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group mb-1",
          isActive
            ? "bg-white/20 text-white font-bold shadow-lg shadow-black/10 backdrop-blur-md border border-white/20"
            : "text-blue-100/70 hover:text-white hover:bg-white/10"
        )}
        data-testid={`nav-${name.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <Icon className={cn(
          "w-5 h-5 transition-transform duration-200",
          isActive ? "text-white scale-110" : "text-blue-200/50 group-hover:text-white"
        )} />
        <span className="text-[13px] tracking-wide">{name}</span>
      </div>
    </Link>
  );
}

interface NavGroupProps {
  label: string;
  icon: any;
  items: { name: string; href: string; icon: any; roles?: string[] }[];
  currentLocation: string;
  userRole?: string;
  isAdmin?: boolean;
}

function NavGroup({ label, icon: Icon, items, currentLocation, userRole, isAdmin }: NavGroupProps) {
  const filteredItems = items.filter(item => {
    if (isAdmin) return true;
    if (!item.roles) return true;
    return item.roles.includes(userRole || "");
  });

  if (filteredItems.length === 0) return null;

  const isChildActive = filteredItems.some(item => currentLocation === item.href || (item.href !== "/" && currentLocation.startsWith(item.href)));
  const [isOpen, setIsOpen] = useState(isChildActive);

  // Auto-expand if a child becomes active
  useEffect(() => {
    if (isChildActive) setIsOpen(true);
  }, [isChildActive]);

  return (
    <div className="mb-2">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer transition-colors group",
          isChildActive ? "text-white" : "text-blue-200/50 hover:text-white hover:bg-white/5"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 opacity-60 group-hover:opacity-100" />
          <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        {isOpen ? <ChevronDown className="w-3 h-3 opacity-40" /> : <ChevronRight className="w-3 h-3 opacity-40" />}
      </div>

      {isOpen && (
        <div className="mt-1 ml-4 border-l border-white/10 pl-2 animate-in slide-in-from-top-2 duration-200">
          {filteredItems.map(item => (
            <NavItem
              key={item.name}
              name={item.name}
              href={item.href}
              icon={item.icon}
              isActive={currentLocation === item.href || (item.href !== "/" && currentLocation.startsWith(item.href))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { role, isAdmin, isSKUManager, isCashier } = useRole();
  const { activeCount } = useBackgroundUpload();

  if (isCashier) return null;

  const isStockCounterOnly = role === "stock_counter";

  const groups = [
    {
      label: "Sales",
      icon: Store,
      module: "pos",
      items: [
        { name: "POS (Premium)", href: "/pos", icon: Store, roles: ["admin", "cashier"] },
        { name: "Promo & Voucher", href: "/admin/promotions", icon: Sparkles, roles: ["admin"] },
        { name: "Riwayat Shift Kasir", href: "/admin/pos-sessions", icon: Clock, roles: ["admin"] },
        { name: "Pengaturan PIN POS", href: "/roles", icon: Shield, roles: ["admin"] },
        { name: "Invoice & Piutang", href: "/sales/invoices", icon: ClipboardList, roles: ["admin"] },
      ]
    },
    {
      label: "Production",
      icon: Settings2,
      module: "production",
      items: [
        { name: "Resep (BOM)", href: "/production/boms", icon: BookOpen },
        { name: "Sesi Produksi", href: "/production/assembly", icon: Play },
        { name: "Smart Planner AI", href: "/production/ai", icon: Sparkles, roles: ["admin", "production"] },
      ]
    },
    {
      label: "Purchasing",
      icon: ShoppingBag,
      module: "inventory",
      items: [] // Placeholder
    },
    {
      label: "Inventory",
      icon: Box,
      module: "inventory",
      items: [
        ...(!isStockCounterOnly ? [{ name: "Daftar SKU", href: "/products", icon: Box }] : []),
        { name: "Opname Stok", href: "/sessions", icon: ClipboardList },
        { name: "Barang Masuk", href: "/inbound", icon: Warehouse },
        { name: "Barang Keluar", href: "/outbound", icon: Truck },
      ]
    },
    {
      label: "Fixed Assets",
      icon: Building2,
      module: "accounting",
      items: [
        { name: "Manajemen Aset", href: "/accounting/assets", icon: Package, roles: ["admin"] },
      ]
    },
    {
      label: "Finance",
      icon: Banknote,
      module: "accounting",
      items: [] // Placeholder
    },
    {
      label: "Accounting",
      icon: BookOpen,
      module: "accounting",
      items: [
        { name: "Daftar Akun (COA)", href: "/accounting/accounts", icon: ClipboardList, roles: ["admin"] },
        { name: "Jurnal Umum", href: "/accounting/journal", icon: BookOpen, roles: ["admin"] },
        { name: "Laporan Keuangan", href: "/accounting/reports", icon: LayoutDashboard, roles: ["admin"] },
      ]
    },
    {
      label: "Master",
      icon: Database,
      module: "admin",
      items: [
        { name: "Master Data", href: "/master", icon: Database, roles: ["admin"] },
      ]
    },
    {
      label: "Report",
      icon: BarChart3,
      module: "admin",
      items: [
        { name: "Ekspor Laporan", href: "/reports/export", icon: Megaphone, roles: ["admin"] },
      ]
    },
    {
      label: "Settings",
      icon: UserCog,
      module: "all",
      items: [
        { name: "User Roles", href: "/roles", icon: Shield, roles: ["admin"] },
        { name: "Staff SO", href: "/staff", icon: Users, roles: ["admin", "sku_manager"] },
        { name: "Manajemen Terminal", href: "/admin/terminals", icon: Terminal, roles: ["admin"] },
        { name: "Pelanggan", href: "/customers", icon: Users },
        { name: "Pengumuman", href: "/announcements", icon: Megaphone, roles: ["admin"] },
        { name: "Edit Profil", href: "/profile", icon: UserCog },
        { name: "Audit Motivasi", href: "/motivation", icon: Heart, roles: ["admin"] },
        { name: "Kritik & Saran", href: "/feedback", icon: MessageSquare },
      ]
    }
  ];

  // Feature Flagging / Subscription filtering
  const visibleGroups = groups.filter(group => {
    if (group.module === "all") return true;
    if (isAdmin) {
      // Admin might see everything or only what they paid for? 
      // The user said "sesuai dengan yang dia bayar", so we filter even for admins.
      return user?.subscribedModules?.includes(group.module);
    }
    return user?.subscribedModules?.includes(group.module);
  });

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.username || "User";

  const initials = user
    ? (user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : (user.username || "U").substring(0, 2).toUpperCase())
    : "U";

  const roleLabel: Record<string, string> = {
    admin: "Admin",
    sku_manager: "SKU Manager",
    stock_counter: "Stock Counter",
    cashier: "Cashier",
    production: "Production",
    driver: "Driver",
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-4 py-3 bg-[#0044CC] border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">Kazana</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 -mr-2 text-white/80" data-testid="button-mobile-menu">
          {isOpen ? <X /> : (
            <div className="relative">
              <Menu />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
              )}
            </div>
          )}
        </button>

      </div>

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-[#0055EE] to-[#0033BB] text-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shadow-none border-r border-white/5",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full relative overflow-hidden">
          {/* Decorative ambient light */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="hidden lg:flex items-center gap-3 px-8 py-10 z-10">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md shadow-inner border border-white/20">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl leading-none text-white tracking-tight">Stockify</h1>
              <p className="text-[10px] text-blue-200 mt-1.5 font-bold uppercase tracking-widest opacity-70">Inventory Pro</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 mt-14 lg:mt-0 z-10 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <NavItem
              name="Dashboard"
              href="/"
              icon={LayoutDashboard}
              isActive={location === "/"}
              onClick={() => setIsOpen(false)}
            />

            {visibleGroups.map(group => (
              <NavGroup
                key={group.label}
                label={group.label}
                icon={group.icon}
                items={group.items}
                currentLocation={location}
                userRole={role}
                isAdmin={isAdmin}
              />
            ))}

            {activeCount > 0 && (
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md animate-pulse mt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/20 p-2 rounded-lg">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">Uploading</p>
                    <p className="text-xs text-white/80">{activeCount} antrean foto...</p>
                  </div>
                </div>
              </div>
            )}
          </nav>


          <div className="p-4 border-t border-white/10 space-y-3 z-10">
            <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
              <div className="p-3 flex items-center gap-3">
                <Avatar className="ring-2 ring-white/10">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-bold text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate text-white" data-testid="text-username">
                      {displayName}
                    </p>
                    {isAdmin && (
                      <Badge variant="outline" className={cn(
                        "text-[9px] px-1.5 py-0 border leading-none h-4",
                        (user?.subscribedModules as string[] || []).length > 0
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "bg-gray-500/20 text-gray-300 border-gray-500/50"
                      )}>
                        {(user?.subscribedModules as string[] || []).length > 0 ? "PRO" : "FREE"}
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] mt-0.5 border-white/20 text-blue-100 bg-white/5" data-testid="text-role">
                    {roleLabel[role] || role}
                  </Badge>
                </div>
              </div>

              {isAdmin && (
                <div className="px-3 pb-3">
                  <Link href="/subscription">
                    <div
                      className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 group border",
                        location === "/subscription"
                          ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/30 text-amber-200"
                          : "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-400/20 text-amber-200/80 hover:from-amber-500/20 hover:to-orange-500/20 hover:text-amber-200 hover:border-amber-400/40"
                      )}
                      data-testid="button-subscription"
                      onClick={() => setIsOpen(false)}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 drop-shadow-md" />
                      <span className="text-[11px] font-bold tracking-wide uppercase drop-shadow-md">
                        {(user?.subscribedModules as string[] || []).length > 0
                          ? "Kelola Langganan"
                          : "Upgrade Modul"}
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              className="w-full justify-start text-blue-100/60 hover:text-white hover:bg-white/10 rounded-xl"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
