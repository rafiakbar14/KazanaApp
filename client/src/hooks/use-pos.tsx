import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import type { Product, Sale, SaleItem, Customer, InsertSale, InsertSaleItem, InsertCustomer, PosDevice } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export interface CartItem extends Product {
    quantity: number;
}

interface POSContextType {
    cart: CartItem[];
    addToCart: (product: Product, qty?: number) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, qty: number) => void;
    clearCart: () => void;
    totals: any;
    customers: Customer[] | undefined;
    isLoadingCustomers: boolean;
    selectedCustomerId: number | null;
    setSelectedCustomerId: (id: number | null) => void;
    discount: number;
    setDiscount: (val: number) => void;
    pointsRedeemed: number;
    setPointsRedeemed: (val: number) => void;
    discountType: 'fixed' | 'percentage';
    setDiscountType: (val: 'fixed' | 'percentage') => void;
    itemDiscounts: Record<number, { value: number, type: 'fixed' | 'percentage' }>;
    updateItemDiscount: (productId: number, value: number, type: 'fixed' | 'percentage') => void;
    paymentMethod: string;
    setPaymentMethod: (method: string) => void;
    isVerified: boolean;
    currentCashier: any;
    checkout: (saleData?: any) => Promise<any>;
    isProcessing: boolean;
    createCustomer: (customer: InsertCustomer) => void;
    isCreatingCustomer: boolean;
    verifyPin: (pin: string, userId?: string) => Promise<any>;
    isVerifying: boolean;
    logout: () => void;
    deviceId: string;
    currentDevice: PosDevice | null | undefined;
    targetCashier: any | null;
    setTargetCashier: (cashier: any | null) => void;
    cashiers: any[] | undefined;
    isLoadingCashiers: boolean;
    registerDevice: (data: { name: string, registrationCode: string }) => Promise<any>;
    isRegistering: boolean;
    isLoadingDevice: boolean;
    activeSession: any;
    isLoadingSession: boolean;
    startSession: (openingBalance: number, notes?: string) => void;
    closeSession: (id: number, closingBalance: number, actualCash: number, notes?: string) => void;
    createPettyCash: (data: any) => void;
    pendingSales: any[] | undefined;
    holdSale: (customerName?: string) => void;
    resumePendingSale: (ps: any) => void;
    validateVoucher: (code: string) => Promise<any>;
    appliedVoucher: any;
    lastSale: any;
    setLastSale: (sale: any) => void;
    salesHistory: any[] | undefined;
    isLoadingHistory: boolean;
    categories: string[] | undefined;
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
}

