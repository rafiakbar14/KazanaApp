import { useState, useEffect, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useAnnouncements } from "@/hooks/use-announcements";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Sessions from "@/pages/Sessions";
import SessionDetail from "@/pages/SessionDetail";
import RoleManagement from "@/pages/RoleManagement";
import ActivityLogs from "@/pages/ActivityLogs";
import InboundSessions from "@/pages/InboundSessions";
import InboundDetail from "@/pages/InboundDetail";
import OutboundSessions from "@/pages/OutboundSessions";
import OutboundDetail from "@/pages/OutboundDetail";
import Profile from "@/pages/Profile";
import StaffManagement from "@/pages/StaffManagement";
import Announcements from "@/pages/Announcements";
import FeedbackPage from "@/pages/FeedbackPage";
import MotivationPage from "@/pages/MotivationPage";
import BOMList from "@/pages/BOMList";
import BOMDetail from "@/pages/BOMDetail";
import AssemblySessions from "@/pages/AssemblySessions";
import ProductionAI from "@/pages/ProductionAI";
import POS from "@/pages/POS";
import Accounts from "@/pages/accounting/Accounts";
import Journal from "@/pages/accounting/Journal";
import Assets from "@/pages/accounting/Assets";
import Reports from "@/pages/accounting/Reports";
import Customers from "@/pages/Customers";
import Invoices from "@/pages/Invoices";
import NewInvoice from "@/pages/NewInvoice";
import ReportsExport from "@/pages/ReportsExport";
import TerminalManagement from "@/pages/TerminalManagement";
import PromotionManagement from "@/pages/PromotionManagement";
import POSSessions from "@/pages/POSSessions";
import MasterData from "@/pages/MasterData";
import Categories from "@/pages/Categories";
import Units from "@/pages/Units";
import BarcodeGenerator from "@/pages/BarcodeGenerator";
import MasterImportExport from "@/pages/MasterImportExport";
import SubscriptionPage from "@/pages/Subscription";
import NotFound from "@/pages/not-found";
import { BackgroundUploadProvider } from "@/components/BackgroundUpload";
import { POSProvider } from "@/hooks/use-pos";
import { Loader2, Package, AlertCircle, Info, Megaphone, ChevronLeft, ChevronRight, Monitor, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Announcement } from "@shared/schema";
import { useRole } from "@/hooks/use-role";

