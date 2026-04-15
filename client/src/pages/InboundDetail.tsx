import { useInboundSession, useAddInboundItem, useRemoveInboundItem, useCompleteInboundSession, useUploadInboundPhoto, useSaveInboundSignatures } from "@/hooks/use-inbound";
import { useProducts } from "@/hooks/use-products";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Plus, Search, Loader2, Trash2, Camera, User, CheckCircle2, History, Save, PackagePlus, FileCheck, ClipboardEdit, Sparkles, X, ChevronRight, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { SignaturePad } from "@/components/SignaturePad";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/use-role";

export default function InboundDetail() {
    const { id } = useParams();
    const sessionId = parseInt(id!);
    const [, setLocation] = useLocation();
    const { data: session, isLoading } = useInboundSession(sessionId);
    const { data: allProducts } = useProducts();
    const { isAdmin, isSKUManager } = useRole();
    const { toast } = useToast();

    const [search, setSearch] = useState("");
    const [addItemOpen, setAddItemOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [itemNotes, setItemNotes] = useState("");
    const [expiryDate, setExpiryDate] = useState<string>("");

    const [senderName, setSenderName] = useState("");
    const [receiverName, setReceiverName] = useState("");
    const [senderSignature, setSenderSignature] = useState("");
    const [receiverSignature, setReceiverSignature] = useState("");

    const addInboundItem = useAddInboundItem();
    const removeInboundItem = useRemoveInboundItem();
    const completeSession = useCompleteInboundSession();
    const uploadPhoto = useUploadInboundPhoto();
    const saveSignatures = useSaveInboundSignatures();

    const isCompleted = session?.status === "completed";
    const canModify = !isCompleted && (isAdmin || isSKUManager);

    // Sync state with session data when loaded
    useEffect(() => {
        if (session) {
            setSenderName(session.senderName || "");
            setReceiverName(session.receiverName || "");
            setSenderSignature(session.senderSignature || "");
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
        addInboundItem.mutate({
            sessionId,
            productId: selectedProduct,
            quantityReceived: quantity,
            notes: itemNotes,
            expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null
        }, {
            onSuccess: () => {
                setAddItemOpen(false);
                setSelectedProduct(null);
                setQuantity(1);
                setItemNotes("");
                setExpiryDate("");
                setSearch("");
                toast({ title: "Produk Ditambah", description: "Item telah masuk ke daftar penerimaan." });
            }
        });
    };

    const handleRemoveItem = (itemId: number) => {
        removeInboundItem.mutate({ sessionId, itemId });
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
            receiverName,
            senderSignature,
            receiverSignature
        }, {
            onSuccess: () => toast({ title: "Draft Disimpan", description: "Tanda tangan telah diperbarui." })
        });
    };

    const handleFinalize = () => {
        if (!senderName || !receiverName || !senderSignature || !receiverSignature) {
            toast({
                title: "Data Belum Lengkap",
                description: "Harap lengkapi nama dan tanda tangan pengirim & penerima untuk audit log.",
                variant: "destructive"
            });
            return;
        }

        completeSession.mutate(sessionId, {
            onSuccess: () => {
                toast({ title: "Sesi Selesai", description: "Penerimaan barang telah difinalisasi ke sistem stok." });
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
                        onClick={() => setLocation("/inbound")}
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
                                <PackagePlus className="w-4 h-4 text-primary" />
                                <span className="text-xs font-black uppercase tracking-tight text-slate-600">INBOUND SESSION</span>
                             </div>
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
                        className="rounded-2xl h-16 px-10 bg-emerald-600 text-white font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 hover:scale-105 transition-all"
                    >
                        {completeSession.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6 mr-3" />}
                        Selesaikan Penerimaan
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Side: Item List */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[40px] shadow-2xl shadow-black/5 overflow-hidden">
                        <div className="p-8 border-b border-white/20 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">Daftar Barang</h3>
                                <p className="text-sm text-slate-500 font-medium">Total {session.items.length} jenis produk diterima.</p>
                            </div>
                            {canModify && (
                                <Button 
                                    onClick={() => setAddItemOpen(true)} 
                                    className="rounded-xl h-12 px-6 bg-slate-900 text-white font-black hover:scale-105 transition-transform"
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Tambah Produk
                                </Button>
                            )}
                        </div>

                        <div className="divide-y divide-white/10">
                            {session.items.length === 0 ? (
                                <div className="p-24 text-center space-y-4">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                        <PackagePlus className="w-10 h-10 text-slate-200" />
                                    </div>
                                    <p className="text-slate-400 font-bold">Belum ada barang yang dicatat.</p>
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
                                                    <PackagePlus className="w-8 h-8 text-slate-100" />
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
                                                    <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                                                        <span className="text-[10px] font-black text-primary uppercase">Jumlah:</span>
                                                        <span className="text-lg font-black text-primary leading-none">{item.quantityReceived}</span>
                                                    </div>
                                                    {item.expiryDate && (
                                                        <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 text-amber-600">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] font-black uppercase">EXP: {new Date(item.expiryDate).toLocaleDateString("id-ID")}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {item.notes && (
                                                    <p className="text-xs bg-slate-50/50 p-2 px-3 rounded-lg border border-white italic text-slate-500">
                                                        "{item.notes}"
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions & Documentation */}
                                            <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                                                <div className="flex items-center gap-2 mr-4">
                                                    {item.photos.map((photo: any) => (
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

                {/* Right Side: Signatures & Evidence */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-6">
                    <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[40px] shadow-2xl shadow-black/5 overflow-hidden">
                        <div className="p-8 border-b border-white/20 flex items-center gap-3 bg-slate-900/5">
                            <FileCheck className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-black text-slate-900">Validasi Data</h3>
                        </div>

                        <div className="p-8 space-y-10">
                            {/* Sender Info */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Pihak Pengirim (Supplier/Driver)</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            value={senderName}
                                            onChange={(e) => setSenderName(e.target.value)}
                                            placeholder="Tulis nama pengirim..."
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

                            <div className="h-px bg-slate-100" />

                            {/* Receiver Info */}
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-2">Pihak Penerima (Staff Kazana)</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            value={receiverName}
                                            onChange={(e) => setReceiverName(e.target.value)}
                                            placeholder="Tulis nama penerima..."
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
                                <div className="pt-4">
                                    <Button 
                                        className="w-full h-16 rounded-2xl border-white/40 bg-white shadow-xl shadow-slate-100 font-black text-slate-800 transition-all hover:bg-slate-50 active:scale-95" 
                                        variant="outline" 
                                        onClick={handleSaveSignatures} 
                                        disabled={saveSignatures.isPending}
                                    >
                                        {saveSignatures.isPending ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Save className="w-5 h-5 mr-3" />}
                                        Simpan Draft Bukti
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Addition Dialog */}
            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                <DialogContent className="max-w-2xl rounded-[40px] border-white/20 shadow-2xl p-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-500" />
                    
                    <div className="space-y-8">
                        <DialogHeader>
                            <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-1">
                               <Sparkles className="w-4 h-4" />
                               Inventory Inbound
                            </div>
                            <DialogTitle className="text-3xl font-black text-slate-900">Tambah Produk Masuk</DialogTitle>
                            <p className="text-slate-500 font-medium">Cari dan pilih produk yang akan ditambahkan ke dalam sesi ini.</p>
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

                                {/* Search Results */}
                                {filteredProducts.length > 0 && !selectedProduct && (
                                    <div className="mt-2 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl shadow-black/5 divide-y divide-slate-50 animate-in slide-in-from-top-2 duration-300">
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
                                                        {p.photoUrl ? <img src={p.photoUrl} className="w-full h-full object-cover" /> : <PackagePlus className="w-6 h-6 text-slate-200" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800">{p.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.sku}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-primary transition-colors" />
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
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">PRODUK TERPILIH</p>
                                                <p className="text-xl font-black text-slate-800 leading-tight">
                                                    {allProducts?.find(p => p.id === selectedProduct)?.name}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => {setSelectedProduct(null); setSearch("");}} className="h-10 px-4 rounded-xl text-[10px] font-black text-slate-400 hover:text-red-500 bg-white/50 border-white hover:bg-red-50">GANTI</Button>
                                    </div>
                                )}
                            </div>

                            {/* Inputs */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Jumlah Diterima</label>
                                    <div className="relative">
                                        <ClipboardEdit className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <Input
                                            type="number"
                                            className="h-16 pl-12 bg-slate-50 border-slate-200 rounded-2xl text-2xl font-black text-slate-900"
                                            value={quantity}
                                            onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                            min={1}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Tanggal Expired (Jika ada)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <Input
                                            type="date"
                                            className="h-16 pl-12 bg-slate-50 border-slate-200 rounded-2xl font-bold text-slate-800"
                                            value={expiryDate}
                                            onChange={(e) => setExpiryDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Catatan Khusus Produk (Opsional)</label>
                                <Input
                                    value={itemNotes}
                                    onChange={(e) => setItemNotes(e.target.value)}
                                    placeholder="Contoh: Barang dalam kondisi baik, segel lengkap."
                                    className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-medium text-slate-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button variant="ghost" className="h-16 px-10 rounded-2xl font-bold text-slate-400" onClick={() => setAddItemOpen(false)}>Batal</Button>
                            <Button 
                                className="h-16 px-12 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl shadow-slate-200 hover:scale-105 transition-all" 
                                onClick={handleAddItem} 
                                disabled={!selectedProduct || addInboundItem.isPending}
                            >
                                {addInboundItem.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Tambahkan Produk"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
