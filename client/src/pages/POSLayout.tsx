import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Home, Package, ShoppingCart, User, LogOut, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePOS } from "@/hooks/use-pos";
import { useRole } from "@/hooks/use-role";

export default function POSLayout({ children }: { children: ReactNode }) {
    const { logout: erpLogout, user: erpUser } = useAuth();
    const { logout: posLogout, currentCashier } = usePOS();
    const [, setLocation] = useLocation();
    const { isAdmin } = useRole();

    const activeUser = currentCashier || erpUser;

    return (
        <div className="h-screen bg-slate-950 text-slate-50 flex flex-col overflow-hidden selection:bg-primary/30">
            {/* Minimalist POS Header */}
            <header className="h-14 lg:h-18 border-b border-white/5 px-4 lg:px-8 flex items-center justify-between bg-black/40 backdrop-blur-2xl z-50">
                <div className="flex items-center gap-4 lg:gap-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-primary to-blue-600 p-2 lg:p-2.5 rounded-2xl shadow-xl shadow-primary/20 ring-1 ring-white/20">
                            <Package className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base lg:text-xl font-display font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">STOCKIFY POS</span>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60 -mt-1">PREMIUM EDITION</span>
                        </div>
                    </div>
                    <div className="h-8 w-px bg-white/5 hidden lg:block" />
                    {isAdmin && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white/30 hover:text-white px-3 lg:px-5 h-10 rounded-xl hover:bg-white/5 transition-all gap-2 group" 
                            onClick={() => setLocation("/")}
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="hidden sm:inline text-[11px] font-black uppercase tracking-widest">Dashboard Utama</span>
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2 lg:gap-4">
                    <div className="hidden lg:flex flex-col items-end mr-2 text-right">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            <p className="text-xs font-black text-white/90 uppercase tracking-tight">
                                {activeUser?.firstName && activeUser?.lastName
                                    ? `${activeUser.firstName} ${activeUser.lastName}`
                                    : activeUser?.username || "Kasir"}
                            </p>
                        </div>
                        <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.1em] mt-0.5">Terminal Sesi Aktif</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 p-1.5 bg-white/5 rounded-2xl border border-white/5">
                        <Button variant="ghost" size="icon" className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl hover:bg-white/10 text-white/40 hover:text-white shrink-0 transition-all" title="Ganti Kasir / Kunci" onClick={() => posLogout()}>
                            <Lock className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl hover:bg-red-500/10 text-white/40 hover:text-red-400 shrink-0 transition-all" title="Logout dari ERP" onClick={() => erpLogout()}>
                            <LogOut className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main POS Content */}
            <main className="flex-1 overflow-hidden relative">
                {children}
            </main>
        </div>
    );
}
