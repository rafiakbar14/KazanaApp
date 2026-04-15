import { useOutboundSession, useAddOutboundItem, useRemoveOutboundItem, useCompleteOutboundSession, useUploadOutboundPhoto, useSaveOutboundSignatures } from "@/hooks/use-outbound";
import { useProducts } from "@/hooks/use-products";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Plus, Search, Loader2, Trash2, Camera, CheckCircle2, Save, Truck, Store, PackageMinus, MapPin, History, Sparkles, ChevronRight, X, UserCheck, User, ShieldCheck, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { SignaturePad } from "@/components/SignaturePad";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { cn } from "@/lib/utils";

export default function OutboundDetail() {
    const { id } = useParams();
    const sessionId = parseInt(id!);
    const [, setLocation] = useLocation();
    const { data: session, isLoading } = useOutboundSession(sessionId);
    const { data: allProducts } = useProducts();
    const { isAdmin, isSKUManager, isDriver } = useRole();
    const { toast } = useToast();

    const [search, setSearch] = useState("");
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [itemNotes, setItemNotes] = useState("");

    const [senderName, setSenderName] = useState("");
    const [driverName, setDriverName] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [senderSignature, setSenderSignature] = useState("");
    const [driverSignature, setDriverSignature] = useState("");
    const [receiverSignature, setReceiverSignature] = useState("");

    const addOutboundItem = useAddOutboundItem();
    const removeOutboundItem = useRemoveOutboundItem();
    const completeSession = useCompleteOutboundSession();
    const uploadPhoto = useUploadOutboundPhoto();
    const saveSignatures = useSaveOutboundSignatures();

    const isCompleted = session?.status === "shipped" || session?.status === "received";
    const canModify = !isCompleted && (isAdmin || isSKUManager || isDriver);

    // Sync state with session data when loaded
    useEffect(() => {
        if (session) {
            setSenderName(session.senderName || "");
            setDriverName(session.driverName || "");
            setReceiverName(session.receiverName || "");
            setSenderSignature(session.senderSignature || "");
            setDriverSignature(session.driverSignature || "");
            setReceiverSignature(session.receiverSignature || "");
        }
    }, [session]);

    const filteredProducts = useMemo(() => {
        if (!allProducts || !search) return [];
        const searchLower = search.toLowerCase();
        return allProducts.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            p.sku.toLowerCase().includes(searchLower) ||
            (p.productCode && p.productCode.toLowerCase().includes(searchLower))
        ).slice(0, 10);
    }, [allProducts, search]);

    const handleAddItem = () => {
        if (!selectedProduct || quantity <= 0) return;
        addOutboundItem.mutate({
            sessionId,
            productId: selectedProduct,
            quantityShipped: quantity,
            notes: itemNotes
        }, {
            onSuccess: () => {
                setAddItemOpen(false);
                setSelectedProduct(null);
                setQuantity(1);
                setItemNotes("");
                setSearch("");
                toast({ title: "Produk Ditambah", description: "Item telah masuk ke daftar pengiriman." });
            }
        });
    };

    const handleRemoveItem = (itemId: number) => {
        removeOutboundItem.mutate({ sessionId, itemId });
    };

    const handlePhotoUpload = (itemId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadPhoto.mutate({ sessionId, itemId, file });
    };

    const handleSaveSignatures = () => {
        saveSignatures.mutate({
            id: sessionId,
            senderName,
            driverName,
            receiverName,
            senderSignature,
            driverSignature,
            receiverSignature
        }, {
            onSuccess: () => toast({ title: "Draft Disimpan", description: "Tanda tangan telah diperbarui." })
        });
    };

    const handleFinalize = () => {
        if (!senderName || !driverName || !senderSignature || !driverSignature) {
            toast({
                title: "Data Belum Lengkap",
                description: "Harap isi nama dan tanda tangan pengirim & driver sebagai bukti audit log.",
                variant: "destructive"
            });
            return;
        }

        completeSession.mutate(sessionId, {
            onSuccess: () => {
                toast({ title: "Pengiriman Selesai", description: "Status pengiriman telah diperbarui dan stok telah dikurangi." });
            }
        });
    };

    if (isLoading) {
        return (
            <div className="space-y-8 animate-enter pb-12">
                <div className="flex items-center gap-5">
                    <Loader2 className="w-12 h-12 rounded-2xl animate-spin text-primary" />
                    <div className="space-y-3">
                        <div className="h-8 w-64 bg-slate-100 rounded-lg animate-pulse" />
                        <div className="h-4 w-32 bg-slate-50 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[60vh] bg-slate-50/50 rounded-[40px] animate-pulse" />
                    <div className="h-[60vh] bg-slate-50/50 rounded-[40px] animate-pulse" />
                </div>
            </div>
        );
    }

    if (!session) return <div className="p-20 text-center font-black text-slate-400">SESSION NOT FOUND</div>;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-6">
                    <button 
                        onClick={() => setLocation("/outbound")}
                        className="group flex items-center gap-2 text-slate-400 hover:text-primary transition-colors font-black text-[10px] uppercase tracking-[0.2em]"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                        Kembali
                    </button>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 flex-wrap">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">{session.title}</h1>
                            <StatusBadge status={session.status} className="scale-110" />
                        </div>
                        <div className="flex items-center gap-6 text-slate-400">
                             <div className="flex items-center gap-2 bg-white/50 backdrop-blur px-3 py-1.5 rounded-full border border-white shadow-sm">
                                <Truck className="w-4 h-4 text-primary" />
                                <span className="text-xs font-black uppercase tracking-tight text-slate-600">OUTBOUND LOGISTICS</span>
                             </div>
                             {session.toBranch && (
                                <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 shadow-sm text-orange-600">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="text-xs font-black uppercase tracking-tight">KE: {session.toBranch.name}</span>
                                </div>
                             )}
                             <span className="text-sm font-bold flex items-center gap-2">
                                <History className="w-4 h-4" />
                                {new Date(session.startedAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                             </span>
                        </div>
                    </div>
                </div>

                {!isCompleted && canModify && (
                    <Button 
                        onClick={handleFinalize} 
                        disabled={completeSession.isPending} 
                        className="rounded-2xl h-16 px-10 bg-slate-900 text-white font-black shadow-xl shadow-slate-100 hover:scale-105 transition-all"
                    >
                        {completeSession.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Truck className="w-6 h-6 mr-3" />}
                        Selesaikan & Kirim
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Left Side: Outbound Item List */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[40px] shadow-2xl shadow-black/5 overflow-hidden">
                        <div className="p-8 border-b border-white/20 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Daftar Pengiriman</h3>
                                <p className="text-sm text-slate-500 font-medium">Total {session.items.length} jenis produk keluar.</p>
                            </div>
                            {canModify && (
                                <Button 
                                    onClick={() => setAddItemOpen(true)} 
                                    className="rounded-xl h-12 px-6 bg-primary text-white font-black hover:scale-105 transition-transform shadow-lg shadow-primary/20"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Tambah Barang
                                </Button>
                            )}
                        </div>

                        <div className="divide-y divide-white/10">
                            {session.items.length === 0 ? (
                                <div className="p-24 text-center space-y-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                        <PackageMinus className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-bold">Belum ada barang yang didaftarkan.</p>
                                </div>
                            ) : (
                                session.items.map((item) => (
                                    <div key={item.id} className="p-8 group hover:bg-white/40 transition-all duration-300">
                                        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                                            {/* Product Image */}
                                            <div className="w-24 h-24 bg-white rounded-3xl border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                                {item.product.photoUrl ? (
                                                    <img src={item.product.photoUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <PackageMinus className="w-8 h-8 text-slate-100" />
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h4 className="text-xl font-black text-slate-800">{item.product.name}</h4>
                                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-400">
                                                        {item.product.sku}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                                                        <span className="text-[10px] font-black text-orange-600 uppercase">KELUAR:</span>
                                                        <span className="text-lg font-black text-orange-600 leading-none">{item.quantityShipped}</span>
                                                    </div>
                                                </div>
                                                {item.notes && (
                                                    <p className="text-xs bg-slate-50/50 p-2 px-3 rounded-lg border border-white italic text-slate-500">
                                                        "{item.notes}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Documentation */}
                                            <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                                                <div className="flex items-center gap-2 mr-4">
                                                    {item.photos?.map((photo: any) => (
                                                        <div key={photo.id} className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-zoom-in">
                                                            <img src={photo.url} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                    {canModify && (
                                                        <label className="w-14 h-14 rounded-2xl bg-white border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                                                            <Camera className="w-6 h-6" />
                                                            <input type="file" className="hidden" capture="environment" accept="image/*" onChange={(e) => handlePhotoUpload(item.id, e)} />
                                                        </label>
                                                    )}
                                                </div>
                                                {canModify && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="w-12 h-12 rounded-2xl text-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Triple Validation Pad */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[40px] shadow-2xl shadow-black/5 overflow-hidden">
                        <div className="p-8 border-b border-white/20 bg-slate-900/5">
                            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                Verifikasi 3 Tahap
                            </h3>
                        </div>

                        <div className="p-8 space-y-12">
                            {/* PENGIRIM */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">1. STAFF GUDANG (ASAL)</label>
                                    <div className="relative group">
                                        <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            value={senderName}
                                            onChange={(e) => setSenderName(e.target.value)}
                                            placeholder="Nama staf pengirim..."
                                            className="h-14 pl-12 bg-white/50 border-white/20 rounded-2xl font-bold text-slate-800 focus:ring-primary shadow-inner"
                                            readOnly={!canModify && isCompleted}
                                        />
                                    </div>
                                </div>
                                <SignaturePad
                                    label="Tanda Tangan Pengirim"
                                    defaultValue={senderSignature}
                                    onSave={(sig) => setSenderSignature(sig)}
                                    readOnly={!canModify && isCompleted}
                                />
                            </div>

                            {/* DRIVER */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">2. DRIVER / EKSPEDISI</label>
                                    <div className="relative group">
                                        <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            value={driverName}
                                            onChange={(e) => setDriverName(e.target.value)}
                                            placeholder="Nama sopir pembawa..."
                                            className="h-14 pl-12 bg-white/50 border-white/20 rounded-2xl font-bold text-slate-800 focus:ring-primary shadow-inner"
                                            readOnly={!canModify && isCompleted}
                                        />
                                    </div>
                                </div>
                                <SignaturePad
                                    label="Tanda Tangan Driver"
                                    defaultValue={driverSignature}
                                    onSave={(sig) => setDriverSignature(sig)}
                                    readOnly={!canModify && isCompleted}
                                />
                            </div>

                            {/* PENERIMA (Completed at destination) */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">3. PENERIMA (TUJUAN)</label>
                                    <div className="relative group">
                                        <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            value={receiverName}
                                            onChange={(e) => setReceiverName(e.target.value)}
                                            placeholder="Tulis saat barang diterima..."
                                            className="h-14 pl-12 bg-white/50 border-white/20 rounded-2xl font-bold text-slate-800 focus:ring-primary shadow-inner"
                                            readOnly={!canModify && isCompleted}
                                        />
                                    </div>
                                </div>
                                <SignaturePad
                                    label="Tanda Tangan Penerima"
                                    defaultValue={receiverSignature}
                                    onSave={(sig) => setReceiverSignature(sig)}
                                    readOnly={!canModify && isCompleted}
                                />
                            </div>

                            {canModify && (
                                <div className="pt-4 border-t border-slate-100">
                                    <Button 
                                        className="w-full h-16 rounded-2xl border-white/40 bg-white shadow-xl shadow-slate-100 font-black text-slate-800 transition-all hover:bg-slate-50 active:scale-95" 
                                        variant="outline" 
                                        onClick={handleSaveSignatures} 
                                        disabled={saveSignatures.isPending}
                                    >
                                        {saveSignatures.isPending ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3 text-primary" />}
                                        Simpan Bukti (Draft)
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Outbound Addition Dialog */}
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                <DialogContent className="max-w-2xl rounded-[40px] border-white/20 shadow-2xl p-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-orange-500" />
                    
                    <div className="space-y-8">
                        <DialogHeader>
                            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-1">
                               <Sparkles className="w-4 h-4" />
                               Outbound Preparation
                            </div>
                            <DialogTitle className="text-3xl font-black text-slate-900">Siapkan Barang Keluar</DialogTitle>
                            <p className="text-slate-500 font-medium leading-relaxed">Cari produk dan tentukan jumlah yang akan dikeluarkan dari stok gudang ini.</p>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Search Product */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Cari Nama / SKU Produk</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <Input
                                        placeholder="Ketik minimal 2 karakter..."
                                        className="h-16 pl-12 bg-slate-50 border-slate-200 rounded-2xl text-lg font-black text-slate-800"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onFocus={() => setSelectedProduct(null)}
                                    />
                                    {search && (
                                        <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                                            <X className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                {/* Results */}
                                {filteredProducts.length > 0 && !selectedProduct && (
                                    <div className="mt-2 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl shadow-black/5 divide-y divide-slate-50 animate-in slide-in-from-top-2 duration-300 max-h-60 overflow-y-auto custom-scrollbar">
                                        {filteredProducts.map(p => (
                                            <div
                                                key={p.id}
                                                className="p-5 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors group"
                                                onClick={() => {
                                                    setSelectedProduct(p.id);
                                                    setSearch(p.name);
                                                }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                                                        {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover" /> : <PackageMinus className="w-6 h-6 text-slate-200" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800">{p.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.sku}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={cn("rounded-full px-3 py-1 font-black transition-colors", p.currentStock <= 5 ? "bg-red-50 text-red-500 border-red-100" : "bg-slate-50 text-slate-500")}>Stok: {p.currentStock}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Selected State */}
                                {selectedProduct && (
                                    <div className="mt-4 p-6 bg-primary/5 border border-primary/20 rounded-3xl flex items-center justify-between animate-in zoom-in-95 duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-white rounded-2xl border border-primary/20 flex items-center justify-center shadow-sm">
                                                <CheckCircle2 className="w-8 h-8 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">PRODUK TERPILIH</p>
                                                <p className="text-xl font-black text-slate-800 leading-tight">
                                                    {allProducts?.find(p => p.id === selectedProduct)?.name}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => {setSelectedProduct(null); setSearch("");}} className="h-10 px-4 rounded-xl text-[10px] font-black text-slate-400 hover:text-red-500 bg-white/50 border-white">GANTI</Button>
                                    </div>
                                )}
                            </div>

                            {/* Qty Input */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Jumlah Pengeluaran</label>
                                <div className="relative">
                                    <ClipboardCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                    <Input
                                        type="number"
                                        className="h-16 pl-12 bg-slate-50 border-slate-200 rounded-2xl text-2xl font-black text-slate-900"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                        min={1}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Unit / Pcs
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Catatan Pengeluaran (Opsional)</label>
                                <Input
                                    value={itemNotes}
                                    onChange={(e) => setItemNotes(e.target.value)}
                                    placeholder="Misal: Barang titipan, retur produksi, dsb..."
                                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="ghost" className="h-16 px-10 rounded-2xl font-bold text-slate-400" onClick={() => setAddItemOpen(false)}>Batal</Button>
                            <Button 
                                className="h-16 px-12 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-200 hover:scale-105 transition-all" 
                                onClick={handleAddItem} 
                                disabled={!selectedProduct || addOutboundItem.isPending}
                            >
                                {addOutboundItem.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Tambahkan untuk Dikirim"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
