import { useState, useEffect, useCallback } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useAnnouncements } from "@/hooks/use-announcements";
import { ScrollArea } from "@/components/ui/scroll-area";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Sessions from "@/pages/Sessions";
import SessionDetail from "@/pages/SessionDetail";
import StoreSetup from "@/pages/StoreSetup";
import RoleManagement from "@/pages/RoleManagement";

import ActivityLogs from "@/pages/ActivityLogs";
import SessionHub from "@/pages/SessionHub";
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
import AssemblySessionDetail from "@/pages/AssemblySessionDetail";
import ProductionAI from "@/pages/ProductionAI";
import POS from "@/pages/POS";
import Accounts from "@/pages/accounting/Accounts";
import Journal from "@/pages/accounting/Journal";
import AccountingOverview from "@/pages/accounting/Overview";
import Assets from "@/pages/accounting/Assets";
import Reports from "@/pages/accounting/Reports";
import InventoryValuation from "@/pages/accounting/InventoryValuation";
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
import ReportHub from "@/pages/ReportHub";
import BranchManagement from "@/pages/admin/BranchManagement";
import BackupCenter from "@/pages/admin/BackupCenter";
import StockTransfer from "@/pages/StockTransfer";
import PurchaseOrder from "@/pages/PurchaseOrder";
import Suppliers from "@/pages/Suppliers";
import SalesReturns from "@/pages/SalesReturns";
import B2BWholesale from "@/pages/B2BWholesale";
import DemandAnalytics from "@/pages/accounting/DemandAnalytics";
import SmartInsights from "@/pages/accounting/SmartInsights";
import LogisticsHub from "@/pages/LogisticsHub";
import CashLedger from "@/pages/accounting/CashLedger";
import PettyCashReport from "@/pages/admin/PettyCashReport";
import SaaSConsole from "@/pages/admin/SaaSConsole";
import StockLedger from "@/pages/reports/StockLedger";
import SalesSummary from "@/pages/reports/SalesSummary";
import SalesItems from "@/pages/reports/SalesItems";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import BusinessSolutionPage from "@/pages/front/BusinessSolutionPage";
import FeaturesPage from "@/pages/front/FeaturesPage";
import PricingPage from "@/pages/front/PricingPage";
import BlogPage from "@/pages/front/BlogPage";
import ContactPage from "@/pages/front/ContactPage";
import { BackgroundUploadProvider } from "@/components/BackgroundUpload";

import { POSProvider } from "@/hooks/use-pos";
import { BranchProvider } from "@/hooks/use-branch";
import { api } from "@shared/routes";

