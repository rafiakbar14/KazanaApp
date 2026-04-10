import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Promotion, Voucher, Product, InsertPromotion, InsertVoucher } from "@shared/schema";
import {
    Plus,
    Trash2,
    Calendar,
    Clock,
    Ticket,
    Sparkles,
    Tag,
    Percent,
    CheckCircle2,
    AlertCircle,
    Search,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PromotionManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("promos");

    // Queries
    const { data: promos, isLoading: isLoadingPromos } = useQuery<Promotion[]>({
        queryKey: [api.pos.promotions.list.path],
    });

    const { data: vouchers, isLoading: isLoadingVouchers } = useQuery<Voucher[]>({
        queryKey: [api.pos.vouchers.list.path],
    });

    const { data: products } = useQuery<Product[]>({
        queryKey: [api.products.list.path],
    });

    // Mutations
    const createPromoMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.pos.promotions.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.pos.promotions.list.path] });
            toast({ title: "Berhasil", description: "Promo berhasil dibuat" });
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        },
    });

    const deletePromoMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(api.pos.promotions.delete.path.replace(":id", id.toString()), {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Gagal menghapus promo");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.pos.promotions.list.path] });
            toast({ title: "Berhasil", description: "Promo berhasil dihapus" });
        },
    });

    const createVoucherMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.pos.vouchers.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.pos.vouchers.list.path] });
            toast({ title: "Berhasil", description: "Voucher berhasil dibuat" });
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        },
    });

    const deleteVoucherMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(api.pos.vouchers.delete.path.replace(":id", id.toString()), {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Gagal menghapus voucher");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.pos.vouchers.list.path] });
            toast({ title: "Berhasil", description: "Voucher berhasil dihapus" });
        },
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-2xl">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        Promo & Voucher
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Kelola diskon otomatis dan sistem kupon untuk pelanggan Anda.</p>
                </div>
            </div>

            <Tabs defaultValue="promos" onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100/50 p-1 rounded-xl mb-6">
                    <TabsTrigger value="promos" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-bold">
                        <Tag className="w-4 h-4 mr-2" />
                        Promo Otomatis
                    </TabsTrigger>
                    <TabsTrigger value="vouchers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2 text-sm font-bold">
                        <Ticket className="w-4 h-4 mr-2" />
                        Voucher Kode
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="promos" className="space-y-6">
                    <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Cari promo..." className="pl-10 h-11 bg-white/80 border-slate-200/80 rounded-xl" />
                            </div>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Buat Promo Baru
                                </Button>
                            </DialogTrigger>
                            <PromoForm
                                products={products || []}
                                onSubmit={(data) => createPromoMutation.mutate(data)}
                                isPending={createPromoMutation.isPending}
                            />
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {promos?.map(promo => (
                            <PromoCard
                                key={promo.id}
                                promo={promo}
                                products={products || []}
                                onDelete={(id) => deletePromoMutation.mutate(id)}
                            />
                        ))}
                        {promos?.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                                <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">Belum ada promo otomatis aktif.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="vouchers" className="space-y-6">
                    <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm mb-4">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input placeholder="Cari kode voucher..." className="pl-10 h-11 bg-white/80 border-slate-200/80 rounded-xl" />
                            </div>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Buat Voucher Baru
                                </Button>
                            </DialogTrigger>
                            <VoucherForm
                                onSubmit={(data) => createVoucherMutation.mutate(data)}
                                isPending={createVoucherMutation.isPending}
                            />
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vouchers?.map(voucher => (
                            <VoucherCard
                                key={voucher.id}
                                voucher={voucher}
                                onDelete={(id) => deleteVoucherMutation.mutate(id)}
                            />
                        ))}
                        {vouchers?.length === 0 && (
                            <div className="col-span-full py-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                                <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-medium">Belum ada voucher aktif.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PromoCard({ promo, products, onDelete }: { promo: Promotion, products: Product[], onDelete: (id: number) => void }) {
    const product = promo.productId ? products.find(p => p.id === promo.productId) : null;
    const days = promo.daysOfWeek ? promo.daysOfWeek.split(",").map(d => ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][parseInt(d)]).join(", ") : "Setiap Hari";

    return (
        <Card className="rounded-[2rem] border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group overflow-hidden bg-white/80 backdrop-blur-xl">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div className="bg-primary/10 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        {promo.type === "fixed" ? <Tag className="w-5 h-5 text-primary" /> : <Percent className="w-5 h-5 text-primary" />}
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full" onClick={() => onDelete(promo.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                <CardTitle className="text-xl font-bold mt-4">{promo.name}</CardTitle>
                <CardDescription className="text-sm font-medium line-clamp-1">
                    {product ? `Khusus: ${product.name}` : "Berlaku untuk seluruh transaksi"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                        {promo.type === "fixed" ? `Rp ${promo.value.toLocaleString()}` : `${promo.value}%`}
                    </span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Diskon</span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{days}</span>
                    </div>
                    {promo.startTime && (
                        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{promo.startTime} - {promo.endTime}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function VoucherCard({ voucher, onDelete }: { voucher: Voucher, onDelete: (id: number) => void }) {
    const isExpired = voucher.expiryDate && new Date(voucher.expiryDate) < new Date();

    return (
        <Card className="rounded-[2rem] border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 group overflow-hidden bg-white/80 backdrop-blur-xl">
            <div className="h-2 bg-emerald-500/20" />
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div className="bg-emerald-100 p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                        <Ticket className="w-5 h-5 text-emerald-600" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full" onClick={() => onDelete(voucher.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">{voucher.code}</span>
                    {isExpired && <Badge variant="destructive" className="rounded-full px-2 py-0">Expired</Badge>}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                        {voucher.type === "fixed" ? `Rp ${voucher.value.toLocaleString()}` : `${voucher.value}%`}
                    </span>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Diskon</span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                            <span>Min. Belanja</span>
                        </div>
                        <span>Rp {voucher.minPurchase.toLocaleString()}</span>
                    </div>
                    {voucher.expiryDate && (
                        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>Kadaluwarsa</span>
                            </div>
                            <span>{format(new Date(voucher.expiryDate), "dd MMM yyyy", { locale: id })}</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function PromoForm({ products, onSubmit, isPending }: { products: Product[], onSubmit: (data: any) => void, isPending: boolean }) {
    const [name, setName] = useState("");
    const [type, setType] = useState<"fixed" | "percentage">("percentage");
    const [value, setValue] = useState("");
    const [productId, setProductId] = useState<string>("all");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            type,
            value: Number(value),
            productId: productId === "all" ? null : Number(productId),
            startTime: startTime || null,
            endTime: endTime || null,
            daysOfWeek: selectedDays.join(","),
            active: 1
        });
    };

    const toggleDay = (day: number) => {
        setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    return (
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Buat Promo Otomatis</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">Nama Promo</label>
                    <Input placeholder="Contoh: Happy Hour Sore" value={name} onChange={e => setName(e.target.value)} required className="h-12 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 ml-1">Tipe Diskon</label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">Persentase (%)</SelectItem>
                                <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 ml-1">Nilai Diskon</label>
                        <Input type="number" placeholder="10" value={value} onChange={e => setValue(e.target.value)} required className="h-12 rounded-xl" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">Berlaku Untuk</label>
                    <Select value={productId} onValueChange={setProductId}>
                        <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Seluruh Produk</SelectItem>
                            {products.map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1 text-center block">Hari Aktif</label>
                    <div className="flex justify-between gap-1">
                        {["M", "S", "S", "R", "K", "J", "S"].map((day, i) => (
                            <Button
                                key={i}
                                type="button"
                                variant={selectedDays.includes(i) ? "default" : "outline"}
                                className={cn("w-10 h-10 p-0 rounded-full font-bold", selectedDays.includes(i) ? "bg-primary" : "text-slate-400")}
                                onClick={() => toggleDay(i)}
                            >
                                {day}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 ml-1">Jam Mulai (Opsional)</label>
                        <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 ml-1">Jam Berakhir</label>
                        <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                </div>

                <DialogFooter className="pt-4">
                    <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20">
                        {isPending ? "Menyimpan..." : "Aktifkan Promo"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

function VoucherForm({ onSubmit, isPending }: { onSubmit: (data: any) => void, isPending: boolean }) {
    const [code, setCode] = useState("");
    const [type, setType] = useState<"fixed" | "percentage">("fixed");
    const [value, setValue] = useState("");
    const [minPurchase, setMinPurchase] = useState("0");
    const [expiryDate, setExpiryDate] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            code: code.toUpperCase(),
            type,
            value: Number(value),
            minPurchase: Number(minPurchase),
            expiryDate: expiryDate || null,
            active: 1
        });
    };

    return (
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Buat Voucher Kode</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">Kode Voucher</label>
                    <Input placeholder="MISAL: DISKONAWAL" value={code} onChange={e => setCode(e.target.value.toUpperCase())} required className="h-12 rounded-xl font-mono uppercase tracking-widest" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 ml-1">Tipe</label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger className="h-12 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fixed">Potongan Harga (Rp)</SelectItem>
                                <SelectItem value="percentage">Persentase (%)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 ml-1">Nilai Potongan</label>
                        <Input type="number" placeholder="5000" value={value} onChange={e => setValue(e.target.value)} required className="h-12 rounded-xl" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">Minimal Belanja (Rp)</label>
                    <Input type="number" placeholder="0" value={minPurchase} onChange={e => setMinPurchase(e.target.value)} className="h-12 rounded-xl" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 ml-1">Tanggal Kadaluwarsa</label>
                    <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-12 rounded-xl" />
                </div>

                <DialogFooter className="pt-4">
                    <Button type="submit" disabled={isPending} className="w-full h-12 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                        {isPending ? "Menyimpan..." : "Buat Voucher"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
