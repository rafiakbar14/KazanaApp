import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useProducts } from "@/hooks/use-products";
import { usePOS } from "@/hooks/use-pos";
import POSLayout from "./POSLayout";
import { Search, Plus, Minus, Trash2, ShoppingCart, User, CreditCard, Banknote, QrCode, Package, ArrowLeft, Lock, X, CheckCircle2, ShoppingBag, UserPlus, Loader2, Tag, Settings2, Clock, Ticket, Store, History, Timer, AlertCircle, Printer, Monitor, Calendar, Coins } from "lucide-react";
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
    const { data: allProducts, isLoading: isLoadingProducts } = useProducts();
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
    const [isClosingDialogOpen, setIsClosingDialogOpen] = useState(false);
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

    // Keyboard Shortcuts & Universal Barcode Scanner Integration
    const barcodeBuffer = useRef("");
    const typingTimer = useRef<NodeJS.Timeout | null>(null);

    const formatCurrency = useCallback((val: any) => {
        try {
            const num = Number(val);
            if (isNaN(num)) return "Rp 0";
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
        } catch (e) {
            return "Rp " + (val || 0);
        }
    }, []);

    const handleCheckout = useCallback(() => {
        pos.checkout();
        setIsCheckoutOpen(false);
    }, [pos]);

    useEffect(() => {
        
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
                barcodeBuffer.current += e.key;
                if (typingTimer.current) clearTimeout(typingTimer.current);
                typingTimer.current = setTimeout(() => { barcodeBuffer.current = ""; }, 50); 
            } else if (e.key === "Enter" && barcodeBuffer.current.length >= 3) {
                // If it ends with Enter and was typed extremely fast, it's a barcode
                if (!isTypingInInput) {
                    e.preventDefault();
                    const scannedSku = barcodeBuffer.current;
                    barcodeBuffer.current = "";
                    
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
            if (typingTimer.current) clearTimeout(typingTimer.current);
        };
    }, [isCheckoutOpen, isPrinterSettingsOpen, allProducts, pos.cart]);

    // --- ALL HOOKS MUST BE ABOVE THIS LINE ---

    if (isLoadingDevice || isLoadingRole || isLoadingProducts || isLoadingCashiers) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" strokeWidth={3} />
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Menyiapkan Sistem POS...</p>
                </div>
            </div>
        );
    }

    if (!currentDevice) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
                <Card className="max-w-md w-full rounded-[2.5rem] border-slate-200 bg-white shadow-2xl p-8 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none" />
                    <div className="text-center space-y-6 relative">
                        <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto border border-blue-600/20 shadow-inner">
                            <Monitor className="w-10 h-10 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Perangkat Belum Terdaftar</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">Perangkat ini belum terdaftar di sistem pusat. Silakan minta Kode Registrasi kepada Admin untuk mengaktifkan terminal kasir ini.</p>
                        
                        <div className="pt-4 flex flex-col gap-3">
                            <RegisterDeviceDialog onRegister={registerDevice} isRegistering={isRegistering} />
                            <Link href="/">
                                <Button variant="ghost" className="w-full h-14 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                                    Kembali ke Dashboard
                                </Button>
                            </Link>
                        </div>
                        <p className="text-[10px] font-mono text-slate-600 tracking-tighter pt-4">DEVICE ID: {pos.deviceId}</p>
                    </div>
                </Card>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <PinLockScreen 
                onVerify={verifyPin} 
                isVerifying={isVerifying} 
                cashiers={cashiers || []} 
                deviceName={currentDevice.name}
            />
        );
    }

    if (!pos.activeSession) {
        return (
            <ErrorBoundary>
                <SessionOpeningOverlay 
                    onStart={(bal, notes) => {
                        setIsClosingDialogOpen(false);
                        pos.startSession(bal, notes);
                    }} 
                    isLoading={pos.isLoadingSession} 
                    deviceName={currentDevice.name} 
                    onLogout={logout} 
                />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <POSLayout>
            <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-slate-50 text-slate-900">
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.05)] border-t border-slate-200 h-16 safe-bottom">
                    <button
                        className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all", activeMobileTab === "catalog" ? "text-blue-600 bg-blue-50/50" : "text-slate-500")}
                        onClick={() => setActiveMobileTab("catalog")}
                    >
                        <ShoppingBag className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Katalog</span>
                    </button>
                    <button
                        className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all relative", activeMobileTab === "cart" ? "text-blue-600 bg-blue-50/50" : "text-slate-500")}
                        onClick={() => setActiveMobileTab("cart")}
                    >
                        <ShoppingCart className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Keranjang</span>
                        {pos.cart.length > 0 && (
                            <span className="absolute top-2 right-1/4 w-4 h-4 bg-blue-600 text-white flex items-center justify-center text-[10px] font-black rounded-full ring-2 ring-white">
                                {pos.cart.length}
                            </span>
                        )}
                    </button>
                    <button
                        className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all", activeMobileTab === "history" ? "text-blue-600 bg-blue-50/50" : "text-slate-500")}
                        onClick={() => {
                            setActiveMobileTab("history");
                            setIsHistoryOpen(true);
                        }}
                    >
                        <History className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Riwayat</span>
                    </button>
                    <button
                        className={cn("flex-1 flex flex-col items-center justify-center gap-1 transition-all", isPrinterSettingsOpen ? "text-blue-600 bg-blue-50/50" : "text-slate-500")}
                        onClick={() => setIsPrinterSettingsOpen(true)}
                    >
                        <Settings2 className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Setup</span>
                    </button>
                </div>

                {/* Left Panel: Categories (Desktop/Tablet) */}
                <aside className="hidden lg:flex w-20 xl:w-24 border-r border-slate-200 flex-col items-center py-6 gap-4 bg-white shrink-0">
                    <div className="mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100">
                            <Store className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    
                    <button
                        onClick={() => pos.setSelectedCategory("Semua")}
                        className={cn(
                            "w-14 h-14 xl:w-16 xl:h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2",
                            pos.selectedCategory === "Semua" ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-white border-transparent text-slate-500 hover:bg-blue-50 hover:text-blue-600"
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
                                    pos.selectedCategory === cat ? "bg-blue-100 border-blue-600 text-blue-700 shadow-md shadow-blue-500/10" : "bg-white border-transparent text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                )}
                            >
                                <Tag className="w-4 h-4" />
                                <span className="text-[8px] xl:text-[9px] font-black uppercase leading-[1.1] line-clamp-2">{cat}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-4 w-full flex flex-col items-center gap-4 border-t border-slate-100">
                        <button
                            onClick={() => setIsClosingDialogOpen(true)}
                            className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all bg-blue-50 border-2 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white group"
                            title="Z-Report / Closing"
                        >
                            <Settings2 className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                            <span className="text-[8px] font-black uppercase">CLOSING</span>
                        </button>
                        
                        <button
                            onClick={() => setIsPrinterSettingsOpen(true)}
                            className="w-14 h-14 xl:w-16 xl:h-16 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all bg-white border-2 border-transparent text-slate-300 hover:bg-blue-50 hover:text-blue-600"
                            title="Printer Setup"
                        >
                            <Printer className="w-5 h-5" />
                            <span className="text-[8px] font-black uppercase">SETUP</span>
                        </button>
                    </div>
                </aside>

                {/* Center Panel: Product Grid */}
                <div className={cn("flex-1 flex flex-col overflow-hidden bg-slate-50", activeMobileTab === "cart" && "hidden lg:flex")}>
                    {/* Header: Search & Mobile Category Bar */}
                    <div className="p-4 lg:p-6 space-y-4">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-blue-600/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition duration-500" />
                            <div className="relative flex items-center">
                                <Search className="absolute left-4 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    className="bg-white border-slate-200 h-12 lg:h-14 pl-12 rounded-2xl text-base lg:text-lg focus:ring-blue-100 focus:border-blue-600/50 transition-all shadow-sm"
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
                                className={cn("h-10 rounded-xl px-6 whitespace-nowrap text-xs font-bold transition-all", pos.selectedCategory === "Semua" ? "bg-blue-600 text-white" : "bg-white border-slate-200 text-slate-600")}
                                onClick={() => pos.setSelectedCategory("Semua")}
                            >Semua</Button>
                            {pos.categories?.filter(Boolean).map(cat => (
                                <Button
                                    key={cat}
                                    variant={pos.selectedCategory === cat ? "default" : "outline"}
                                    className={cn("h-10 rounded-xl px-6 whitespace-nowrap text-xs font-bold transition-all", pos.selectedCategory === cat ? "bg-blue-600 text-white" : "bg-white border-slate-200 text-slate-600")}
                                    onClick={() => pos.setSelectedCategory(cat)}
                                >{cat}</Button>
                            ))}
                        </div>
                    </div>

                    {/* Grid Area */}
                    <div className="flex-1 overflow-y-auto px-4 lg:px-6 pb-24 lg:pb-6 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {isLoadingProducts ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
                <div className={cn("w-full lg:w-[350px] xl:w-[400px] border-l border-slate-200 bg-white flex flex-col overflow-hidden", activeMobileTab === "catalog" && "hidden lg:flex")}>
                    {/* Cart Header */}
                    <div className="p-4 lg:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                        <div className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Keranjang</h2>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-blue-600" onClick={() => setIsHistoryOpen(true)} title="Riwayat Penjualan">
                                <History className="w-4 h-4 mr-1.5" />
                                <span className="text-[10px] font-black hidden xl:inline">RIWAYAT</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500 hover:text-blue-600" onClick={() => setIsPendingSalesOpen(true)} title="Pesanan Tertunda">
                                <Timer className="w-4 h-4 mr-1.5" />
                                <span className="text-[10px] font-black hidden xl:inline">TUNDA</span>
                            </Button>
                            <div className="ml-1">
                                <Badge className="rounded-full px-2.5 h-6 text-[10px] font-black bg-blue-600 text-white border-none shadow-md shadow-blue-500/20">
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
                                    formatCurrency={formatCurrency}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer Summary Container */}
                    <div className="p-4 lg:p-6 bg-slate-50 border-t border-slate-100 space-y-5 shrink-0 shadow-[0_-15px_30px_rgba(0,0,0,0.02)]">
                        <div className="space-y-2 text-[13px]">
                            <div className="flex justify-between text-slate-500">
                                <span className="font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                                <span className="font-mono font-medium">{formatCurrency(pos.totals.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                                <span className="font-bold uppercase tracking-widest text-[10px]">PPN (11%)</span>
                                <span className="font-mono font-medium">{formatCurrency(pos.totals.tax)}</span>
                            </div>
                            {(pos.totals.itemsDiscount > 0 || pos.totals.billDiscount > 0 || pos.totals.pointsDiscount > 0) && (
                                <div className="space-y-1.5 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                                    {(pos.totals.itemsDiscount > 0 || pos.totals.billDiscount > 0) && (
                                        <div className="flex justify-between text-blue-600 font-bold">
                                            <span className="uppercase tracking-widest text-[9px]">Diskon Promo</span>
                                            <span className="font-mono">-{formatCurrency(pos.totals.itemsDiscount + pos.totals.billDiscount)}</span>
                                        </div>
                                    )}
                                    {pos.totals.pointsDiscount > 0 && (
                                        <div className="flex justify-between text-indigo-600 font-bold">
                                            <span className="uppercase tracking-widest text-[9px]">Tukar Poin</span>
                                            <span className="font-mono">-{formatCurrency(pos.totals.pointsDiscount)}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-between text-2xl lg:text-3xl font-black pt-4 border-t border-slate-200 items-center">
                                <span className="tracking-tighter text-slate-500 uppercase text-[10px] font-black">Grand Total</span>
                                <span className="text-blue-600 font-display">{formatCurrency(pos.totals.total)}</span>
                            </div>
                        </div>

                        {/* Adjustment Buttons Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <Dialog open={isVoucherOpen} onOpenChange={setIsVoucherOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className={cn("h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 border-slate-200 bg-slate-50 hover:bg-white/10 transition-all shadow-sm", pos.appliedVoucher && "bg-blue-500/10 border-blue-500/50 text-blue-400")}>
                                        <Ticket className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Voucher</span>
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-[300px] rounded-[2rem]">
                                    <DialogHeader><DialogTitle className="text-blue-900 font-black">Gunakan Voucher</DialogTitle></DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <Input
                                            placeholder="KODE VOUCHER"
                                            className="h-12 text-center font-mono uppercase tracking-[0.2em] bg-slate-50 border-slate-200"
                                            value={voucherCode}
                                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                        />
                                        <Button
                                            className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={() => {
                                                pos.validateVoucher(voucherCode).then(() => setIsVoucherOpen(false));
                                            }}
                                        >Terapkan Voucher</Button>
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
                                <DialogContent className="bg-white text-slate-900 border-slate-200 rounded-[3rem] p-8 shadow-3xl">
                                    <DialogHeader><DialogTitle className="text-center text-xl font-black uppercase tracking-tighter text-blue-900">Data Pelanggan (CRM)</DialogTitle></DialogHeader>
                                    <div className="space-y-6 pt-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Cari Pelanggan Terdaftar</label>
                                            <Select onValueChange={(v) => pos.setSelectedCustomerId(Number(v))} defaultValue={pos.selectedCustomerId?.toString()}>
                                                <SelectTrigger className="bg-slate-50 border-slate-200 h-14 rounded-2xl px-6 text-base focus:ring-blue-100"><SelectValue placeholder="Pilih Pelanggan" /></SelectTrigger>
                                                <SelectContent className="bg-white border-slate-200 text-slate-900 rounded-2xl">
                                                    {pos.customers?.map(c => <SelectItem key={c.id} value={c.id.toString()} className="h-12 rounded-xl focus:bg-blue-600 focus:text-white">{c.name} ({c.phone})</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="relative py-2">
                                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                                            <div className="relative flex justify-center"><span className="bg-white px-4 text-[10px] font-black uppercase text-slate-300 tracking-widest">ATAU TAMBAH BARU</span></div>
                                        </div>
                                        <div className="space-y-4">
                                            <Input placeholder="Nama Lengkap Pelanggan" className="bg-slate-50 border-slate-200 h-14 rounded-2xl px-6" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                                            <Input placeholder="Nomor WhatsApp (Contoh: 0812...)" className="bg-slate-50 border-slate-200 h-14 rounded-2xl px-6" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                                            <Button className="w-full h-16 rounded-2xl font-black text-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20" onClick={() => { pos.createCustomer(newCustomer as any); setNewCustomer({ name: "", phone: "" }); setIsCustomerOpen(false); }} disabled={!newCustomer.name || pos.isCreatingCustomer}>
                                                {pos.isCreatingCustomer ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "SIMPAN & PILIH"}
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
                                <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-center text-xl font-black uppercase tracking-tight text-blue-900">Tukar Poin Loyalitas</DialogTitle>
                                    </DialogHeader>
                                    <div className="py-6 space-y-6">
                                        {!pos.selectedCustomerId ? (
                                            <div className="text-center py-8 text-slate-300 space-y-3">
                                                <AlertCircle className="w-12 h-12 mx-auto opacity-20" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Pilih Pelanggan Dahulu</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">Saldo Poin Tersedia</p>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Coins className="w-6 h-6 text-blue-600" />
                                                        <span className="text-4xl font-black font-display text-blue-600">
                                                            {pos.customers?.find(c => c.id === pos.selectedCustomerId)?.points?.toLocaleString() || 0}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Jumlah Poin Ditukar</label>
                                                        <Input 
                                                            type="number"
                                                            className="h-14 bg-white border-slate-200 text-center text-2xl font-black rounded-2xl focus:ring-blue-100"
                                                            value={pos.pointsRedeemed}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                const maxAvailable = pos.customers?.find(c => c.id === pos.selectedCustomerId)?.points || 0;
                                                                pos.setPointsRedeemed(Math.min(val, maxAvailable));
                                                            }}
                                                        />
                                                    </div>
                                                    <Button 
                                                        className="w-full h-14 rounded-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
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
                                <Button className="w-full rounded-2xl h-14 lg:h-16 shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 text-white text-lg lg:text-xl font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center justify-between px-8" disabled={pos.cart.length === 0}>
                                    <span>BAYAR</span>
                                    <div className="bg-white/20 px-3 py-1 rounded-lg">
                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                    </div>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white text-slate-900 border-slate-200 max-w-sm rounded-[3rem] p-8 shadow-3xl">
                                <DialogHeader><DialogTitle className="text-center text-2xl font-black uppercase tracking-tighter text-blue-900">Pembayaran</DialogTitle></DialogHeader>
                                <div className="grid grid-cols-1 gap-3 py-6">
                                    <PaymentMethodButton label="Tunai (Cash)" icon={Banknote} active={pos.paymentMethod === "cash"} onClick={() => pos.setPaymentMethod("cash")} />
                                    <PaymentMethodButton label="Transfer Bank" icon={CreditCard} active={pos.paymentMethod === "transfer"} onClick={() => pos.setPaymentMethod("transfer")} />
                                    <PaymentMethodButton label="QRIS / E-Wallet" icon={QrCode} active={pos.paymentMethod === "qris"} onClick={() => pos.setPaymentMethod("qris")} />
                                </div>
                                <div className="bg-blue-50 p-6 rounded-[2rem] mb-6 text-center border border-blue-100 shadow-inner">
                                    <p className="text-blue-400 text-xs uppercase font-black tracking-widest mb-1">Total Tagihan</p>
                                    <p className="text-4xl font-display font-black text-blue-700">{formatCurrency(pos.totals.total)}</p>
                                </div>
                                <Button size="lg" className="w-full rounded-[1.5rem] h-16 font-black text-xl shadow-2xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCheckout} disabled={pos.isProcessing}>
                                    {pos.isProcessing && <Loader2 className="w-5 h-5 mr-3 animate-spin text-white" />}
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
            <ClosingSessionDialog open={isClosingDialogOpen} onOpenChange={setIsClosingDialogOpen} session={pos.activeSession} onClosing={pos.closeSession} onPrint={() => setIsSessionPrinterOpen(true)} />


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
        <DialogContent className="bg-white text-slate-900 border-slate-200 rounded-[2rem] max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-3xl">
            <DialogHeader className="p-6 border-b border-slate-100">
                <DialogTitle className="flex items-center gap-2 text-blue-900 font-black">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Riwayat Transaksi Terakhir
                </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                ) : !sales || sales.length === 0 ? (
                        <div className="text-center py-20 opacity-20 flex flex-col items-center">
                            <ShoppingBag className="w-16 h-16 mb-4" />
                            <p className="font-bold uppercase tracking-widest text-xs">Belum ada transaksi</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sales.map((sale: any) => (
                                <div key={sale.id} className="bg-slate-50 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all border-l-4 border-l-blue-600/30">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono font-bold text-slate-900/20 bg-slate-50 px-1.5 py-0.5 rounded">#{sale.id}</span>
                                            <span className="text-sm font-bold text-slate-900 tracking-tight">{formatCurrency(sale.totalAmount)}</span>
                                            <Badge variant="outline" className={cn("text-[9px] py-0 h-4 border-slate-200 text-slate-600 uppercase font-black")}>
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
                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-slate-500 hover:text-blue-600 hover:bg-blue-600/10 rounded-xl">
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
    const [error, setError] = useState(false);

    const handleKeypad = (val: string) => {
        if (pin.length < 6) setPin(prev => prev + val);
    };

    const handleClear = () => setPin("");

    useEffect(() => {
        if (pin.length === 6 && !isLoading) {
            onVerify(pin).catch(() => {
                setError(true);
                setPin("");
                setTimeout(() => setError(false), 2000);
            });
        }
    }, [pin, onVerify, isLoading]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isLoading) return;
            if (e.key >= "0" && e.key <= "9") handleKeypad(e.key);
            else if (e.key === "Backspace") setPin(prev => prev.slice(0, -1));
            else if (e.key === "Escape") onBack();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isLoading, onBack]);

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent)]" />
            
            <div className="w-full max-w-sm relative flex flex-col items-center space-y-12">
                <button 
                  onClick={onBack}
                  className="absolute -top-24 left-1/2 -translate-x-1/2 text-slate-500 hover:text-blue-600 flex items-center gap-2 text-xs font-black tracking-widest transition-all group px-6 py-3 rounded-2xl hover:bg-blue-50"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> GANTI KASIR
                </button>

                <div className="text-center space-y-4">
                    <div className="relative mb-6">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border border-slate-100 overflow-hidden">
                            {cashier?.profileImageUrl ? (
                                <img src={cashier.profileImageUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                    <User className="w-10 h-10 text-blue-300" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-blue-500 w-6 h-6 rounded-full border-4 border-white shadow-lg" />
                    </div>
                    <h2 className="text-3xl font-black text-blue-900 tracking-tight uppercase tracking-wider">{cashier?.firstName || cashier?.username || "Kasir"}</h2>
                    <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
                        <Monitor className="w-3 h-3 text-blue-600" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{deviceName}</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-4 h-4 rounded-full border-2 transition-all duration-300",
                                pin.length >= i ? "bg-blue-600 border-blue-600 scale-125 shadow-lg shadow-blue-500/20" : "bg-slate-100 border-slate-200",
                                error && "bg-red-500 border-red-500 animate-shake"
                            )}
                        />
                    ))}
                </div>

                {error && <p className="text-red-500 font-black text-[10px] uppercase tracking-[0.2em] animate-bounce">PIN Keamanan Salah</p>}

                <div className="grid grid-cols-3 gap-6 w-full px-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            disabled={isLoading}
                            onClick={() => handleKeypad(num.toString())}
                            className="w-16 h-16 xl:w-20 xl:h-20 rounded-full bg-white border border-slate-100 flex items-center justify-center text-2xl font-black text-blue-900 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 transition-all shadow-sm"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        disabled={isLoading}
                        onClick={handleClear}
                        className="w-16 h-16 xl:w-20 xl:h-20 rounded-full bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest"
                    >
                        CLEAR
                    </button>
                    <button
                        disabled={isLoading}
                        onClick={() => handleKeypad("0")}
                        className="w-16 h-16 xl:w-20 xl:h-20 rounded-full bg-white border border-slate-100 flex items-center justify-center text-2xl font-black text-blue-900 hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-95 transition-all shadow-sm"
                    >
                        0
                    </button>
                    <div className="flex items-center justify-center">
                        {isLoading && <Loader2 className="w-8 h-8 animate-spin text-blue-600" />}
                    </div>
                </div>

                <div className="pt-8 text-center">
                    <p className="text-slate-900/10 text-[10px] font-black tracking-[0.3em] uppercase">
                        Sistem POS Terenkripsi • Kazana AI
                    </p>
                </div>
            </div>
        </div>
    );
}

function CashierSelectionOverlay({ cashiers, isLoading, onSelect, deviceName }: { cashiers?: any[], isLoading: boolean, onSelect: (c: any) => void, deviceName: string }) {
    return (
        <div className="fixed inset-0 z-[100] bg-white text-slate-900 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent)]" />
            
            <div className="w-full max-w-5xl relative animate-enter py-12">
                <div className="text-center mb-20">
                    <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-blue-100 shadow-xl shadow-blue-500/5">
                        <UserPlus className="w-10 h-10 text-blue-600" />
                    </div>
                    <h1 className="text-5xl font-black text-blue-900 mb-4 tracking-tighter uppercase tracking-widest">Pilih Profil Kasir</h1>
                    <div className="flex items-center justify-center gap-3">
                        <Monitor className="w-4 h-4 text-blue-200" />
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Terminal Aktif: <span className="text-blue-600">{deviceName}</span></p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-6">
                        <Loader2 className="w-16 h-16 animate-spin text-blue-600" />
                        <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] animate-pulse">Sinkronisasi data kasir...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {cashiers?.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => onSelect(c)}
                                className="group relative flex flex-col items-center p-10 bg-white border border-slate-100 rounded-[3.5rem] hover:bg-blue-50 hover:border-blue-200 transition-all active:scale-95 shadow-xl hover:shadow-blue-500/10"
                            >
                                <div className="w-28 h-28 rounded-[2.5rem] bg-slate-50 mb-8 flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl transition-transform group-hover:scale-105">
                                    {c.profileImageUrl ? (
                                        <img src={c.profileImageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-50/50">
                                            <span className="text-4xl font-black text-blue-200 group-hover:text-blue-600 transition-colors">
                                                {(c.firstName || c.username || "?").charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-900 transition-colors mb-2">{c.firstName || c.username}</h3>
                                <Badge variant="outline" className="text-[10px] h-6 px-4 border-slate-200 text-slate-500 uppercase font-black tracking-widest group-hover:border-blue-300 group-hover:text-blue-600 transition-colors">
                                    {c.role === 'admin' ? 'Administrator' : 'Kasir Utama'}
                                </Badge>
                                
                                <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-all translate-y-3 group-hover:translate-y-0">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
                                        <Lock className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </button>
                        ))}
                        {(!cashiers || cashiers.length === 0) && (
                            <div className="col-span-full py-32 text-center border-4 border-dashed border-slate-100 rounded-[4rem]">
                                <AlertCircle className="w-16 h-16 mx-auto mb-6 opacity-10 text-slate-500" />
                                <p className="text-slate-500 font-black uppercase tracking-[0.2em]">Tidak Ada Kasir Terdaftar</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-24 text-center">
                    <Link href="/">
                        <Button variant="ghost" className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-3xl px-10 h-14 gap-4 transition-all group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                            <span className="text-xs font-black uppercase tracking-widest">KEMBALI KE POS DASHBOARD</span>
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
                            <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-6 border border-blue-600/20 shadow-inner">
                                <Package className="w-10 h-10 text-blue-600" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Daftarkan Terminal</h1>
                            <p className="text-slate-500 text-sm max-w-[280px]">Minta Kode Registrasi dari Admin untuk mengaktifkan terminal ini.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Nama Terminal</label>
                                <Input
                                    className="bg-slate-50 border-white/10 h-14 px-6 rounded-2xl text-lg focus:ring-blue-600/20 focus:border-blue-600/50 transition-all font-medium"
                                    placeholder="Contoh: Kasir Depan"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1">Kode Registrasi (6 Digit)</label>
                                <Input
                                    maxLength={6}
                                    className="bg-slate-50 border-white/10 h-14 px-6 rounded-2xl text-lg focus:ring-blue-600/20 focus:border-blue-600/50 transition-all font-medium tracking-[0.5em] text-center"
                                    placeholder="000000"
                                    value={registrationCode}
                                    onChange={(e) => setRegistrationCode(e.target.value.replace(/\D/g, ""))}
                                />
                            </div>

                            <Button
                                className="w-full h-16 rounded-2xl text-lg font-black bg-blue-600 hover:bg-blue-600/90 text-slate-900 shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 mt-4 group"
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
                                    <button className="text-slate-900/20 hover:text-blue-600 text-xs font-bold transition-colors uppercase tracking-widest">
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
            className="bg-slate-50 border-white/10 hover:border-blue-600/50 hover:bg-white/10 transition-all cursor-pointer group rounded-[2rem] overflow-hidden shadow-2xl select-none active:scale-95 flex flex-col h-full min-h-[220px]"
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
                        <Badge className="bg-white text-blue-900 backdrop-blur-xl border-slate-200 text-[9px] font-black tracking-widest py-0.5 px-2 h-5 uppercase">{product.sku}</Badge>
                        <Badge className={cn("backdrop-blur-xl text-[8px] font-black tracking-widest py-0.5 px-2 h-5 uppercase", Number(product.currentStock) > 5 ? "bg-blue-500/40 border-blue-500/20" : "bg-red-500/40 border-red-500/20")}>
                            {Number(product.currentStock) > 0 ? `${product.currentStock} UNIT` : "KOSONG"}
                        </Badge>
                    </div>
                </div>
                <div className="p-4 flex flex-col flex-1 justify-between bg-white">
                    <h3 className="font-bold text-slate-800 text-[13px] lg:text-[14px] leading-snug line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors tracking-tight h-10">{product.name}</h3>
                    <div className="flex items-end justify-between mt-auto gap-2">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Harga Unit</span>
                            <span className="text-blue-600 font-display font-black text-sm lg:text-[1.1rem] truncate drop-shadow-sm">{formatCurrency(price)}</span>
                        </div>
                        <div className="w-10 h-10 shrink-0 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 transition-all shadow-sm group-hover:shadow-blue-500/20">
                            <Plus className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function CartItemCard({ item, onUpdate, onRemove, formatCurrency }: { item: any, onUpdate: any, onRemove: any, formatCurrency: any }) {
    return (
        <div className="bg-slate-50 border border-white/10 rounded-2xl p-4 flex gap-4 group animate-in slide-in-from-right-2 hover:bg-white/10 transition-all hover:translate-x-1 border-l-4 border-l-transparent hover:border-l-blue-600/50 relative overflow-hidden shadow-xl">
            <div className="w-16 h-20 rounded-xl bg-slate-50 shrink-0 overflow-hidden border border-white/10 relative group-hover:border-blue-600/20 transition-all shadow-inner">
                {item.photoUrl ? (
                    <img src={item.photoUrl} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20"><Package className="w-6 h-6" /></div>
                )}
                {item.appliedPromoId && (
                    <div className="absolute top-0 left-0 bg-blue-600/90 text-[8px] font-black px-1.5 py-0.5 rounded-br-lg text-slate-900 shadow-lg tracking-widest uppercase">PROMO</div>
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
                        <p className="text-sm lg:text-lg text-blue-600 font-black drop-shadow-[0_0_8px_rgba(0,102,255,0.3)]">{formatCurrency(Number(item.sellingPrice))}</p>
                        {item.itemDiscount > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-red-400 font-black italic">-{formatCurrency(item.itemDiscount)}</span>
                                <span className="w-1 h-1 bg-red-400 rounded-full opacity-30" />
                                <span className="text-[10px] text-slate-900/20 line-through">{formatCurrency(Number(item.sellingPrice) + item.itemDiscount)}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-inner">
                        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-200 border border-transparent">
                            <Tag className="w-3.5 h-3.5" />
                        </div>
                        
                        <div className="flex items-center gap-2 px-1">
                            <button onClick={() => onUpdate(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-blue-600"><Minus className="w-3.5 h-3.5" /></button>
                            <span className="w-6 text-center text-sm font-black text-slate-900">{item.quantity}</span>
                            <button onClick={() => onUpdate(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-blue-600/20 hover:bg-blue-600/40 rounded-xl transition-all text-blue-600"><Plus className="w-3.5 h-3.5" /></button>
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
                    ? "bg-blue-600 border-blue-600 text-slate-900 shadow-lg shadow-blue-600/20 scale-[1.02]"
                    : "bg-slate-50 border-slate-200 text-slate-500 hover:border-white/10"
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
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent)]" />
            
            <div className="w-full max-w-md relative animate-enter">
                <Card className="bg-white border-slate-100 rounded-[3rem] shadow-3xl overflow-hidden">
                    <CardContent className="p-12 space-y-10">
                        <div className="text-center relative">
                            <button 
                                onClick={onLogout}
                                className="absolute -top-4 -right-4 text-slate-300 hover:text-blue-600 flex items-center gap-2 text-[10px] font-black tracking-widest transition-all p-3 rounded-xl hover:bg-blue-50"
                                title="Ganti Kasir / Logout"
                            >
                                <Lock className="w-3.5 h-3.5" /> GANTI
                            </button>
                            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-blue-100 shadow-xl shadow-blue-500/5">
                                <Store className="w-12 h-12 text-blue-600" />
                            </div>
                            <h2 className="text-4xl font-black text-blue-900 tracking-tighter uppercase tracking-tight">Buka Shift Kasir</h2>
                            <div className="flex items-center justify-center gap-3 mt-3">
                                <Monitor className="w-4 h-4 text-blue-200" />
                                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">{deviceName || "KASIR UTAMA"}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase ml-1">Modal Awal Tunai (Cash)</label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-200 group-focus-within:text-blue-600 transition-colors">
                                        <Banknote className="w-full h-full" />
                                    </div>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="h-20 bg-slate-50 border-slate-100 pl-16 text-4xl font-black rounded-3xl focus:ring-blue-100 focus:border-blue-200 transition-all placeholder:text-slate-200"
                                        value={balance}
                                        onChange={e => setBalance(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase ml-1">Catatan Tambahan</label>
                                <Input
                                    placeholder="Shift Pagi / Serah Terima..."
                                    className="h-16 bg-white border-slate-100 rounded-[1.5rem] text-sm px-6 focus:ring-blue-100 focus:border-blue-200"
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full h-20 rounded-[1.5rem] font-black text-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                            onClick={() => onStart(Number(balance), notes)}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-8 h-8 animate-spin text-white" /> : "AKTIFKAN KASIR"}
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
        <DialogContent className="bg-white text-slate-900 border-slate-200 rounded-[2rem] max-w-xs shadow-2xl">
            <DialogHeader><DialogTitle className="text-blue-900 font-black">Pencatatan Kas Kecil</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex gap-1 p-1 bg-slate-50 rounded-xl border border-slate-100">
                    <Button variant={type === "in" ? "default" : "ghost"} className={cn("flex-1 rounded-lg", type === "in" ? "bg-blue-600 text-white" : "text-slate-500")} onClick={() => setType("in")}>MASUK</Button>
                    <Button variant={type === "out" ? "default" : "ghost"} className={cn("flex-1 rounded-lg", type === "out" ? "bg-blue-600 text-white" : "text-slate-500")} onClick={() => setType("out")}>KELUAR</Button>
                </div>
                <Input type="number" placeholder="Nominal" className="bg-white border-slate-200 h-12 rounded-xl focus:ring-blue-100" value={amount} onChange={e => setAmount(e.target.value)} />
                <Input placeholder="Keterangan / Alasan" className="bg-white border-slate-200 h-12 rounded-xl focus:ring-blue-100" value={description} onChange={e => setDescription(e.target.value)} />
                <Button className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" onClick={() => {
                    onSave({ amount: Number(amount), description, type });
                    setAmount(""); setDescription(""); onOpenChange(false);
                }}>SIMPAN TRANSAKSI</Button>
            </div>
        </DialogContent>
        </Dialog>
    );
}

function PinLockScreen({ onVerify, isVerifying, cashiers, deviceName }: { onVerify: any, isVerifying: boolean, cashiers: any[], deviceName: string }) {
    const [pin, setPin] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string>("");

    const handleKeyClick = (num: string) => {
        if (pin.length < 6) setPin(prev => prev + num);
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    useEffect(() => {
        if (pin.length === 6 && selectedUserId && !isVerifying) {
            onVerify(pin, selectedUserId)
                .then(() => setPin(""))
                .catch(() => setPin(""));
        }
    }, [pin, selectedUserId, onVerify, isVerifying]);

    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent)] pointer-events-none" />
            
            <Card className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-[3.5rem] border-slate-200 bg-white/80 backdrop-blur-xl shadow-3xl overflow-hidden min-h-[600px]">
                {/* Left Side: Welcome */}
                <div className="p-12 flex flex-col justify-between bg-gradient-to-br from-blue-50 to-transparent border-r border-slate-100">
                    <div className="space-y-6">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-12">
                            <Store className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-5xl font-display font-black text-blue-900 leading-tight tracking-tighter">
                            KAZANA<br /><span className="text-blue-600 italic">TERMINAL</span>
                        </h1>
                        <p className="text-slate-500 text-lg max-w-xs font-medium">Silakan pilih profil kasir dan masukkan PIN untuk memulai shift.</p>
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
                                            ? "bg-blue-600 border-blue-600 text-slate-900 shadow-lg shadow-blue-600/20" 
                                            : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                                    )}
                                >
                                    <p className="font-bold text-sm truncate">{c.firstName || c.username}</p>
                                    <p className={cn("text-[8px] font-black uppercase tracking-widest mt-0.5", selectedUserId === c.id ? "text-slate-900/60" : "text-slate-500 group-hover:text-slate-500")}>Cashier</p>
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
                <div className="p-12 flex flex-col items-center justify-center bg-slate-50/50">
                    <div className="w-full max-w-[320px] space-y-12">
                        {/* PIN Visualizer */}
                        <div className="flex justify-center gap-4">
                            {[0, 1, 2, 3, 4, 5].map(i => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "w-4 h-4 rounded-full border-2 transition-all duration-300",
                                        pin.length > i 
                                            ? "bg-blue-600 border-blue-600 scale-110 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                                            : "border-slate-200"
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
                                    className="w-20 h-20 rounded-3xl text-3xl font-bold bg-slate-50 hover:bg-blue-50 text-blue-900 border-transparent transition-all active:scale-90"
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
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex items-center justify-center z-50">
                    <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" strokeWidth={3} />
                        <p className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs">Memverifikasi Identitas...</p>
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
                <Button className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20">Daftarkan Perangkat Ini</Button>
            </DialogTrigger>
            <DialogContent className="bg-white text-slate-900 border-slate-200 rounded-[2.5rem] p-8 max-w-md shadow-3xl">
                <DialogHeader><DialogTitle className="text-center font-black uppercase tracking-tighter text-xl text-blue-900">Registrasi Terminal</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <Input placeholder="Nama Terminal (misal: Kasir Utama)" className="h-14 bg-slate-50 border-slate-200 rounded-2xl px-6 focus:ring-blue-100" value={name} onChange={e => setName(e.target.value)} />
                    <Input placeholder="Kode Registrasi (6 Digit)" className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-mono text-center text-2xl tracking-widest focus:ring-blue-100" maxLength={6} value={code} onChange={e => setCode(e.target.value)} />
                    <Button className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/20" onClick={() => onRegister({ name, registrationCode: code })} disabled={isRegistering || !name || !code}>
                        {isRegistering ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : "AKTIFKAN SEKARANG"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function PendingSalesDialog({ open, onOpenChange, sales, onResume }: any) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-white text-slate-900 border-slate-200 rounded-[2.5rem] max-w-md shadow-3xl">
                <DialogHeader><DialogTitle className="text-blue-900 font-black flex items-center gap-2 px-1"><Timer className="w-5 h-5 text-blue-600" /> Antrean Pesanan (Hold)</DialogTitle></DialogHeader>
                <div className="space-y-3 py-6 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {sales.map((s: any) => (
                        <div key={s.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center group hover:bg-blue-50 transition-colors">
                            <div>
                                <p className="font-black text-blue-900 text-sm uppercase tracking-tight">{s.customerName || "Tanpa Nama"}</p>
                                <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-1 font-bold">
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
                            <Button size="sm" className="rounded-xl h-9 px-4 font-black text-[10px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20" onClick={() => { onResume(s); onOpenChange(false); }}>
                                LANJUTKAN
                            </Button>
                        </div>
                    ))}
                    {sales.length === 0 && (
                        <div className="text-center py-10 opacity-20 flex flex-col items-center">
                            <Timer className="w-12 h-12 mb-3" />
                            <p className="text-xs font-black uppercase tracking-[0.2em]">Tidak ada antrean</p>
                        </div>
                    )}
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
            <DialogContent className="bg-white text-slate-900 border-slate-200 rounded-[2.5rem] max-w-md shadow-3xl">
                <DialogHeader className="flex flex-row items-center justify-between pr-8 border-b border-slate-100 pb-4">
                    <DialogTitle className="text-xl font-black text-blue-900">Closing Kasir (Z-Report)</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-6 font-display">
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-4">
                        <p className="text-sm font-black text-blue-900 mb-1 flex items-center uppercase tracking-tight">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Sistem Blind Close Aktif
                        </p>
                        <p className="text-[11px] text-blue-700/70 font-bold leading-relaxed">Harap hitung dan masukkan jumlah fisik uang tunai di laci Anda secara teliti. Selisih kas akan dicatat otomatis ke dalam jurnal audit.</p>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Uang Tunai di Laci (Fisik)</label>
                            <Input
                                type="number"
                                placeholder="0"
                                className="h-16 bg-slate-50 border-slate-200 text-center text-3xl font-black rounded-2xl focus:ring-blue-100 placeholder:text-slate-200"
                                value={actual}
                                onChange={e => setActual(e.target.value)}
                            />
                        </div>
                        <Input
                            placeholder="Tinggalkan catatan penutupan..."
                            className="h-14 bg-white border-slate-200 rounded-2xl px-6 focus:ring-blue-100"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <Button
                            variant="outline"
                            className="h-16 rounded-2xl font-black text-[10px] border-slate-200 text-slate-500 hover:bg-slate-50 uppercase tracking-widest"
                            onClick={onPrint}
                        >
                            <Printer className="w-5 h-5 mr-2 opacity-50" />
                            Cetak Laporan
                        </Button>
                        <Button
                            className="h-16 rounded-2xl font-black text-xs bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-500/20 uppercase tracking-widest"
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
            <DialogContent className="bg-white text-slate-900 border-slate-200 rounded-[2.5rem] max-w-sm shadow-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black flex items-center gap-3 text-blue-900">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                            <Printer className="w-5 h-5 text-blue-600" />
                        </div>
                        Setup Printer Thermal
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-6 font-display">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Ukuran Kertas Roll</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaperSize("58mm")}
                                className={cn(
                                    "h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                                    paperSize === "58mm" ? "bg-blue-50 border-blue-600 text-blue-700 shadow-md shadow-blue-500/10" : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                                )}
                            >
                                <span className="font-black text-lg">58mm</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Narrow Roll</span>
                            </button>
                            <button
                                onClick={() => setPaperSize("80mm")}
                                className={cn(
                                    "h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1",
                                    paperSize === "80mm" ? "bg-blue-50 border-blue-600 text-blue-700 shadow-md shadow-blue-500/10" : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                                )}
                            >
                                <span className="font-black text-lg">80mm</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Standard Roll</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
                            Pastikan printer sudah terhubung via Bluetooth/USB/WIFI. Gunakan tombol test print untuk mencoba.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <Button
                            onClick={onTestPrint}
                            variant="outline"
                            className="h-14 rounded-2xl border-slate-200 text-slate-600 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50"
                        >
                            <Printer className="w-4 h-4 mr-3 opacity-50" />
                            KENALAN (TEST PRINT)
                        </Button>
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20"
                        >
                            SIMPAN PENGATURAN
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