function LoginPage() {
  const { login, register, loginError, registerError, isLoggingIn, isRegistering } = useAuth();
  const [location, setLocation] = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const initialMode = (queryParams.get("mode") as "admin" | "register") || "choice";

  const [authType, setAuthType] = useState<"choice" | "admin" | "register">(initialMode as any);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showForgotInfo, setShowForgotInfo] = useState(false);

  useEffect(() => {
    /* global google */
    if (authType === "choice") return;

    let checkInterval: NodeJS.Timeout;

    const tryInitGoogle = () => {
      const btnContainer = document.getElementById("googleBtn");
      if (window.google && btnContainer) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "PROVIDE_GOOGLE_CLIENT_ID",
          callback: async (response: any) => {
            try {
              const res = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
              });
              if (res.ok) {
                const user = await res.json();
                queryClient.setQueryData(["/api/auth/user"], user);
                
                const qParams = new URLSearchParams(window.location.search);
                const intent = qParams.get("intent");
                const moduleToBuy = qParams.get("module");
                
                if (intent === "buy" && moduleToBuy) {
                  setLocation(`/subscription?module=${moduleToBuy}&autoCheckout=true`);
                } else {
                  setLocation("/");
                }
              } else {
                const err = await res.json();
                console.error("Google login failed:", err.message);
              }
            } catch (e) {
              console.error("Google login error:", e);
            }
          },
        });

        window.google.accounts.id.renderButton(btnContainer, {
          theme: "filled_black",
          size: "large",
          width: 320,
          shape: "pill",
          text: "signin_with"
        });

        if (checkInterval) clearInterval(checkInterval);
        return true;
      }
      return false;
    };

    if (!tryInitGoogle()) {
      checkInterval = setInterval(tryInitGoogle, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [setLocation, authType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authType === "admin" || authType === "choice") {
        await login({ username, password });
      } else {
        await register({ username, password, firstName, lastName });
      }

      const qParams = new URLSearchParams(window.location.search);
      const intent = qParams.get("intent");
      const moduleToBuy = qParams.get("module");
      
      if (intent === "buy" && moduleToBuy) {
        setLocation(`/subscription?module=${moduleToBuy}&autoCheckout=true`);
      } else if (authType === "register") {
        setLocation("/subscription");
      } else {
        setLocation("/");
      }
    } catch (err) {
      // errors are handled by useAuth hook
    }
  };

  const error = authType === "register" ? registerError : loginError;
  const isPending = authType === "register" ? isRegistering : isLoggingIn;

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0044CC] overflow-hidden font-sans">
      {/* Left Side: Branding & Trust */}
      <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-[#0066FF] to-[#0044CC] relative">
        <div className="z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
            <Package className="w-8 h-8 text-white" />
          </div>
          <span className="text-3xl font-bold text-white tracking-tight">Kazana ERP</span>
        </div>

        <div className="z-10 max-w-md">
          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">Sistem Manajemen Bisnis Profesional</h2>
          <p className="text-blue-100/70 text-lg leading-relaxed font-medium">
            Kelola stok, gudang, dan penjualan dalam satu platform terpadu yang aman dan cerdas.
          </p>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Right Side: Login Content */}
      <div className="flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md z-10">
          {authType === "choice" ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-black text-white mb-3 tracking-tighter">SELAMAT DATANG</h1>
                <p className="text-blue-200/60 font-medium">Pilih akses sistem yang Anda butuhkan</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <button
                  onClick={() => setAuthType("admin")}
                  className="group relative bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 text-left transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                      <Monitor className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Dashboard Admin</h3>
                      <p className="text-blue-200/50 text-sm font-medium">Kelola Stok, User, & Laporan</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setLocation("/pos")}
                  className="group relative bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 text-left transition-all hover:scale-[1.02] active:scale-95 shadow-2xl"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Terminal Kasir (POS)</h3>
                      <p className="text-emerald-200/50 text-sm font-medium">Input Penjualan & Print Struk</p>
                    </div>
                  </div>
                </button>
              </div>

              <p className="text-center text-white/20 text-xs font-mono tracking-widest uppercase pt-8">Powered by Kazana AI Engine</p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 lg:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500">
              <button
                onClick={() => setAuthType("choice")}
                className="mb-8 flex items-center text-blue-200/60 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>

              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 tracking-tighter uppercase">
                  {authType === "admin" ? "Admin Login" : "Daftar Akun"}
                </h2>
                <p className="text-blue-200/60 font-medium">Masukkan kredensial Anda untuk masuk</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error.message}
                  </div>
                )}

                {authType === "register" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-blue-200/80 uppercase tracking-wider ml-1">Nama Depan</label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14 rounded-2xl focus:ring-blue-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Nama Belakang</label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14 rounded-2xl focus:ring-blue-500/50"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Username</label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-blue-500/50 placeholder:text-white/30"
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Password</label>
                    {authType === "admin" && (
                      <button
                        type="button"
                        className="text-xs font-medium text-blue-200 hover:text-white transition-colors"
                        onClick={() => setShowForgotInfo(true)}
                      >
                        Lupa?
                      </button>
                    )}
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-blue-500/50 placeholder:text-white/30"
                    autoComplete={authType === "admin" ? "current-password" : "new-password"}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-white text-[#0044CC] hover:bg-white/90 font-black text-lg rounded-2xl shadow-2xl shadow-black/20 transition-all active:scale-95 uppercase tracking-tight"
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
                  {authType === "admin" ? "Masuk Sekarang" : "Buat Akun"}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10"></span>
                  </div>
                  <div className="relative flex justify-center text-sm uppercase tracking-widest font-bold">
                    <span className="px-4 bg-[#0044CC]/20 text-blue-200/60 text-[10px] backdrop-blur-md rounded-full">Atau</span>
                  </div>
                </div>

                <div id="googleBtn" className="w-full flex justify-center"></div>

                <div className="text-center pt-4">
                  <p className="text-sm text-blue-200/60 font-medium">
                    {authType === "admin" ? (
                      <>
                        Belum punya akun?{" "}
                        <button
                          type="button"
                          className="text-white font-bold hover:underline"
                          onClick={() => setAuthType("register")}
                        >
                          Daftar
                        </button>
                      </>
                    ) : (
                      <>
                        Sudah punya akun?{" "}
                        <button
                          type="button"
                          className="text-white font-bold hover:underline"
                          onClick={() => setAuthType("admin")}
                        >
                          Login
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showForgotInfo} onOpenChange={setShowForgotInfo}>
        <DialogContent className="sm:max-w-[400px] bg-[#002D70] text-white border-white/20">
          <DialogHeader>
            <DialogTitle>Lupa Password?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-3 p-4 rounded-lg bg-white/5 border border-white/10">
              <Info className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-200/80">
                <p>Hubungi <strong className="text-white font-bold">Admin</strong> tim Anda untuk mereset password.</p>
                <p>Admin dapat mereset password Anda melalui halaman <strong className="text-white font-bold">User Roles</strong>.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={() => setShowForgotInfo(false)} data-testid="button-close-forgot">
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnnouncementPopup() {
  const { data: announcements } = useAnnouncements();
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeAnnouncements, setActiveAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!announcements || announcements.length === 0) return;

    const now = new Date();
    const active = (announcements as Announcement[]).filter((a) => {
      if (a.expiresAt && new Date(a.expiresAt) < now) return false;
      return true;
    });

    if (active.length === 0) return;

    const dismissedRaw = localStorage.getItem("dismissed_announcements");
    const dismissed: Record<string, string> = dismissedRaw ? JSON.parse(dismissedRaw) : {};

    const unread = active.filter((a) => {
      const dismissedAt = dismissed[String(a.id)];
      if (!dismissedAt) return true;
      return new Date(a.createdAt) > new Date(dismissedAt);
    });

    if (unread.length > 0) {
      setActiveAnnouncements(unread);
      setCurrentIndex(0);
      setOpen(true);
    }
  }, [announcements]);

  const dismissAll = useCallback(() => {
    const dismissedRaw = localStorage.getItem("dismissed_announcements");
    const dismissed: Record<string, string> = dismissedRaw ? JSON.parse(dismissedRaw) : {};
    const now = new Date().toISOString();
    activeAnnouncements.forEach((a) => {
      dismissed[String(a.id)] = now;
    });
    localStorage.setItem("dismissed_announcements", JSON.stringify(dismissed));
    setOpen(false);
  }, [activeAnnouncements]);

  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[currentIndex];
  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismissAll(); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">{current.title}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(current.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            {activeAnnouncements.length > 1 && (
              <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate shrink-0" data-testid="badge-announcement-count">
                {currentIndex + 1}/{activeAnnouncements.length}
              </Badge>
            )}
          </div>
        </DialogHeader>
        <div className="py-3 space-y-3">
          {current.imageUrl && (
            <div className="w-full rounded-md overflow-hidden relative aspect-square">
              <img
                src={current.imageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
              />
              <img
                src={current.imageUrl}
                alt={current.title}
                className="relative w-full h-full object-contain z-10"
                data-testid="img-announcement-popup"
              />
            </div>
          )}
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed" data-testid="text-announcement-content">
            {current.content}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {activeAnnouncements.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  data-testid="button-prev-announcement"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentIndex((i) => Math.min(activeAnnouncements.length - 1, i + 1))}
                  disabled={currentIndex === activeAnnouncements.length - 1}
                  data-testid="button-next-announcement"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          <Button onClick={dismissAll} data-testid="button-dismiss-announcements">
            Mengerti
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuthenticatedApp() {
  const { isCashier, isLoading } = useRole();
  const [location, setLocation] = useLocation();
  const isPOS = location.startsWith("/pos");

  useEffect(() => {
    if (!isLoading && isCashier && !isPOS) {
      setLocation("/pos");
    }
  }, [isCashier, isPOS, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isPOS) {
    return (
      <POSProvider>
        <Switch>
          <Route path="/pos" component={POS} />
          <Route component={NotFound} />
        </Switch>
      </POSProvider>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-10 mt-14 lg:mt-0 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/products" component={Products} />
            <Route path="/sessions" component={Sessions} />
            <Route path="/sessions/:id" component={SessionDetail} />
            <Route path="/roles" component={RoleManagement} />
            <Route path="/admin/logs" component={ActivityLogs} />
            <Route path="/admin/terminals" component={TerminalManagement} />
            <Route path="/admin/promotions" component={PromotionManagement} />
            <Route path="/admin/pos-sessions" component={POSSessions} />
            <Route path="/inbound" component={InboundSessions} />
            <Route path="/inbound/:id" component={InboundDetail} />
            <Route path="/outbound" component={OutboundSessions} />
            <Route path="/outbound/:id" component={OutboundDetail} />
            <Route path="/profile" component={Profile} />
            <Route path="/staff" component={StaffManagement} />
            <Route path="/announcements" component={Announcements} />
            <Route path="/feedback" component={FeedbackPage} />
            <Route path="/motivation" component={MotivationPage} />
            <Route path="/production/boms" component={BOMList} />
            <Route path="/production/boms/:id" component={BOMDetail} />
            <Route path="/production/assembly" component={AssemblySessions} />
            <Route path="/production/ai" component={ProductionAI} />
            <Route path="/accounting/accounts" component={Accounts} />
            <Route path="/accounting/journal" component={Journal} />
            <Route path="/accounting/assets" component={Assets} />
            <Route path="/accounting/reports" component={Reports} />
            <Route path="/sales/invoices" component={Invoices} />
            <Route path="/sales/invoices/new" component={NewInvoice} />
            <Route path="/master" component={MasterData} />
            <Route path="/master/categories" component={Categories} />
            <Route path="/master/units" component={Units} />
            <Route path="/master/barcode" component={BarcodeGenerator} />
            <Route path="/master/import-export" component={MasterImportExport} />
            <Route path="/reports/export" component={ReportsExport} />
            <Route path="/customers" component={Customers} />
            <Route path="/subscription" component={SubscriptionPage} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <AnnouncementPopup />
    </div>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const isPOS = location.startsWith("/pos");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isPOS) {
    return (
      <POSProvider>
        <Switch>
          <Route path="/pos" component={POS} />
          <Route component={NotFound} />
        </Switch>
      </POSProvider>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BackgroundUploadProvider>
          <Toaster />
          <Router />
        </BackgroundUploadProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