import { Loader2, Package, AlertCircle, Info, Megaphone, ChevronLeft, ChevronRight, Monitor, ShoppingCart, Box, Lock, Mail, Phone, Key, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { Announcement, Settings } from "@shared/schema";

import { useRole } from "@/hooks/use-role";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import React from "react";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("APP CRASH DETECTED:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-red-100 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Aplikasi Terhenti</h1>
            <p className="text-slate-600 mb-6 text-sm">Terjadi kesalahan teknis saat memuat dashboard. Harap laporkan pesan di bawah ini:</p>
            <div className="bg-red-50 p-4 rounded-xl text-left font-mono text-xs text-red-800 overflow-auto max-h-40 mb-6 border border-red-100">
              {this.state.error?.toString()}
            </div>
            <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl font-bold">
              Muat Ulang Halaman
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoginPage() {
  const [authType, setAuthType] = useState<"admin" | "register" | "verify" | "forgot" | "reset">("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetPending, setIsResetPending] = useState(false);

  const { login, register, verifyOtp, loginError, registerError, verifyOtpError, isLoggingIn, isRegistering, isVerifying } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    /* global google */

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
                } else if (window.location.pathname === "/pos") {
                  setLocation("/pos");
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

    if (authType !== "verify") {
      if (!tryInitGoogle()) {
        checkInterval = setInterval(tryInitGoogle, 500);
      }
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [setLocation, authType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (authType === "admin") {
        await login({ username, password });
      } else if (authType === "register") {
        await register({ username, password, email, phone, firstName, lastName });
        setAuthType("verify");
        toast({
          title: "Kode OTP Terkirim",
          description: "Silakan cek email Anda untuk mendapatkan kode verifikasi.",
        });
      } else if (authType === "verify") {
        await verifyOtp({ email, code: otpCode, username, password, phone, firstName, lastName });
      } else if (authType === "forgot") {
        setIsResetPending(true);
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: resetIdentifier }),
        });
        setIsResetPending(false);
        if (res.ok) {
          toast({ title: "OTP Reset Terkirim", description: "Silakan cek email Anda untuk kode reset password." });
          setAuthType("reset");
        } else {
          const err = await res.json();
          toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
        return;
      } else if (authType === "reset") {
        setIsResetPending(true);
        const res = await fetch("/api/auth/reset-password-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: resetIdentifier, code: otpCode, newPassword }),
        });
        setIsResetPending(false);
        if (res.ok) {
          toast({ title: "Berhasil!", description: "Password Anda telah diperbarui. Silakan login." });
          setAuthType("admin");
          setUsername(resetIdentifier);
        } else {
          const err = await res.json();
          toast({ title: "Gagal Reset", description: err.message, variant: "destructive" });
        }
        return;
      }

      const qParams = new URLSearchParams(window.location.search);
      const intent = qParams.get("intent");
      const moduleToBuy = qParams.get("module");

      if (authType === "admin") {
        if (intent === "buy" && moduleToBuy) {
          setLocation(`/subscription?module=${moduleToBuy}&autoCheckout=true`);
        } else if (window.location.pathname === "/pos") {
          setLocation("/pos");
        } else {
          setLocation("/");
        }
      }
    } catch (err) {
      // errors are handled by showing UI messages
    }
  };

  const getTitle = () => {
    if (authType === "register") return "Daftar Akun Baru";
    if (authType === "verify") return "Verifikasi Email";
    if (authType === "forgot") return "Lupa Password";
    if (authType === "reset") return "Reset Password";
    return "Login Akun";
  };

  const error = authType === "admin" ? loginError : (authType === "register" ? registerError : verifyOtpError);
  const isPending = authType === "admin" ? isLoggingIn : (authType === "register" ? isRegistering : isVerifying);

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
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-8 lg:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-500">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 tracking-tighter uppercase">
                  {getTitle()}
                </h2>
                <p className="text-blue-200/60 font-medium">
                  {authType === "verify" ? `Masukkan kode yang dikirim ke ${email}` : 
                   authType === "forgot" ? "Masukkan identifier akun Anda untuk menerima OTP" :
                   authType === "reset" ? "Masukkan kode OTP dan password baru Anda" :
                   "Masukkan kredensial Anda untuk masuk"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error.message}
                  </div>
                )}

                {authType === "verify" ? (
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Kode Verifikasi (6 Digit)</label>
                    <Input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="XXXXXX"
                      className="bg-white/5 border-white/10 text-white text-center text-2xl tracking-[10px] h-20 rounded-2xl focus:ring-blue-500/50 placeholder:text-white/30"
                      required
                    />
                    <p className="text-xs text-blue-200/50 text-center italic">Cek kotak masuk atau spam email Anda.</p>
                  </div>
                ) : authType === "forgot" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Username / Email / HP</label>
                       <Input
                         value={resetIdentifier}
                         onChange={(e) => setResetIdentifier(e.target.value)}
                         placeholder="Masukkan identifier Anda"
                         className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-blue-500/50 placeholder:text-white/30"
                         required
                       />
                    </div>
                  </div>
                ) : authType === "reset" ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Username / Email / HP</label>
                       <Input
                         value={resetIdentifier}
                         disabled
                         className="bg-white/5 border-white/10 text-white/50 h-14 rounded-2xl"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Kode OTP Reset</label>
                       <Input
                         value={otpCode}
                         onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                         placeholder="XXXXXX"
                         className="bg-white/5 border-white/10 text-white text-center text-lg h-14 rounded-2xl focus:ring-blue-500/50"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Password Baru</label>
                       <Input
                         type="password"
                         value={newPassword}
                         onChange={(e) => setNewPassword(e.target.value)}
                         placeholder="Min 8 karakter"
                         className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-blue-500/50"
                         required
                       />
                    </div>
                  </div>
                ) : (
                  <>
                    {authType === "register" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-blue-200/80 uppercase tracking-wider ml-1">Nama Depan</label>
                          <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14 rounded-2xl focus:ring-blue-500/50"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Nama Belakang</label>
                          <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-14 rounded-2xl focus:ring-blue-500/50"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">
                        {authType === "admin" ? "Username / Email / HP" : "Username"}
                      </label>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Contoh: budi atau budi@email.com"
                        className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-blue-500/50 placeholder:text-white/30"
                        required
                      />
                    </div>

                    {authType === "register" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Email Utama</label>
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="budi@email.com"
                            className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-blue-500/50 placeholder:text-white/30"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-white/70 uppercase tracking-wider ml-1">Nomor HP</label>
                          <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="0812xxxxxxxx"
                            className="bg-white/5 border-white/10 text-white h-14 rounded-2xl focus:ring-blue-500/50 placeholder:text-white/30"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-white/70 uppercase tracking-wider">Password</label>
                        {authType === "admin" && (
                          <button
                            type="button"
                            className="text-xs font-medium text-blue-200 hover:text-white transition-colors"
                            onClick={() => setAuthType("forgot")}
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
                        required
                      />
                    </div>
                  </>
                )}


                <Button
                  type="submit"
                  className="w-full h-14 bg-white text-[#0044CC] hover:bg-white/90 font-black text-lg rounded-2xl shadow-2xl shadow-black/20 transition-all active:scale-95 uppercase tracking-tight"
                  disabled={isPending || isResetPending}
                >
                  {(isPending || isResetPending) && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
                  {authType === "admin" ? "Masuk Sekarang" : 
                   authType === "verify" ? "Konfirmasi Kode" : 
                   authType === "forgot" ? "Kirim OTP Reset" :
                   authType === "reset" ? "Reset Password" :
                   "Daftar & Kirim OTP"}
                </Button>

                {authType !== "verify" && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10"></span>
                      </div>
                      <div className="relative flex justify-center text-sm uppercase tracking-widest font-bold">
                        <span className="px-4 bg-[#0044CC]/20 text-blue-200/60 text-[10px] backdrop-blur-md rounded-full">Atau</span>
                      </div>
                    </div>

                    <div id="googleBtn" className="w-full flex justify-center h-[52px]"></div>
                  </>
                )}

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
                    ) : authType === "forgot" || authType === "reset" ? (
                      <button
                        type="button"
                        className="text-white font-bold hover:underline"
                        onClick={() => setAuthType("admin")}
                      >
                        Kembali ke Login
                      </button>
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
        </div>
      </div>


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
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none gap-0 bg-background/95 backdrop-blur-sm">
        <DialogHeader className="p-6 pb-2 border-b bg-background/50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold tracking-tight">{current.title}</DialogTitle>
              <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">
                {new Date(current.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            {activeAnnouncements.length > 1 && (
              <Badge variant="secondary" className="font-bold px-2.5 py-1 rounded-lg shrink-0" data-testid="badge-announcement-count">
                {currentIndex + 1} / {activeAnnouncements.length}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {current.imageUrl && (
              <div className="w-full rounded-2xl overflow-hidden relative aspect-video shadow-2xl shadow-primary/10 border border-primary/5">
                <img
                  src={current.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40"
                />
                <img
                  src={current.imageUrl}
                  alt={current.title}
                  className="relative w-full h-full object-contain z-10 transition-transform duration-500 hover:scale-105"
                  data-testid="img-announcement-popup"
                />
              </div>
            )}
            <div className="prose prose-sm max-w-none">
              <p className="text-base text-foreground/80 whitespace-pre-wrap leading-relaxed font-medium" data-testid="text-announcement-content">
                {current.content}
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {activeAnnouncements.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-10 w-10 border-primary/10 hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  data-testid="button-prev-announcement"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="flex gap-1">
                  {activeAnnouncements.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 transition-all duration-300 rounded-full ${idx === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-primary/20'}`}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl h-10 w-10 border-primary/10 hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                  onClick={() => setCurrentIndex((i) => Math.min(activeAnnouncements.length - 1, i + 1))}
                  disabled={currentIndex === activeAnnouncements.length - 1}
                  data-testid="button-next-announcement"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>
          <Button
            onClick={dismissAll}
            className="rounded-xl h-11 px-8 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95 uppercase tracking-tight"
            data-testid="button-dismiss-announcements"
          >
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AuthenticatedApp() {
  const { isCashier, isLoading, role } = useRole();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const isPOS = location.startsWith("/pos");

  useEffect(() => {
    console.log("[App] Authenticated Client State:", { user: user?.username, role, location });
  }, [user, role, location]);

  const { data: settings, isLoading: settingsLoading } = useQuery<Settings>({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      if (!res.ok) throw new Error("Gagal mengambil pengaturan");
      return res.json();
    },
    enabled: !!user && !user.adminId,
  });

  useEffect(() => {
    if (!settingsLoading && settings && user && !user.adminId && location !== "/setup" && !location.startsWith("/subscription")) {
      const s = settings as any;
      if (!s.storeName || !s.storePhone || !s.storeEmail || s.storeName === "Kazana Shop") {
        setLocation("/setup");
      }
    }
  }, [settings, settingsLoading, user, location, setLocation]);



  useEffect(() => {
    if (!isLoading && isCashier && location === "/") {
      setLocation("/pos");
    }
  }, [isCashier, location, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSetup = location === "/setup";
  const isSubscription = location.startsWith("/subscription");

  if (isSetup) {
    return (
      <Switch>
        <Route path="/setup" component={StoreSetup} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (isSubscription) {
    return (
      <Switch>
        <Route path="/subscription" component={SubscriptionPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <>
      {isPOS ? (
        <Switch>
          <Route path="/pos" component={POS} />
          <Route component={NotFound} />
        </Switch>
      ) : (
        <div className="min-h-screen bg-slate-50/50 flex flex-col lg:flex-row">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-10 mt-14 lg:mt-0 overflow-y-auto h-screen">
            <div className="max-w-7xl mx-auto">
              <Switch>
                <Route path="/" component={Dashboard} />

                {/* Master Data & Products */}
                <Route path="/products">
                  <ProtectedRoute allowedRoles={["admin", "sku_manager", "production", "cashier"]}>
                    <Products />
                  </ProtectedRoute>
                </Route>
                <Route path="/master">
                  <ProtectedRoute allowedRoles={["admin", "sku_manager"]}>
                    <MasterData />
                  </ProtectedRoute>
                </Route>
                <Route path="/master/categories">
                  <ProtectedRoute allowedRoles={["admin", "sku_manager"]}>
                    <Categories />
                  </ProtectedRoute>
                </Route>
                <Route path="/master/units">
                  <ProtectedRoute allowedRoles={["admin", "sku_manager"]}>
                    <Units />
                  </ProtectedRoute>
                </Route>

                {/* Admin & Security */}
                <Route path="/roles">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <RoleManagement />
                  </ProtectedRoute>
                </Route>
                <Route path="/session-hub">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <SessionHub />
                  </ProtectedRoute>
                </Route>
                <Route path="/admin/logs">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <ActivityLogs />
                  </ProtectedRoute>
                </Route>
                <Route path="/staff">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <StaffManagement />
                  </ProtectedRoute>
                </Route>

                <Route path="/accounting">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AccountingOverview />
                  </ProtectedRoute>
                </Route>
                <Route path="/accounting/accounts">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Accounts />
                  </ProtectedRoute>
                </Route>
                <Route path="/accounting/journal">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Journal />
                  </ProtectedRoute>
                </Route>
                <Route path="/accounting/reports">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Reports />
                  </ProtectedRoute>
                </Route>

                {/* Production */}
                <Route path="/production/boms">
                  <ProtectedRoute allowedRoles={["admin", "production"]}>
                    <BOMList />
                  </ProtectedRoute>
                </Route>
                <Route path="/production/ai">
                  <ProtectedRoute allowedRoles={["admin", "production"]}>
                    <ProductionAI />
                  </ProtectedRoute>
                </Route>

                <Route path="/sessions" component={Sessions} />
                <Route path="/sessions/:id" component={SessionDetail} />
                <Route path="/admin/terminals" component={TerminalManagement} />
                <Route path="/admin/promotions" component={PromotionManagement} />
                <Route path="/admin/pos-sessions" component={POSSessions} />
                <Route path="/inbound" component={InboundSessions} />
                <Route path="/inbound/:id" component={InboundDetail} />
                <Route path="/outbound" component={OutboundSessions} />
                <Route path="/outbound/:id" component={OutboundDetail} />
                <Route path="/profile" component={Profile} />
                <Route path="/announcements" component={Announcements} />
                <Route path="/feedback" component={FeedbackPage} />
                <Route path="/motivation" component={MotivationPage} />
                <Route path="/production/boms/:id" component={BOMDetail} />
                <Route path="/production/assembly" component={AssemblySessions} />
                <Route path="/production/assembly/:id" component={AssemblySessionDetail} />
                <Route path="/accounting/assets" component={Assets} />
                <Route path="/accounting/inventory-valuation" component={InventoryValuation} />
                <Route path="/sales/invoices" component={Invoices} />
                <Route path="/sales/invoices/new" component={NewInvoice} />
                <Route path="/master/barcode" component={BarcodeGenerator} />
                <Route path="/master/import-export" component={MasterImportExport} />
                <Route path="/reports" component={ReportHub} />
                <Route path="/reports/export" component={ReportsExport} />
                <Route path="/reports/stock-ledger" component={StockLedger} />
                <Route path="/reports/sales-summary" component={SalesSummary} />
                <Route path="/reports/sales-items" component={SalesItems} />
                <Route path="/customers" component={Customers} />


                {/* Enterprise Routes */}
                <Route path="/admin/branches">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <BranchManagement />
                  </ProtectedRoute>
                </Route>
                <Route path="/admin/backup">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <BackupCenter />
                  </ProtectedRoute>
                </Route>
                <Route path="/logistics/transfers" component={StockTransfer} />
                <Route path="/master/suppliers">
                  <ProtectedRoute allowedRoles={["admin", "sku_manager"]}>
                    <Suppliers />
                  </ProtectedRoute>
                </Route>
                <Route path="/purchasing/po">
                  <ProtectedRoute allowedRoles={["admin", "sku_manager"]}>
                    <PurchaseOrder />
                  </ProtectedRoute>
                </Route>
                <Route path="/sales/returns" component={SalesReturns} />
                <Route path="/accounting/analytics" component={DemandAnalytics} />
                <Route path="/accounting/insights">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <SmartInsights />
                  </ProtectedRoute>
                </Route>
                <Route path="/sales/b2b">
                  <ProtectedRoute allowedRoles={["admin", "sku_manager"]}>
                    <B2BWholesale />
                  </ProtectedRoute>
                </Route>
                <Route path="/logistics/hub">
                  <ProtectedRoute allowedRoles={["admin", "sku_manager"]}>
                    <LogisticsHub />
                  </ProtectedRoute>
                </Route>

                {/* Finance & Admin Extensions */}
                <Route path="/accounting/finance">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <CashLedger />
                  </ProtectedRoute>
                </Route>
                <Route path="/admin/petty-cash" component={PettyCashReport} />
                <Route path="/admin/saas-console">
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <SaaSConsole />
                  </ProtectedRoute>
                </Route>

                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={LoginPage} />
        
        {/* Front Web Routes */}
        <Route path="/" component={LandingPage} />
        <Route path="/solusi/:type" component={BusinessSolutionPage} />
        <Route path="/features" component={FeaturesPage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/mitra" component={ContactPage} />
        <Route path="/karir" component={ContactPage} />
        <Route path="/kontak" component={ContactPage} />
        
        <Route component={LandingPage} />
      </Switch>
    );
  }

  return <AuthenticatedApp />;
}

function App() {
  console.log("[App] Rendering...");
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BranchProvider>
          <POSProvider>
            <BackgroundUploadProvider>
              <Toaster />
              <ErrorBoundary>
                <Router />
              </ErrorBoundary>
            </BackgroundUploadProvider>
          </POSProvider>
        </BranchProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
