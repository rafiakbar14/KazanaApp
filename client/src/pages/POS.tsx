import { useState, useMemo, useEffect } from "react";
import { useProducts } from "@/hooks/use-products";
import { usePOS } from "@/hooks/use-pos";
import POSLayout from "./POSLayout";
import { Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard, Banknote, QrCode, Package, ArrowLeft, Lock, X, CheckCircle2, ShoppingBag, UserPlus, Loader2, Tag, Settings2, Clock, Ticket, Store, History, Timer, AlertCircle, Printer, Monitor, Calendar } from "lucide-react";
import { Link } from "wouter";
import ReceiptPrinter from "@/components/ReceiptPrinter";
import SessionPrinter from "@/components/SessionPrinter";
import PrinterTest from "@/components/PrinterTest";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { useRole } from "@/hooks/use-role";

export default function POS() {
    const { data: allProducts, isLoading } = useProducts();
    const pos = usePOS();
    const { isAdmin, isLoading: isLoadingRole } = useRole();
    const { 
        isVerified, verifyPin, isVerifying, currentDevice, isLoadingDevice, 
        registerDevice, isRegistering, currentCashier, logout, targetCashier, 
        setTargetCashier, cashiers, isLoadingCashiers 
    } = pos;
    const [search, setSearch] = useState("");
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const [isSessionOpen, setIsSessionOpen] = useState(false);
    const [isPettyCashOpen, setIsPettyCashOpen] = useState(false);
    const [isSessionPrinterOpen, setIsSessionPrinterOpen] = useState(false);
    const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false);
    const [isPrinterTestOpen, setIsPrinterTestOpen] = useState(false);
    const [paperSize, setPaperSize] = useState<"58mm" | "80mm">(() => (localStorage.getItem("pos_paper_size") as "58mm" | "80mm") || "58mm");

    const [isPendingSalesOpen, setIsPendingSalesOpen] = useState(false);
    const [isVoucherOpen, setIsVoucherOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [voucherCode, setVoucherCode] = useState("");
    const [activeMobileTab, setActiveMobileTab] = useState<"catalog" | "cart" | "history">("catalog");

    // New Customer Form
    const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });

    const filteredProducts = useMemo(() => {
        if (!allProducts) return [];
        const s = search.toLowerCase();
        const cat = pos.selectedCategory;
        
        return allProducts.filter(p => {
            const matchesSearch = (p.name?.toLowerCase() || "").includes(s) || (p.sku?.toLowerCase() || "").includes(s);
            const matchesCategory = cat === "Semua" || p.category === cat;
            const isFinishedGood = !p.productType || p.productType === "finished_good";
            return matchesSearch && matchesCategory && p.locationType === "toko" && isFinishedGood;
        });
    }, [allProducts, search, pos.selectedCategory]);

    if (pos.isLoadingDevice) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-900">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Menyiapkan Perangkat POS...</p>
                </div>
            </div>
        );
    }

    if (!pos.currentDevice) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-6">
                <Card className="max-w-md w-full rounded-[2.5rem] border-white/10 bg-slate-800 shadow-2xl p-8">
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                            <Monitor className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Perangkat Belum Terdaftar</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">Perangkat ini belum terdaftar di sistem pusat. Silakan minta Kode Registrasi kepada Admin untuk mengaktifkan terminal kasir ini.</p>
                        <div className="pt-4 flex flex-col gap-3">
                            <RegisterDeviceDialog onRegister={pos.registerDevice} isRegistering={pos.isRegistering} />
                            <Link href="/"><Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-slate-400">Kembali ke Dashboard</Button></Link>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    if (!pos.isVerified) {
        return (
            <PinLockScreen 
                onVerify={pos.verifyPin} 
                isVerifying={pos.isVerifying} 
                cashiers={pos.cashiers || []} 
            />
        );
    }

    const formatCurrency = (val: any) => {
        try {
            const num = Number(val);
            if (isNaN(num)) return "Rp 0";
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
        } catch (e) {
            return "Rp " + (val || 0);
        }
    };

    const handleCheckout = () => {
        pos.checkout();
        setIsCheckoutOpen(false);
    };

    // Keyboard Shortcuts & Universal Barcode Scanner Integration
    useEffect(() => {
        let barcodeBuffer = "";
        let typingTimer: NodeJS.Timeout | null = null;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "F8") {
                e.preventDefault();
                if (pos.cart.length > 0) setIsCheckoutOpen(true);
                return;
            } else if (e.key === "F1") {
                e.preventDefault();
                document.getElementById("pos-search-input")?.focus();
                return;
            } else if (e.key === "Escape") {
                if (isCheckoutOpen) setIsCheckoutOpen(false);
                if (isPrinterSettingsOpen) setIsPrinterSettingsOpen(false);
                return;
            }

            // Universal Barcode Scanner Engine (detects rapid automated keystrokes)
            // Scanners act like keyboards but type with < 50ms gaps between characters
            const activeTag = document.activeElement?.tagName.toLowerCase();
            const isTypingInInput = activeTag === 'input' || activeTag === 'textarea';
            
            // Only capture if not typing normally in an input (or if we want scanner to work everywhere)
            if (e.key.length === 1) { 
                barcodeBuffer += e.key;
                if (typingTimer) clearTimeout(typingTimer);
                typingTimer = setTimeout(() => { barcodeBuffer = ""; }, 50); 
            } else if (e.key === "Enter" && barcodeBuffer.length >= 3) {
                // If it ends with Enter and was typed extremely fast, it's a barcode
                if (!isTypingInInput) {
                    e.preventDefault();
                    const scannedSku = barcodeBuffer;
                    barcodeBuffer = "";
                    
                    if (allProducts) {
                        const found = allProducts.find(p => p.sku === scannedSku || p.productCode === scannedSku || p.id.toString() === scannedSku);
                        if (found) {
                            pos.addToCart(found);
                        }
                    }
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            if (typingTimer) clearTimeout(typingTimer);
        };
    }, [isCheckoutOpen, isPrinterSettingsOpen, allProducts, pos.cart]);

    if (isLoadingDevice || isLoadingRole) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-900 gap-4 text-slate-900">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="animate-pulse opacity-50 font-medium tracking-widest text-sm">MEMUAT SISTEM KASIR...</p>
            </div>
        );
    }

    if (!currentDevice) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-900 p-4 text-center text-slate-900">
                <div className="w-20 h-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mb-6 border border-amber-500/20">
                    <Lock className="w-10 h-10 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2 tracking-tight">Terminal Belum Terdaftar</h1>
                <p className="text-slate-400 max-w-xs mx-auto mb-8 font-medium">Perangkat ini belum terdaftar di sistem POS. Silakan hubungi Admin atau gunakan akun Admin untuk mendaftarkan perangkat ini.</p>

                {isAdmin ? (
                    <div className="w-full max-w-sm">
                        <DeviceRegistrationOverlay onRegister={registerDevice} isLoading={isRegistering} />
                    </div>
                ) : (
                    <Link href={`/login?mode=admin&redirect=${encodeURIComponent(window.location.pathname)}`}>
                        <Button className="bg-white text-black hover:bg-white/90 rounded-xl px-10 font-bold h-12 shadow-xl shadow-white/5 tracking-tight group">
                            LOGIN SEBAGAI ADMIN
                            <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                )}
                <p className="mt-8 text-[10px] text-slate-900/20 font-mono tracking-tighter">ID Perangkat: {pos.deviceId}</p>
            </div>
        );
    }

    if (!isVerified) {
        if (!targetCashier) {
            return (
                <ErrorBoundary>
                    <CashierSelectionOverlay 
                        cashiers={cashiers} 
                        isLoading={isLoadingCashiers} 
                        onSelect={setTargetCashier} 
                        deviceName={currentDevice?.name || "Terminal"} 
                    />
                </ErrorBoundary>
            );
        }
        return (
            <ErrorBoundary>
                <PINOverlay 
                    onVerify={(pin) => verifyPin(pin, targetCashier.id)} 
                    isLoading={isVerifying} 
                    deviceName={currentDevice?.name || "Terminal Aktif"} 
                    isAdmin={isAdmin} 
                    cashier={targetCashier}
                    onBack={() => setTargetCashier(null)}
                />
            </ErrorBoundary>
        );
    }

    if (pos.isLoadingSession) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900 text-slate-900">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase opacity-50">Menghubungkan ke Terminal...</p>
            </div>
        );
    }

    if (!pos.activeSession) {
        return (
            <ErrorBoundary>
                <SessionOpeningOverlay onStart={pos.startSession} isLoading={pos.isLoadingSession} deviceName={currentDevice?.name || "Terminal"} onLogout={logout} />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <POSLayout>
            <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50 text-slate-900">
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-white shadow-lg border-t-slate-200 backdrop-blur-xl border-t border-slate-200 h-16 safe-bottom">
                    <button
                        className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all", activeMobileTab === "catalog" ? "text-primary bg-primary/5" : "text-slate-400")}
                        onClick={() => setActiveMobileTab("catalog")}
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Katalog</span>
                    </button>
                    <button
                        className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all relative", activeMobileTab === "cart" ? "text-primary bg-primary/5" : "text-slate-400")}
                        onClick={() => setActiveMobileTab("cart")}
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Keranjang</span>
                        {pos.cart.length > 0 && (
                            <span className="absolute top-2 right-1/4 w-4 h-4 bg-red-500 text-white flex items-center justify-center text-[10px] font-black rounded-full ring-2 ring-black">
                                {pos.cart.length}
                            </span>
                        )}
                    </button>
                    <button
                        className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all", activeMobileTab === "history" ? "text-primary bg-primary/5" : "text-slate-400")}
                        onClick={() => {
                            setActiveMobileTab("history");
                            setIsHistoryOpen(true);
                        }}
                    >
                        <History className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Riwayat</span>
                    </button>
                    <button
                        className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all", isPrinterSettingsOpen ? "text-primary bg-primary/5" : "text-slate-400")}
                        onClick={() => setIsPrinterSettingsOpen(true)}
                    >
                        <Settings2 className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Setup</span>
                    </button>
                </div>

                {/* Left Panel: Categories (Desktop/Tablet) */}
                <aside className="hidden lg:flex w-20 xl:w-24 border-r border-slate-200 flex-col items-center py-6 gap-4 bg-white backdrop-blur-xl shrink-0">
                    <div className="mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                            <Store className="w-6 h-6 text-primary" />
                        </div>
                    </div>
                    
                    <button
                        onClick={() => pos.setSelectedCategory("Semua")}
                        className={cn(
                            "w-14 h-14 xl:w-16 xl:h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2",
                            pos.selectedCategory === "Semua" ? "bg-primary border-primary text-slate-900 shadow-xl shadow-primary/20" : "bg-slate-50 border-transparent text-slate-400 hover:bg-white/10 hover:text-primary"
                        )}
                    >
                        <Package className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">ALL</span>
                    </button>
                    
                    <div className="flex-1 flex flex-col gap-3 w-full items-center overflow-y-auto no-scrollbar py-2">
                        {pos.categories?.filter(Boolean).map(cat => (
                            <button
                                key={cat}
                                onClick={() => pos.setSelectedCategory(cat)}
                                className={cn(
                                    "w-14 h-14 xl:w-16 xl:h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2 text-center px-1 shrink-0",
                                    pos.selectedCategory === cat ? "bg-primary border-primary text-slate-900 shadow-xl shadow-primary/20" : "bg-slate-50 border-transparent text-slate-500 hover:bg-white/10 hover:text-primary"
                                )}
                            >
                                <Tag className="w-4 h-4" />
                                <span className="text-[8px] xl:text-[9px] font-black uppercase leading-[1.1] line-clamp-2">{cat}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-4 w-full flex flex-col items-center gap-4 border-t border-slate-200">
                        <button
                            onClick={() => setIsSessionOpen(true)}
                            className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-primary shadow-lg shadow-emerald-500/10 group"
                            title="Z-Report / Closing"
                        >
                            <Settings2 className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            <span className="text-[8px] font-black uppercase">CLOSING</span>
                        </button>
                        
                        <button
                            onClick={() => setIsPrinterSettingsOpen(true)}
                            className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all bg-slate-50 border-2 border-transparent text-slate-900/20 hover:bg-white/10 hover:text-primary"
                            title="Printer Setup"
                        >
                            <Printer className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase">SETUP</span>
                        </button>
                    </div>
                </aside>

                {/* Center Panel: Product Grid */}
                <div className={cn("flex-1 flex flex-col overflow-hidden", activeMobileTab === "cart" && "hidden lg:flex")}>
                    {/* Header: Search & Mobile Category Bar */}
                    <div className="p-4 lg:p-6 space-y-4">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                            <div className="relative flex items-center">
                                <Search className="absolute left-4 w-5 h-5 text-slate-900/20 group-focus-within:text-primary transition-colors" />
                                <Input
                                    className="bg-slate-50 border-white/10 h-12 lg:h-14 pl-12 rounded-2xl text-base lg:text-lg focus:ring-primary/20 focus:border-primary/50 transition-all shadow-inner"
                                    placeholder="Cari Produk atau Scan Barcode..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Horizontal Category Scroll (Mobile Only) */}
                        <div className="lg:hidden flex overflow-x-auto gap-2 no-scrollbar py-1">
                            <Button
                                variant={pos.selectedCategory === "Semua" ? "default" : "outline"}
                                className="h-10 rounded-xl px-6 border-white/10 whitespace-nowrap text-xs font-bold"
                                onClick={() => pos.setSelectedCategory("Semua")}
                            >Semua</Button>
                            {pos.categories?.filter(Boolean).map(cat => (
                                <Button
                                    key={cat}
                                    variant={pos.selectedCategory === cat ? "default" : "outline"}
                                    className="h-10 rounded-xl px-6 border-white/10 whitespace-nowrap text-xs font-bold"
                                    onClick={() => pos.setSelectedCategory(cat)}
                                >{cat}</Button>
                            ))}
                        </div>
                    </div>

                    {/* Grid Area */}
                    <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-24 lg:pb-6 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
                                {filteredProducts.map(product => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onAdd={() => pos.addToCart(product)}
                                        formatCurrency={formatCurrency}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Cart & Checkout */}
                <div className={cn("w-full lg:w-[350px] xl:w-[400px] border-l border-slate-200 bg-white backdrop-blur-3xl flex flex-col overflow-hidden", activeMobileTab === "catalog" && "hidden lg:flex")}>
                    {/* Cart Header */}
                    <div className="p-4 lg:p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-bold">Keranjang</h2>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-primary" onClick={() => setIsHistoryOpen(true)} title="Riwayat Penjualan">
                                <History className="w-4 h-4 mr-1.5" />
                                <span className="text-[10px] font-bold hidden xl:inline">RIWAYAT</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-primary" onClick={() => setIsPendingSalesOpen(true)} title="Pesanan Tertunda">
                                <Timer className="w-4 h-4 mr-1.5" />
                                <span className="text-[10px] font-bold hidden xl:inline">TUNDA</span>
                            </Button>
                            <div className="ml-1">
                                <Badge variant="secondary" className="rounded-full px-2.5 h-6 text-[10px] font-black bg-primary text-white border-none shadow-lg shadow-primary/20">
                                    {pos.cart.length}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Quick Action Bar (Floating on mobile if needed, but here simple) */}
                    <div className="px-4 lg:px-6 py-2 border-b border-slate-200 bg-slate-50 flex gap-2 shrink-0 overflow-x-auto no-scrollbar">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 min-w-[80px] text-[10px] font-black h-9 border border-white/10 hover:bg-white/10 rounded-lg shrink-0"
                            onClick={() => setIsPettyCashOpen(true)}
                        >KAS KECIL</Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 min-w-[80px] text-[10px] font-black h-9 border border-white/10 hover:bg-white/10 rounded-lg shrink-0"
                            onClick={() => pos.holdSale()}
                        >TUNDA</Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 min-w-[80px] text-[10px] font-black h-9 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg shrink-0"
                            onClick={() => pos.clearCart()}
                        >HAPUS SEMUA</Button>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 pb-32 lg:pb-4">
                        {pos.cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 pointer-events-none">
                                <Package className="w-16 h-16 mb-4" />
                                <p className="text-sm font-bold uppercase tracking-widest">Kosong</p>
                            </div>
                        ) : (
                            pos.cart.map(item => (
                                <CartItemCard
                                    key={item.id}
                                    item={item}
                                    onUpdate={pos.updateQuantity}
                                    onRemove={pos.removeFromCart}
                                    onDiscount={pos.updateItemDiscount}
                                    formatCurrency={formatCurrency}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer Summary Container */}
                    <div className="p-4 lg:p-6 bg-slate-50 border-t border-white/10 space-y-5 shrink-0 shadow-[0_-15px_30px_rgba(0,0,0,0.4)]">
                        <div className="space-y-2 text-[13px]">
                            <div className="flex justify-between text-slate-400">
                                <span className="font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                                <span className="font-mono font-medium">{formatCurrency(pos.totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                                <span className="font-bold uppercase tracking-widest text-[10px]">PPN (11%)</span>
                                <span className="font-mono font-medium">{formatCurrency(pos.totals.tax)}</span>
                            </div>
                            {(pos.totals.itemsDiscount > 0 || pos.totals.billDiscount > 0 || pos.totals.pointsDiscount > 0) && (
                                <div className="space-y-1.5 bg-red-400/5 px-3 py-2 rounded-xl border border-red-500/10">
                                    {(pos.totals.itemsDiscount > 0 || pos.totals.billDiscount > 0) && (
                                        <div className="flex justify-between text-red-500 font-bold">
                                            <span className="uppercase tracking-widest text-[9px]">Diskon Promo</span>
                                            <span className="font-mono">-{formatCurrency(pos.totals.itemsDiscount + pos.totals.billDiscount)}</span>
                                        </div>
                                    )}
                                    {pos.totals.pointsDiscount > 0 && (
                                        <div className="flex justify-between text-blue-500 font-bold">
                                            <span className="uppercase tracking-widest text-[9px]">Tukar Poin</span>
                                            <span className="font-mono">-{formatCurrency(pos.totals.pointsDiscount)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-between text-2xl lg:text-3xl font-black pt-4 border-t border-white/10 items-center">
                                <span className="tracking-tighter text-slate-900/30 uppercase text-[10px] font-black">Grand Total</span>
                                <span className="text-primary font-display drop-shadow-[0_0_15px_rgba(0,102,255,0.5)]">{formatCurrency(pos.totals.total)}</span>
                            </div>
                        </div>

                        {/* Adjustment Buttons Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <Dialog open={isVoucherOpen} onOpenChange={setIsVoucherOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className={cn("h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-slate-200 bg-slate-50 hover:bg-white/10 transition-all shadow-sm", pos.appliedVoucher && "bg-emerald-500/10 border-emerald-500/50 text-emerald-400")}>
                                        <Ticket className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Voucher</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-white/10 text-slate-900 max-w-[300px] rounded-[2rem]">
                                    <DialogHeader><DialogTitle>Gunakan Voucher</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <Input
                                            placeholder="KODE VOUCHER"
                                            className="h-12 text-center font-mono uppercase tracking-[0.2em] bg-slate-50 border-white/10"
                                            value={voucherCode}
                                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                        />
                                        <Button
                                            className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700"
                                            onClick={() => {
                                                pos.validateVoucher(voucherCode).then(() => setIsVoucherOpen(false));
                                            }}
                                        >Terapkan Voucher</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className={cn("h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-slate-200 bg-slate-50 hover:bg-white/10 transition-all shadow-sm", pos.discount > 0 && "bg-amber-500/10 border-amber-500/50 text-amber-400")}>
                                        <Tag className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Diskon</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 text-slate-900 border-white/10 max-w-xs rounded-[2.5rem] p-8">
                                    <DialogHeader><DialogTitle className="text-center text-xs uppercase font-black tracking-widest text-slate-400 mb-4">Diskon Faktur Manual</DialogTitle></DialogHeader>
                                    <div className="space-y-6">
                                        <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                                            <Button variant={pos.discountType === 'fixed' ? 'default' : 'ghost'} className="flex-1 rounded-xl h-10 text-xs font-black" onClick={() => pos.setDiscountType('fixed')}>RP</Button>
                                            <Button variant={pos.discountType === 'percentage' ? 'default' : 'ghost'} className="flex-1 rounded-xl h-10 text-xs font-black" onClick={() => pos.setDiscountType('percentage')}>%</Button>
                                        </div>
                                        <Input type="number" className="bg-slate-50 border-white/10 h-16 text-center text-3xl font-black rounded-2xl focus:ring-primary/20" value={pos.discount} onChange={(e) => pos.setDiscount(Number(e.target.value))} />
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className={cn("h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-slate-200 bg-slate-50 hover:bg-white/10 transition-all shadow-sm", pos.selectedCustomerId && "bg-blue-500/10 border-blue-500/50 text-blue-400")}>
                                        <User className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Pelanggan</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 text-slate-900 border-white/10 rounded-[3rem] p-8 shadow-3xl">
                                    <DialogHeader><DialogTitle className="text-center text-xl font-black uppercase tracking-tighter">Data Pelanggan (CRM)</DialogTitle></DialogHeader>
                                    <div className="space-y-6 pt-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-900/30 ml-2">Cari Pelanggan Terdaftar</label>
                                            <Select onValueChange={(v) => pos.setSelectedCustomerId(Number(v))} defaultValue={pos.selectedCustomerId?.toString()}>
                                                <SelectTrigger className="bg-slate-50 border-white/10 h-14 rounded-2xl px-6 text-base focus:ring-primary/20"><SelectValue placeholder="Pilih Pelanggan" /></SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10 text-slate-900 rounded-2xl">
                                                    {pos.customers?.map(c => <SelectItem key={c.id} value={c.id.toString()} className="h-12 rounded-xl focus:bg-primary">{c.name} ({c.phone})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="relative py-2">
                                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                                            <div className="relative flex justify-center"><span className="bg-slate-900 px-4 text-[10px] font-black uppercase text-slate-900/20 tracking-widest">ATAU TAMBAH BARU</span></div>
                                        </div>
                                        <div className="space-y-4">
                                            <Input placeholder="Nama Lengkap Pelanggan" className="bg-slate-50 border-white/10 h-14 rounded-2xl px-6" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                                            <Input placeholder="Nomor WhatsApp (Contoh: 0812...)" className="bg-slate-50 border-white/10 h-14 rounded-2xl px-6" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                                            <Button className="w-full h-16 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" onClick={() => { pos.createCustomer(newCustomer as any); setNewCustomer({ name: "", phone: "" }); setIsCustomerOpen(false); }} disabled={!newCustomer.name || pos.isCreatingCustomer}>
                                                {pos.isCreatingCustomer ? <Loader2 className="w-6 h-6 animate-spin" /> : "SIMPAN & PILIH"}
                                            </Button>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className={cn("h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-slate-200 bg-slate-50 hover:bg-white/10 transition-all shadow-sm", pos.pointsRedeemed > 0 && "bg-blue-500/10 border-blue-500/50 text-blue-400")}>
                                        <Coins className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Poin</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-slate-900 border-white/10 text-slate-900 max-w-sm rounded-[2.5rem] p-8">
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-xl font-black uppercase tracking-tight">Tukar Poin Loyalitas</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-6 space-y-6">
                                        {!pos.selectedCustomerId ? (
                                            <div className="text-center py-8 text-slate-400 space-y-3">
                                                <AlertCircle className="w-12 h-12 mx-auto opacity-20" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Pilih Pelanggan Dahulu</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-slate-50 p-6 rounded-[2rem] border border-blue-500/20 text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Saldo Poin Tersedia</p>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Coins className="w-6 h-6 text-primary" />
                                                        <span className="text-4xl font-black font-display text-primary">
                                                            {pos.customers?.find(c => c.id === pos.selectedCustomerId)?.points?.toLocaleString() || 0}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Jumlah Poin Ditukar</label>
                                                        <Input 
                                                            type="number"
                                                            className="h-14 bg-slate-50 border-white/10 text-center text-2xl font-black rounded-2xl"
                                                            value={pos.pointsRedeemed}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                const maxAvailable = pos.customers?.find(c => c.id === pos.selectedCustomerId)?.points || 0;
                                                                pos.setPointsRedeemed(Math.min(val, maxAvailable));
                                                            }}
                                                        />
                                                    </div>
                                                    <Button 
                                                        className="w-full h-14 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                                        onClick={() => {
                                                            const maxAvailable = pos.customers?.find(c => c.id === pos.selectedCustomerId)?.points || 0;
                                                            pos.setPointsRedeemed(maxAvailable);
                                                        }}
                                                    >
                                                        GUNAKAN SEMUA POIN
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Large Checkout Button */}
                        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full rounded-2xl h-14 lg:h-16 shadow-xl shadow-primary/30 bg-primary hover:bg-primary/90 text-lg lg:text-xl font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-between px-8" disabled={pos.cart.length === 0}>
                                    <span>BAYAR</span>
                                    <div className="bg-white/20 px-3 py-1 rounded-lg">
                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                    </div>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 text-slate-900 border-white/10 max-w-sm rounded-[3rem] p-8">
                                <DialogHeader><DialogTitle className="text-center text-2xl font-black uppercase tracking-tighter">Pembayaran</DialogTitle></DialogHeader>
                                <div className="grid grid-cols-1 gap-3 py-6">
                                    <PaymentMethodButton label="Tunai (Cash)" icon={Banknote} active={pos.paymentMethod === "cash"} onClick={() => pos.setPaymentMethod("cash")} />
                                    <PaymentMethodButton label="Transfer Bank" icon={CreditCard} active={pos.paymentMethod === "transfer"} onClick={() => pos.setPaymentMethod("transfer")} />
                                    <PaymentMethodButton label="QRIS / E-Wallet" icon={QrCode} active={pos.paymentMethod === "qris"} onClick={() => pos.setPaymentMethod("qris")} />
                                </div>
                                <div className="bg-slate-50 p-6 rounded-[2rem] mb-6 text-center border border-white/10 shadow-inner">
                                    <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-1">Total Tagihan</p>
                                    <p className="text-4xl font-display font-black text-primary">{formatCurrency(pos.totals.total)}</p>
                                </div>
                                <Button size="lg" className="w-full rounded-[1.5rem] h-16 font-black text-xl shadow-2xl shadow-primary/20" onClick={handleCheckout} disabled={pos.isProcessing}>
                                    {pos.isProcessing && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
                                    KONFIRMASI LUNAS
                                </Button>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <PettyCashDialog open={isPettyCashOpen} onOpenChange={setIsPettyCashOpen} onSave={pos.createPettyCash} />
            <PendingSalesDialog open={isPendingSalesOpen} onOpenChange={setIsPendingSalesOpen} sales={pos.pendingSales || []} onResume={pos.resumePendingSale} />
            <SalesHistoryDialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen} sales={pos.salesHistory || []} isLoading={pos.isLoadingHistory} formatCurrency={formatCurrency} />
            <ClosingSessionDialog open={isSessionOpen} onOpenChange={setIsSessionOpen} session={pos.activeSession} onClosing={pos.closeSession} onPrint={() => setIsSessionPrinterOpen(true)} />


            {pos.lastSale && (
                <ReceiptPrinter
                    sale={pos.lastSale}
                    onClose={() => pos.setLastSale(null)}
                />
            )}

            {isSessionPrinterOpen && (
                <SessionPrinter
                    session={pos.activeSession}
                    onClose={() => setIsSessionPrinterOpen(false)}
                />
            )}

            <PrinterSettingsDialog
                open={isPrinterSettingsOpen}
                onOpenChange={setIsPrinterSettingsOpen}
                paperSize={paperSize}
                setPaperSize={(size: any) => {
                    setPaperSize(size);
                    localStorage.setItem("pos_paper_size", size);
                }}
                onTestPrint={() => setIsPrinterTestOpen(true)}
            />

            <PrinterTest
                open={isPrinterTestOpen}
                onClose={() => setIsPrinterTestOpen(false)}
                paperSize={paperSize}
            />
        </POSLayout>
        </ErrorBoundary>
    );
}

function SalesHistoryDialog({ open, onOpenChange, sales, isLoading, formatCurrency }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 text-slate-900 border-white/10 rounded-[2rem] max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-slate-200">
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Riwayat Transaksi Terakhir
                    </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : !sales || sales.length === 0 ? (
                        <div className="text-center py-20 opacity-20 flex flex-col items-center">
                            <ShoppingBag className="w-16 h-16 mb-4" />
                            <p className="font-bold uppercase tracking-widest text-xs">Belum ada transaksi</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sales.map((sale: any) => (
                                <div key={sale.id} className="bg-slate-50 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all border-l-4 border-l-primary/30">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono font-bold text-slate-900/20 bg-slate-50 px-1.5 py-0.5 rounded">#{sale.id}</span>
                                            <span className="text-sm font-bold text-slate-900 tracking-tight">{formatCurrency(sale.totalAmount)}</span>
                                            <Badge variant="outline" className={cn("text-[9px] py-0 h-4 border-white/10 text-slate-400 uppercase font-black")}>
                                                {sale.paymentMethod}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-900/30 font-medium">
                                            <span>
                                                {(() => {
                                                    try {
                                                        if (!sale.createdAt) return "Waktu tidak diketahui";
                                                        return format(new Date(sale.createdAt), "dd MMM yyyy • HH:mm", { locale: id });
                                                    } catch (e) {
                                                        return "Error Tanggal";
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right hidden sm:block mr-2">
                                            <p className="text-[10px] text-slate-900/20 uppercase font-black tracking-tighter">Kasir</p>
                                            <p className="text-[11px] font-bold text-slate-500">{sale.salespersonName || "Staff"}</p>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl">
                                            <Printer className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter className="p-6 border-t border-slate-200 bg-slate-50">
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/10 rounded-xl h-11" onClick={() => onOpenChange(false)}>TUTUP</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PINOverlay({ onVerify, isLoading, deviceName, isAdmin, cashier, onBack }: { onVerify: (pin: string) => Promise<any>, isLoading: boolean, deviceName?: string, isAdmin: boolean, cashier?: any, onBack: () => void }) {
    const [pin, setPin] = useState("");

    const handleKeypad = (val: string) => {
        setPin(prev => {
            if (prev.length < 6) return prev + val;
            return prev;
        });
    };

    const handleClear = () => setPin("");

    useEffect(() => {
        if (pin.length === 6 && !isLoading) {
            onVerify(pin).catch(() => setPin(""));
        }
    }, [pin, onVerify, isLoading]);

    // Handle Physical Keyboard Input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isLoading) return;
            
            if (e.key >= "0" && e.key <= "9") {
                handleKeypad(e.key);
            } else if (e.key === "Backspace") {
                setPin(prev => prev.slice(0, -1));
            } else if (e.key === "Escape") {
                onBack();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isLoading, onBack]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 text-slate-900 flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,102,255,0.08),transparent)]" />

            <div className="w-full max-w-sm relative mt-[-5vh] animate-enter">
                <button 
                  onClick={onBack}
                  className="absolute -top-16 left-0 text-slate-900/30 hover:text-primary flex items-center gap-2 text-xs font-black tracking-widest transition-all group px-4 py-2 rounded-xl hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> GANTI KASIR
                </button>

                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden group">
                            {cashier?.profileImageUrl ? (
                                <img src={cashier.profileImageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-transparent">
                                    <User className="w-12 h-12 text-primary/60" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-6 h-6 rounded-full border-4 border-slate-950 shadow-lg" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tighter">{cashier?.firstName || cashier?.username || "Kasir"}</h1>
                    <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full mb-6">
                        <Monitor className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{deviceName}</span>
                    </div>
                    <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] animate-pulse">Masukkan PIN Keamanan</p>
                </div>

                <div className="flex justify-center gap-4 mb-12">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-4 h-4 rounded-full border-2 transition-all duration-300",
                                pin.length > i
                                    ? "bg-primary border-primary scale-125 shadow-[0_0_20px_rgba(0,102,255,0.6)]"
                                    : "bg-transparent border-white/10"
                            )}
                        />
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <Button
                            key={num}
                            variant="ghost"
                            className="h-20 rounded-3xl text-3xl font-bold bg-slate-50 hover:bg-white/10 border border-slate-200 active:scale-95 transition-all"
                            onClick={() => handleKeypad(num.toString())}
                            disabled={isLoading}
                        >
                            {num}
                        </Button>
                    ))}
                    <Button
                        variant="ghost"
                        className="h-20 rounded-3xl text-[10px] font-black tracking-widest bg-slate-50 hover:bg-white/10 border border-slate-200 text-slate-400 hover:text-primary"
                        onClick={handleClear}
                        disabled={isLoading}
                    >
                        CLEAR
                    </Button>
                    <Button
                        variant="ghost"
                        className="h-20 rounded-3xl text-3xl font-bold bg-slate-50 hover:bg-white/10 border border-slate-200 active:scale-95 transition-all"
                        onClick={() => handleKeypad("0")}
                        disabled={isLoading}
                    >
                        0
                    </Button>
                    <div className="flex items-center justify-center">
                        {isLoading && <Loader2 className="w-8 h-8 animate-spin text-primary" />}
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-slate-900/20 text-[10px] font-medium tracking-wide uppercase">
                        Sistem POS Terenkripsi • Kazana AI
                    </p>
                </div>
            </div>
        </div>
    );
}

function CashierSelectionOverlay({ cashiers, isLoading, onSelect, deviceName }: { cashiers?: any[], isLoading: boolean, onSelect: (c: any) => void, deviceName: string }) {
    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 text-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,102,255,0.1),transparent)]" />
            
            <div className="w-full max-w-3xl relative animate-enter">
                <div className="text-center mb-16">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-primary/20 shadow-2xl">
                        <UserPlus className="w-10 h-10 text-primary" />
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">Silakan Pilih Profil</h1>
                    <div className="flex items-center justify-center gap-2">
                        <Monitor className="w-4 h-4 text-slate-900/20" />
                        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Terminal Aktif: {deviceName}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Mengambil data kasir...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8">
                        {cashiers?.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => onSelect(c)}
                                className="group relative flex flex-col items-center p-8 bg-slate-50 border border-slate-200 rounded-[3rem] hover:bg-primary/10 hover:border-primary/50 transition-all active:scale-95 shadow-lg hover:shadow-primary/10"
                            >
                                <div className="w-24 h-24 rounded-[2rem] bg-slate-50 mb-6 flex items-center justify-center overflow-hidden border border-white/10 group-hover:border-primary/30 transition-all shadow-inner">
                                    {c.profileImageUrl ? (
                                        <img src={c.profileImageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
                                            <span className="text-3xl font-black text-slate-900/20 group-hover:text-primary transition-colors">
                                                {(c.firstName || c.username || "?").charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors mb-1">{c.firstName || c.username}</h3>
                                <Badge variant="outline" className="text-[9px] h-5 px-3 border-white/10 text-slate-900/30 uppercase font-black tracking-widest group-hover:border-primary/30 group-hover:text-primary/60">
                                    {c.role === 'admin' ? 'Admin' : 'Cashier'}
                                </Badge>
                                
                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                                        <Lock className="w-4 h-4 text-slate-900" />
                                    </div>
                                </div>
                            </button>
                        ))}
                        {(!cashiers || cashiers.length === 0) && (
                            <div className="col-span-full py-24 text-center text-slate-900/10 font-black uppercase tracking-widest border-2 border-dashed border-slate-200 rounded-[4rem]">
                                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                Tidak ada kasir yang ditugaskan ke terminal ini.
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-16 text-center">
                    <Link href="/">
                        <Button variant="ghost" className="text-slate-900/20 hover:text-primary hover:bg-slate-50 rounded-2xl px-8 h-12 gap-3 transition-all">
                            <ArrowLeft className="w-4 h-4" /> 
                            <span className="text-xs font-bold uppercase tracking-widest">Dashboard Utama</span>
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

function DeviceRegistrationOverlay({ onRegister, isLoading }: { onRegister: (data: { name: string, registrationCode: string }) => Promise<any>, isLoading: boolean }) {
    const [name, setName] = useState("");
    const [registrationCode, setRegistrationCode] = useState("");
    const { toast } = useToast();

    const handleRegister = async () => {
        if (!name || registrationCode.length !== 6) {
            toast({ title: "Validasi Gagal", description: "Nama terminal dan Kode Registrasi 6-digit harus diisi.", variant: "destructive" });
            return;
        }
        try {
            await onRegister({ name, registrationCode });
        } catch (err: any) {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 text-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,102,255,0.15),transparent)] opacity-50" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-[0.2] pointer-events-none" />

            <div className="w-full max-w-md relative">
                <Card className="bg-black/60 border-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <CardContent className="p-8 md:p-12">
                        <div className="flex flex-col items-center mb-10 text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
                                <Package className="w-10 h-10 text-primary" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Daftarkan Terminal</h1>
                            <p className="text-slate-400 text-sm max-w-[280px]">Minta Kode Registrasi dari Admin untuk mengaktifkan terminal ini.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Nama Terminal</label>
                                <Input
                                    className="bg-slate-50 border-white/10 h-14 px-6 rounded-2xl text-lg focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                                    placeholder="Contoh: Kasir Depan"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Kode Registrasi (6 Digit)</label>
                                <Input
                                    maxLength={6}
                                    className="bg-slate-50 border-white/10 h-14 px-6 rounded-2xl text-lg focus:ring-primary/20 focus:border-primary/50 transition-all font-medium tracking-[0.5em] text-center"
                                    placeholder="000000"
                                    value={registrationCode}
                                    onChange={(e) => setRegistrationCode(e.target.value.replace(/\D/g, ""))}
                                />
                            </div>

                            <Button
                                className="w-full h-16 rounded-2xl text-lg font-black bg-primary hover:bg-primary/90 text-slate-900 shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 mt-4 group"
                                onClick={handleRegister}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        DAFTARKAN SEKARANG
                                        <Plus className="w-5 h-5 ml-2 group-hover:rotate-90 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <div className="pt-4 text-center">
                                <Link href="/">
                                    <button className="text-slate-900/20 hover:text-primary text-xs font-bold transition-colors uppercase tracking-widest">
                                        Batalkan & Kembali
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


function ProductCard({ product, onAdd, formatCurrency }: { product: any, onAdd: () => void, formatCurrency: any }) {
    const price = Number(product.sellingPrice) || 0;

    // Generate a consistent gradient color based on product name
    const getGradient = (name: string) => {
        const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
        const hue = Math.abs(hash) % 360;
        return `linear-gradient(135deg, hsl(${hue}, 70%, 20%) 0%, hsl(${(hue + 40) % 360}, 70%, 10%) 100%)`;
    };

    return (
        <Card
            className="bg-slate-50 border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all cursor-pointer group rounded-[2rem] overflow-hidden shadow-2xl select-none active:scale-95 flex flex-col h-full min-h-[220px]"
            onClick={onAdd}
        >
            <CardContent className="p-0 flex flex-col h-full">
                <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden shrink-0 border-b border-slate-200">
                    {product.photoUrl ? (
                        <img src={product.photoUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={product.name} />
                    ) : (
                        <div 
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: getGradient(product.name || "Product") }}
                        >
                            <Package className="w-10 h-10 lg:w-12 lg:h-12 text-slate-900/20 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                        <Badge className="bg-white backdrop-blur-xl border-white/10 text-[9px] font-black tracking-widest py-0.5 px-2 h-5 uppercase">{product.sku}</Badge>
                        <Badge className={cn("backdrop-blur-xl text-[8px] font-black tracking-widest py-0.5 px-2 h-5 uppercase", Number(product.currentStock) > 5 ? "bg-emerald-500/40 border-emerald-500/20" : "bg-red-500/40 border-red-500/20")}>
                            {Number(product.currentStock) > 0 ? `${product.currentStock} UNIT` : "KOSONG"}
                        </Badge>
                    </div>
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between bg-gradient-to-b from-white/[0.02] to-transparent">
                    <h3 className="font-bold text-slate-900/90 text-[13px] lg:text-sm leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors tracking-tight">{product.name}</h3>
                    <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-900/30 font-black uppercase tracking-tighter">Harga Unit</span>
                            <span className="text-primary font-display font-black text-sm lg:text-xl drop-shadow-[0_0_10px_rgba(0,102,255,0.3)]">{formatCurrency(price)}</span>
                        </div>
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:rotate-90 transition-all shadow-lg group-hover:shadow-primary/40 border border-primary/20">
                            <Plus className="w-5 h-5 lg:w-6 lg:h-6 text-primary group-hover:text-primary" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function CartItemCard({ item, onUpdate, onRemove, formatCurrency, onDiscount }: { item: any, onUpdate: any, onRemove: any, formatCurrency: any, onDiscount: any }) {
    return (
        <div className="bg-slate-50 border border-white/10 rounded-2xl p-4 flex gap-4 group animate-in slide-in-from-right-2 hover:bg-white/10 transition-all hover:translate-x-1 border-l-4 border-l-transparent hover:border-l-primary/50 relative overflow-hidden shadow-xl">
            <div className="w-16 h-20 rounded-xl bg-slate-50 shrink-0 overflow-hidden border border-white/10 relative group-hover:border-primary/20 transition-all shadow-inner">
                {item.photoUrl ? (
                    <img src={item.photoUrl} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20"><Package className="w-6 h-6" /></div>
                )}
                {item.appliedPromoId && (
                    <div className="absolute top-0 left-0 bg-primary/90 text-[8px] font-black px-1.5 py-0.5 rounded-br-lg text-slate-900 shadow-lg tracking-widest uppercase">PROMO</div>
                )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div className="flex justify-between items-start gap-1">
                    <div className="min-w-0">
                        <p className="font-bold text-sm lg:text-[15px] leading-tight text-slate-900/90 truncate pr-4">{item.name}</p>
                        <p className="text-[10px] font-mono text-slate-900/30 tracking-tight">{item.sku}</p>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="w-8 h-8 flex items-center justify-center text-slate-900/10 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all absolute top-2 right-2">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex items-center justify-between gap-4 mt-2">
                    <div className="flex flex-col">
                        <p className="text-sm lg:text-lg text-primary font-black drop-shadow-[0_0_8px_rgba(0,102,255,0.3)]">{formatCurrency(Number(item.sellingPrice))}</p>
                        {item.itemDiscount > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-red-400 font-black italic">-{formatCurrency(item.itemDiscount)}</span>
                                <span className="w-1 h-1 bg-red-400 rounded-full opacity-30" />
                                <span className="text-[10px] text-slate-900/20 line-through">{formatCurrency(Number(item.sellingPrice) + item.itemDiscount)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-inner">
                        <Dialog>
                            <DialogTrigger asChild>
                                <button className={cn("w-8 h-8 flex items-center justify-center rounded-xl transition-all shadow-sm", item.itemDiscount > 0 ? "bg-primary/20 text-primary border border-primary/20" : "bg-slate-50 text-slate-900/20 hover:text-primary border border-transparent")}>
                                    <Tag className="w-3.5 h-3.5" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-white/10 text-slate-900 max-w-[280px] rounded-[2.5rem] p-6">
                                <DialogHeader><DialogTitle className="text-xs uppercase font-black tracking-widest text-slate-400 mb-4 text-center">Diskon Produk</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                    <Input
                                        type="number"
                                        defaultValue={item.itemDiscount}
                                        className="bg-slate-50 border-white/10 text-center text-2xl font-black h-16 rounded-2xl"
                                        placeholder="Rp Amount"
                                        onBlur={(e) => onDiscount(item.id, Number(e.target.value), 'fixed')}
                                    />
                                    <div className="grid grid-cols-4 gap-2">
                                        {[5, 10, 20, 50].map(pct => (
                                            <Button key={pct} variant="ghost" size="sm" className="h-10 text-xs font-black bg-slate-50 hover:bg-primary hover:text-primary transition-all rounded-xl" onClick={() => onDiscount(item.id, pct, 'percentage')}>{pct}%</Button>
                                        ))}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        
                        <div className="flex items-center gap-2 px-1">
                            <button onClick={() => onUpdate(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-primary"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="w-6 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                            <button onClick={() => onUpdate(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-primary/20 hover:bg-primary/40 rounded-xl transition-all text-primary"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PaymentMethodButton({ label, icon: Icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
                active
                    ? "bg-primary border-primary text-slate-900 shadow-lg shadow-primary/20 scale-[1.02]"
                    : "bg-slate-50 border-slate-200 text-slate-400 hover:border-white/10"
            )}
        >
            <div className={cn("p-2 rounded-xl", active ? "bg-white/20" : "bg-slate-50")}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm tracking-wide">{label}</span>
            {active && <CheckCircle2 className="w-5 h-5 ml-auto text-slate-900 shadow-sm" />}
        </button>
    );
}

function SessionOpeningOverlay({ onStart, isLoading, deviceName, onLogout }: { onStart: (bal: number, notes?: string) => void, isLoading: boolean, deviceName?: string, onLogout: () => void }) {
    const [balance, setBalance] = useState("");
    const [notes, setNotes] = useState("");

    return (
        <div className="fixed inset-0 z-[100] bg-slate-50 text-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent)] opacity-50" />
            
            <div className="w-full max-w-sm relative animate-enter">
                <Card className="bg-black/60 border-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-emerald-500/10">
                    <CardContent className="p-10 space-y-8">
                        <div className="text-center relative">
                            <button 
                                onClick={onLogout}
                                className="absolute -top-4 -right-4 text-slate-900/20 hover:text-primary flex items-center gap-1 text-[10px] font-black tracking-widest transition-all p-2"
                                title="Ganti Kasir / Logout"
                            >
                                <Lock className="w-3 h-3" /> GANTI
                            </button>
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-inner">
                                <Store className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Buka Shift Kasir</h2>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <Monitor className="w-3 h-3 text-emerald-500/40" />
                                <p className="text-emerald-500/60 text-[10px] font-black uppercase tracking-[0.2em]">{deviceName}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-widest text-emerald-500/60 uppercase ml-1">Modal Awal Tunai (Cash)</label>
                                <div className="relative">
                                    <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-900/20" />
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="h-16 bg-slate-50 border-white/10 pl-12 text-2xl font-black rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all"
                                        value={balance}
                                        onChange={e => setBalance(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-widest text-slate-900/20 uppercase ml-1">Catatan Tambahan</label>
                                <Input
                                    placeholder="Shift Pagi / Serah Terima..."
                                    className="h-12 bg-slate-50 border-white/10 rounded-2xl text-sm"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full h-16 rounded-2xl font-black text-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                            onClick={() => onStart(Number(balance), notes)}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "AKTIFKAN KASIR"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function PettyCashDialog({ open, onOpenChange, onSave }: any) {
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"in" | "out">("out");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 text-slate-900 border-white/10 rounded-[2rem] max-w-xs">
                <DialogHeader><DialogTitle>Pencatatan Kas Kecil</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-1 p-1 bg-slate-50 rounded-xl">
                        <Button variant={type === "in" ? "default" : "ghost"} className="flex-1 rounded-lg" onClick={() => setType("in")}>MASUK</Button>
                        <Button variant={type === "out" ? "default" : "ghost"} className="flex-1 rounded-lg" onClick={() => setType("out")}>KELUAR</Button>
                    </div>
                    <Input type="number" placeholder="Nominal" className="bg-slate-50 border-white/10 h-12" value={amount} onChange={e => setAmount(e.target.value)} />
                    <Input placeholder="Keterangan / Alasan" className="bg-slate-50 border-white/10 h-12" value={description} onChange={e => setDescription(e.target.value)} />
                    <Button className="w-full h-12 rounded-xl font-bold" onClick={() => {
                        onSave({ amount: Number(amount), description, type });
                        setAmount(""); setDescription(""); onOpenChange(false);
                    }}>Simpan Transaksi</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PinLockScreen({ onVerify, isVerifying, cashiers }: { onVerify: any, isVerifying: boolean, cashiers: any[] }) {
    const [pin, setPin] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    const handleKeyClick = (num: string) => {
        if (pin.length < 6) setPin(prev => prev + num);
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    useEffect(() => {
        if (pin.length === 6 && selectedUserId) {
            onVerify(pin, selectedUserId).catch(() => setPin(""));
        }
    }, [pin, selectedUserId, onVerify]);

    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent)] pointer-events-none" />
            
            <Card className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-[3.5rem] border-white/10 bg-slate-800/50 backdrop-blur-xl shadow-3xl overflow-hidden min-h-[600px]">
                {/* Left Side: Welcome */}
                <div className="p-12 flex flex-col justify-between bg-gradient-to-br from-primary/20 to-transparent border-r border-white/5">
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-12">
                            <Store className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-5xl font-display font-black text-white leading-tight tracking-tighter">
                            KAZANA<br /><span className="text-primary italic">TERMINAL</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-xs font-medium">Silakan pilih profil kasir dan masukkan PIN untuk memulai shift.</p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Staf Kasir Aktif</p>
                        <div className="grid grid-cols-2 gap-3">
                            {cashiers.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => { setSelectedUserId(c.id); setPin(""); }}
                                    className={cn(
                                        "p-4 rounded-2xl border transition-all text-left group",
                                        selectedUserId === c.id 
                                            ? "bg-primary border-primary text-slate-900 shadow-lg shadow-primary/20" 
                                            : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                                    )}
                                >
                                    <p className="font-bold text-sm truncate">{c.firstName || c.username}</p>
                                    <p className={cn("text-[8px] font-black uppercase tracking-widest mt-0.5", selectedUserId === c.id ? "text-slate-900/60" : "text-slate-500 group-hover:text-slate-400")}>Cashier</p>
                                </button>
                            ))}
                            {cashiers.length === 0 && (
                                <div className="col-span-2 p-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center">
                                    <p className="text-xs text-slate-500">Tidak ada kasir terdaftar di grup perangkat ini.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Dialpad */}
                <div className="p-12 flex flex-col items-center justify-center bg-slate-900/50">
                    <div className="w-full max-w-[320px] space-y-12">
                        {/* PIN Visualizer */}
                        <div className="flex justify-center gap-4">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "w-4 h-4 rounded-full border-2 transition-all duration-300",
                                        pin.length > i 
                                            ? "bg-primary border-primary scale-110 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
                                            : "border-white/20"
                                    )}
                                />
                            ))}
                        </div>

                        {/* Dialpad Numbers */}
                        <div className="grid grid-cols-3 gap-6">
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(n => (
                                <Button 
                                    key={n}
                                    variant="ghost" 
                                    className="w-20 h-20 rounded-3xl text-3xl font-bold bg-white/5 hover:bg-white/15 text-white border-transparent transition-all active:scale-90"
                                    onClick={() => handleKeyClick(n)}
                                    disabled={isVerifying || !selectedUserId}
                                >
                                    {n}
                                </Button>
                            ))}
                            <div />
                            <Button 
                                variant="ghost" 
                                className="w-20 h-20 rounded-3xl text-3xl font-bold bg-white/5 hover:bg-white/15 text-white border-transparent transition-all active:scale-90"
                                onClick={() => handleKeyClick("0")}
                                disabled={isVerifying || !selectedUserId}
                            >
                                0
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="w-20 h-20 rounded-3xl text-white bg-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all active:scale-90"
                                onClick={handleBackspace}
                                disabled={isVerifying}
                            >
                                <Trash2 className="w-8 h-8" />
                            </Button>
                        </div>

                        <div className="text-center pt-8">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Lupa PIN? Hubungi Admin Cabang</p>
                        </div>
                    </div>
                </div>
            </Card>

            {isVerifying && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" strokeWidth={3} />
                        <p className="text-primary font-black uppercase tracking-[0.3em] text-xs">Memverifikasi Identitas...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function RegisterDeviceDialog({ onRegister, isRegistering }: { onRegister: any, isRegistering: boolean }) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-slate-900 font-bold text-lg">Daftarkan Perangkat Ini</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 text-slate-900 border-white/10 rounded-[2.5rem] p-8 max-w-md">
                <DialogHeader><DialogTitle className="text-center font-black uppercase tracking-tighter text-xl">Registrasi Terminal</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <Input placeholder="Nama Terminal (misal: Kasir Utama)" className="h-14 bg-slate-50 border-white/10 rounded-2xl" value={name} onChange={e => setName(e.target.value)} />
                    <Input placeholder="Kode Registrasi (6 Digit)" className="h-14 bg-slate-50 border-white/10 rounded-2xl font-mono text-center text-2xl tracking-widest" maxLength={6} value={code} onChange={e => setCode(e.target.value)} />
                    <Button className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 font-bold" onClick={() => onRegister({ name, registrationCode: code })} disabled={isRegistering || !name || !code}>
                        {isRegistering ? <Loader2 className="w-6 h-6 animate-spin" /> : "AKTIFKAN SEKARANG"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PendingSalesDialog({ open, onOpenChange, sales, onResume }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 text-slate-900 border-white/10 rounded-[2.5rem] max-w-md">
                <DialogHeader><DialogTitle>Antrean Pesanan (Hold)</DialogTitle></DialogHeader>
                <div className="space-y-3 py-6 max-h-[400px] overflow-y-auto pr-2">
                    {sales.map((s: any) => (
                        <div key={s.id} className="bg-slate-50 border border-white/10 p-4 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-colors">
                            <div>
                                <p className="font-bold text-sm">{s.customerName || "Tanpa Nama"}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                                    {(() => {
                                        try {
                                            const d = new Date(s.createdAt);
                                            const timeStr = isNaN(d.getTime()) ? "--:--" : format(d, "HH:mm", { locale: id });
                                            let itemCount = 0;
                                            try {
                                                itemCount = s.cartData ? JSON.parse(s.cartData).length : 0;
                                            } catch (e) {
                                                console.error("Failed to parse cartData", e);
                                            }
                                            return `${timeStr} • ${itemCount} Barang`;
                                        } catch (e) {
                                            return "Data Error";
                                        }
                                    })()}
                                </p>
                            </div>
                            <Button size="sm" className="rounded-xl h-9 px-4 font-bold" onClick={() => { onResume(s); onOpenChange(false); }}>
                                Lanjut
                            </Button>
                        </div>
                    ))}
                    {sales.length === 0 && <p className="text-center text-slate-900/20 py-10 font-medium">Tidak ada pesanan tertunda.</p>}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ClosingSessionDialog({ open, onOpenChange, session, onClosing, onPrint }: any) {
    const [actual, setActual] = useState("");
    const [notes, setNotes] = useState("");

    if (!session) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 text-slate-900 border-white/10 rounded-[2.5rem] max-w-md">
                <DialogHeader className="flex flex-row items-center justify-between pr-8">
                    <DialogTitle className="text-xl font-bold">Closing Kasir (Z-Report)</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-6">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-4">
                        <p className="text-sm font-bold text-amber-900 mb-1 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Sistem Blind Close Aktif
                        </p>
                        <p className="text-xs text-amber-700">Harap hitung dan masukkan jumlah fisik uang tunai di laci Anda secara teliti. Selisih kas (surplus/minus) akan dicatat otomatis ke dalam jurnal audit.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 ml-1">Uang Tunai di Laci (Fisik)</label>
                            <Input
                                type="number"
                                placeholder="Masukkan jumlah uang fisik..."
                                className="h-14 bg-slate-50 border-white/10 text-xl font-bold rounded-2xl"
                                value={actual}
                                onChange={e => setActual(e.target.value)}
                            />
                        </div>
                        <Input
                            placeholder="Catatan Penutupan..."
                            className="h-12 bg-slate-50 border-white/10 rounded-2xl"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-16 rounded-2xl font-bold border-white/10 hover:bg-white/10"
                            onClick={onPrint}
                        >
                            <Printer className="w-5 h-5 mr-2" />
                            CETAK LAPORAN
                        </Button>
                        <Button
                            className="h-16 rounded-2xl font-bold text-lg bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/20"
                            onClick={() => onClosing(session.id, Number(session.openingBalance) + Number(session.totalCashSales || 0) + Number(session.pettyCashTotal || 0), Number(actual), notes)}
                        >
                            TUTUP & LOGOUT
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
function PrinterSettingsDialog({ open, onOpenChange, paperSize, setPaperSize, onTestPrint }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 text-slate-900 border-white/10 rounded-[2.5rem] max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                            <Printer className="w-5 h-5 text-primary" />
                        </div>
                        Setup Printer Thermal
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-6">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-400 ml-1">Ukuran Kertas</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaperSize("58mm")}
                                className={cn(
                                    "h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                                    paperSize === "58mm" ? "bg-primary/20 border-primary text-primary" : "bg-slate-50 border-transparent text-slate-400 hover:bg-white/10"
                                )}
                            >
                                <span className="font-bold">58mm</span>
                                <span className="text-[10px] opacity-60">Narrow Roll</span>
                            </button>
                            <button
                                onClick={() => setPaperSize("80mm")}
                                className={cn(
                                    "h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                                    paperSize === "80mm" ? "bg-primary/20 border-primary text-primary" : "bg-slate-50 border-transparent text-slate-400 hover:bg-white/10"
                                )}
                            >
                                <span className="font-bold">80mm</span>
                                <span className="text-[10px] opacity-60">Standard Roll</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-2">
                        <p className="text-[11px] text-blue-400 font-medium leading-relaxed">
                            Pastikan printer sudah terhubung ke Windows/Tablet. Gunakan tombol di bawah untuk mencoba cetakan struk pertama Anda.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={onTestPrint}
                            className="h-14 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-900 font-bold"
                        >
                            <Printer className="w-5 h-5 mr-3" />
                            KENALAN (TEST PRINT)
                        </Button>
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="h-14 rounded-2xl bg-primary hover:bg-primary/90 text-slate-900 font-bold shadow-lg shadow-primary/20"
                        >
                            SIMPAN PENGATURAN
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