const POSContext = createContext<POSContextType | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [discount, setDiscount] = useState<number>(0);
    const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
    const [pointsRedeemed, setPointsRedeemed] = useState<number>(0);
    const [itemDiscounts, setItemDiscounts] = useState<Record<number, { value: number, type: 'fixed' | 'percentage' }>>({});
    const [paymentMethod, setPaymentMethod] = useState<string>("cash");
    const [isVerified, setIsVerified] = useState<boolean>(() => {
        try {
            return sessionStorage.getItem("pos_verified") === "true";
        } catch (e) {
            return false;
        }
    });
    const [currentCashier, setCurrentCashier] = useState<any>(() => {
        try {
            const saved = sessionStorage.getItem("pos_cashier");
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            console.error("Failed to parse POS cashier from session storage", e);
            return null;
        }
    });

    const [targetCashier, setTargetCashier] = useState<any | null>(null);

    const [deviceId] = useState<string>(() => {
        try {
            let id = localStorage.getItem("pos_device_id");
            if (!id) {
                id = (typeof crypto !== "undefined" && crypto.randomUUID) 
                    ? crypto.randomUUID() 
                    : Math.random().toString(36).substring(2) + Date.now().toString(36);
                localStorage.setItem("pos_device_id", id);
            }
            return id;
        } catch (e) {
            return "fallback-device-id-" + Date.now();
        }
    });

    const { data: currentDevice, isLoading: isLoadingDevice } = useQuery<PosDevice | null>({
        queryKey: ["/api/pos/device", deviceId],
        queryFn: async () => {
            const res = await fetch(`/api/pos/devices/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ deviceId, pin: "000000" }), // Dummy check for registration
            });
            const data = await res.json();
            if (res.status === 401) {
                if (data.registered === false) return null;
                return { deviceId, name: data.deviceName } as PosDevice;
            }
            if (!res.ok) return null;
            return data;
        },
        retry: false,
    });

    const { data: customers, isLoading: isLoadingCustomers } = useQuery<Customer[]>({
        queryKey: [api.pos.customers.list.path],
        enabled: isVerified,
    });

    const { data: categories } = useQuery<string[]>({
        queryKey: [api.products.categories.path],
        enabled: isVerified,
    });

    const [selectedCategory, setSelectedCategory] = useState<string>("Semua");

    const { data: promotions } = useQuery<any[]>({
        queryKey: [api.pos.promotions.list.path],
        enabled: isVerified,
    });

    const { data: tieredPrices } = useQuery<TieredPricing[]>({
        queryKey: ["/api/pricing/tiered"],
        enabled: isVerified,
    });

    const { data: cashiers, isLoading: isLoadingCashiers } = useQuery<any[]>({
        queryKey: ["/api/pos/devices/cashiers", deviceId],
        queryFn: async () => {
            const res = await fetch(`/api/pos/devices/cashiers?deviceId=${deviceId}`);
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!deviceId && !isVerified,
    });

    // Session Data
    const { data: activeSession, isLoading: isLoadingSession } = useQuery<any>({
        queryKey: [api.pos.sessions.active.path],
        queryFn: async () => {
            const res = await fetch(api.pos.sessions.active.path);
            if (res.status === 401) {
                logout();
                return null;
            }
            if (!res.ok) return null;
            return res.json();
        },
        enabled: isVerified,
    });

    // Sales History
    const { data: salesHistory, isLoading: isLoadingHistory } = useQuery<any[]>({
        queryKey: [api.pos.sales.list.path],
        enabled: isVerified,
    });

    const activePromos = useMemo(() => {
        if (!promotions) return [];
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDay = now.getDay().toString();

        return promotions.filter(p => {
            if (p.startTime && p.endTime) {
                if (currentTime < p.startTime || currentTime > p.endTime) return false;
            }
            if (p.daysOfWeek) {
                if (!p.daysOfWeek.split(',').includes(currentDay)) return false;
            }
            return true;
        });
    }, [promotions]);

    const addToCart = (product: Product, qty: number = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + qty }
                        : item
                );
            }
            return [...prev, { ...product, quantity: qty }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, qty: number) => {
        if (qty <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart(prev => prev.map(item =>
            item.id === productId ? { ...item, quantity: qty } : item
        ));
    };

    const clearCart = () => {
        setCart([]);
        setSelectedCustomerId(null);
        setDiscount(0);
        setAppliedVoucher(null);
        setPointsRedeemed(0);
    };

    const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
    const [lastSale, setLastSale] = useState<any>(null);

    const totals = useMemo(() => {
        let itemsSubtotal = 0;
        let itemsDiscount = 0;

        const cartWithDiscounts = cart.map(item => {
            const price = Number(item.sellingPrice);
            let itemDiscount = 0;
            let appliedPromoId = null;

            // 0. Phase 12: Tiered Pricing (Bulk Discount)
            let basePrice = price;
            if (tieredPrices) {
                const productTiers = tieredPrices
                    .filter(t => t.productId === item.id)
                    .sort((a, b) => b.minQuantity - a.minQuantity); // Largest qty first

                const activeTier = productTiers.find(t => item.quantity >= t.minQuantity);
                if (activeTier) {
                    basePrice = Number(activeTier.price);
                }
            }

            // 1. Automatic Promotion (Use basePrice if tiered pricing is active)
            const promo = activePromos.find(p => p.productId === item.id);
            if (promo) {
                if (promo.type === 'percentage') {
                    itemDiscount = basePrice * (promo.value / 100);
                } else {
                    itemDiscount = promo.value;
                }
                appliedPromoId = promo.id;
            }

            // 2. Manual Item Discount (Overwrites promo)
            const manual = itemDiscounts[item.id];
            if (manual) {
                if (manual.type === 'percentage') {
                    itemDiscount = basePrice * (manual.value / 100);
                } else {
                    itemDiscount = manual.value;
                }
                appliedPromoId = null; // Manual override
            }

            // Secure item discounts (Cannot discount more than the price itself)
            if (itemDiscount > basePrice) {
                itemDiscount = basePrice; 
            }

            // Calculation
            const subtotal = (basePrice - itemDiscount) * item.quantity;
            itemsSubtotal += basePrice * item.quantity;
            itemsDiscount += itemDiscount * item.quantity;

            return { ...item, basePrice, itemDiscount, appliedPromoId };
        });

        const subtotalAfterItems = Math.max(0, itemsSubtotal - itemsDiscount);
        const tax = subtotalAfterItems * 0.11;

        let billDiscount = 0;
        if (discountType === 'percentage') {
            billDiscount = subtotalAfterItems * (discount / 100);
        } else {
            billDiscount = discount;
        }

        let voucherDiscount = 0;
        if (appliedVoucher) {
            if (subtotalAfterItems >= (appliedVoucher.minPurchase || 0)) {
                if (appliedVoucher.type === 'percentage') {
                    voucherDiscount = subtotalAfterItems * (appliedVoucher.value / 100);
                } else {
                    voucherDiscount = appliedVoucher.value;
                }
            }
        }

        // Secure bill/voucher discounts
        let finalDiscounts = billDiscount + voucherDiscount;
        
        // 3. Customer Loyalty Points Discount (Phase 17)
        const pointsDiscount = pointsRedeemed; // 1 Poin = Rp 1
        
        const totalBeforePoints = subtotalAfterItems + tax - finalDiscounts;
        const total = Math.max(0, totalBeforePoints - pointsDiscount);

        return {
            subtotal: itemsSubtotal,
            tax,
            total,
            itemsDiscount,
            billDiscount: finalDiscounts,
            pointsDiscount,
            cartWithDiscounts
        };
    }, [cart, discount, discountType, itemDiscounts, activePromos, appliedVoucher, pointsRedeemed]);

    const startSessionMutation = useMutation({
        mutationFn: async (data: { openingBalance: number, notes?: string }) => {
            const res = await fetch(api.pos.sessions.start.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.pos.sessions.active.path] });
            toast({ title: "Sesi Dimulai", description: "Terminal siap digunakan." });
        }
    });

    const logout = () => {
        setIsVerified(false);
        setCurrentCashier(null);
        sessionStorage.removeItem("pos_verified");
        sessionStorage.removeItem("pos_cashier");
        clearCart();
    };

    const closeSessionMutation = useMutation({
        mutationFn: async (data: { id: number, closingBalance: number, actualCash: number, notes?: string }) => {
            const res = await fetch(api.pos.sessions.close.path.replace(":id", data.id.toString()), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.pos.sessions.active.path] });
            logout();
            toast({ title: "Sesi Ditutup", description: "Laporan Z-Report telah dibuat." });
        }
    });

    const createPettyCashMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.pos.pettyCash.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return res.json();
        },
        onSuccess: () => {
            toast({ title: "Kas Kecil Dicatat", description: "Transaksi kas berhasil disimpan." });
        }
    });

    const createSaleMutation = useMutation({
        mutationFn: async (data: { sale: any, items: any[] }) => {
            const res = await fetch(api.pos.sales.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    sale: { ...data.sale, sessionId: activeSession?.id, type: "pos" }
                }),
            });
            if (!res.ok) throw new Error("Gagal memproses transaksi");
            return res.json();
        },
        onMutate: (data) => {
            if (currentCashier && !data.sale.salespersonId) {
                data.sale.salespersonId = currentCashier.id;
            }
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            queryClient.invalidateQueries({ queryKey: [api.pos.sales.list.path] });
            queryClient.invalidateQueries({ queryKey: [api.pos.sessions.active.path] });
            queryClient.invalidateQueries({ queryKey: [api.pos.customers.list.path] });
            setLastSale(data);
            clearCart();
            toast({ title: "Transaksi Berhasil", description: "Pesanan telah diproses dan stok telah diperbarui." });
        },
        onError: (err: Error) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    });

    const createCustomerMutation = useMutation({
        mutationFn: async (customer: InsertCustomer) => {
            const res = await fetch(api.pos.customers.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(customer),
            });
            if (!res.ok) throw new Error("Gagal menyimpan data pelanggan");
            return res.json();
        },
        onSuccess: (newCustomer) => {
            queryClient.invalidateQueries({ queryKey: [api.pos.customers.list.path] });
            setSelectedCustomerId(newCustomer.id);
            toast({ title: "Pelanggan Ditambahkan", description: `${newCustomer.name} telah terdaftar di CRM.` });
        }
    });

    const verifyPinMutation = useMutation({
        mutationFn: async ({ pin, userId }: { pin: string, userId?: string }) => {
            const res = await fetch(api.pos.devices.verify.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin, deviceId, userId }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "PIN Salah atau Perangkat tidak terdaftar");
            }
            return data;
        },
        onSuccess: (data) => {
            setIsVerified(true);
            setCurrentCashier(data.user);
            sessionStorage.setItem("pos_verified", "true");
            sessionStorage.setItem("pos_cashier", JSON.stringify(data.user));
            
            // Sync with global auth state
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            queryClient.invalidateQueries({ queryKey: [api.roles.me.path] });
            queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
            
            toast({ title: "PIN Valid", description: `Selamat datang, ${data.user.firstName || data.user.username}.` });
        },
        onError: (err: any) => {
            if (err.message?.toLowerCase().includes("tidak terdaftar")) {
                queryClient.invalidateQueries({ queryKey: ["/api/pos/device", deviceId] });
            }
            toast({ title: "Gagal Verifikasi", description: err.message, variant: "destructive" });
        }
    });

    const registerDeviceMutation = useMutation({
        mutationFn: async (data: { name: string, registrationCode: string }) => {
            const res = await fetch(api.pos.devices.register.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...data, deviceId }),
            });
            if (!res.ok) throw new Error("Gagal mendaftarkan perangkat");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/pos/device", deviceId] });
            toast({ title: "Perangkat Terdaftar", description: "Perangkat ini sekarang sudah bisa digunakan untuk POS." });
        }
    });

    const savePendingSaleMutation = useMutation({
        mutationFn: async (customerName?: string) => {
            const res = await fetch(api.pos.pendingSales.save.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId: activeSession?.id,
                    cartData: JSON.stringify(cart),
                    customerName
                }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.pos.sessions.pendingSales.list.path] });
            clearCart();
            toast({ title: "Pesanan Ditunda", description: "Pesanan telah disimpan di antrean." });
        }
    });

    const { data: pendingSales } = useQuery<any[]>({
        queryKey: [api.pos.sessions.pendingSales.list.path, activeSession?.id],
        queryFn: async () => {
            if (!activeSession?.id) return [];
            const res = await fetch(api.pos.sessions.pendingSales.list.path.replace(":id", activeSession.id.toString()));
            return res.json();
        },
        enabled: !!activeSession?.id
    });

    const resumePendingSale = (ps: any) => {
        const savedCart = JSON.parse(ps.cartData);
        setCart(savedCart);
        fetch(api.pos.pendingSales.delete.path.replace(":id", ps.id.toString()), { method: "DELETE" })
            .then(() => queryClient.invalidateQueries({ queryKey: [api.pos.sessions.pendingSales.list.path] }));
    };

    const validateVoucher = async (code: string) => {
        try {
            const res = await fetch(`${api.pos.vouchers.validate.path}?code=${code}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Voucher tidak valid");
            }
            const voucher = await res.json();
            if (totals.total < (voucher.minPurchase || 0)) {
                throw new Error(`Minimal belanja untuk voucher ini adalah Rp ${voucher.minPurchase.toLocaleString()}`);
            }
            setAppliedVoucher(voucher);
            toast({ title: "Voucher Berhasil", description: `Voucher ${voucher.code} telah diterapkan.` });
            return voucher;
        } catch (err: any) {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
            throw err;
        }
    };

    const updateItemDiscount = useCallback((productId: number, value: number, type: 'fixed' | 'percentage') => {
        setItemDiscounts(prev => ({ ...prev, [productId]: { value, type } }));
    }, []);

    const checkout = useCallback((saleData?: any) => createSaleMutation.mutateAsync({
        sale: {
            ...saleData,
            totalAmount: totals.total,
            discountAmount: totals.billDiscount + totals.itemsDiscount,
            taxAmount: totals.tax,
            paymentMethod,
            paymentStatus: "paid",
            type: "pos",
            salespersonId: currentCashier?.id,
            voucherId: appliedVoucher?.id,
            pointsRedeemed: pointsRedeemed,
            pointsValueRedeemed: totals.pointsDiscount
        },
        items: totals.cartWithDiscounts.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.sellingPrice,
            discountAmount: item.itemDiscount,
            appliedPromotionId: item.appliedPromoId
        }))
    }), [createSaleMutation, totals, paymentMethod, currentCashier, appliedVoucher]);

    const createCustomer = useCallback((customer: InsertCustomer) => createCustomerMutation.mutate(customer), [createCustomerMutation]);
    const verifyPin = useCallback((pin: string, userId?: string) => verifyPinMutation.mutateAsync({ pin, userId }), [verifyPinMutation]);
    const registerDevice = useCallback((data: { name: string, registrationCode: string }) => registerDeviceMutation.mutateAsync(data), [registerDeviceMutation]);
    const startSession = useCallback((openingBalance: number, notes?: string) => startSessionMutation.mutate({ openingBalance, notes }), [startSessionMutation]);
    const closeSession = useCallback((id: number, closingBalance: number, actualCash: number, notes?: string) => closeSessionMutation.mutate({ id, closingBalance, actualCash, notes }), [closeSessionMutation]);
    const createPettyCash = useCallback((data: any) => createPettyCashMutation.mutate({ ...data, sessionId: activeSession?.id }), [createPettyCashMutation, activeSession]);
    const holdSale = useCallback((customerName?: string) => savePendingSaleMutation.mutate(customerName), [savePendingSaleMutation]);

    const value = useMemo(() => ({
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totals,
        customers,
        isLoadingCustomers,
        selectedCustomerId,
        setSelectedCustomerId,
        discount,
        setDiscount,
        discountType,
        setDiscountType,
        pointsRedeemed,
        setPointsRedeemed,
        itemDiscounts,
        updateItemDiscount,
        paymentMethod,
        setPaymentMethod,
        isVerified,
        currentCashier,
        checkout,
        isProcessing: createSaleMutation.isPending,
        createCustomer,
        isCreatingCustomer: createCustomerMutation.isPending,
        verifyPin,
        isVerifying: verifyPinMutation.isPending,
        logout,
        deviceId,
        currentDevice,
        registerDevice,
        isRegistering: registerDeviceMutation.isPending,
        isLoadingDevice,
        activeSession,
        isLoadingSession,
        startSession,
        closeSession,
        createPettyCash,
        pendingSales,
        holdSale,
        resumePendingSale,
        validateVoucher,
        appliedVoucher,
        lastSale,
        setLastSale,
        salesHistory,
        isLoadingHistory,
        categories,
        selectedCategory,
        setSelectedCategory,
        targetCashier,
        setTargetCashier,
        cashiers,
        isLoadingCashiers
    }), [
        cart, totals, customers, isLoadingCustomers, selectedCustomerId, discount, discountType, pointsRedeemed, itemDiscounts, 
        updateItemDiscount, paymentMethod, isVerified, currentCashier, checkout, createSaleMutation.isPending,
        createCustomer, createCustomerMutation.isPending, verifyPin, verifyPinMutation.isPending, logout, 
        deviceId, currentDevice, registerDevice, registerDeviceMutation.isPending, isLoadingDevice, 
        activeSession, isLoadingSession, startSession, closeSession, createPettyCash, pendingSales, 
        holdSale, resumePendingSale, validateVoucher, appliedVoucher, lastSale, salesHistory, 
        isLoadingHistory, categories, selectedCategory, targetCashier, cashiers, isLoadingCashiers
    ]);

    return <POSContext.Provider value={value}>{children}</POSContext.Provider>;
}

export function usePOS() {
    const context = useContext(POSContext);
    if (!context) {
        throw new Error("usePOS must be used within a POSProvider");
    }
    return context;
}
