import { useOutboundSession, useAddOutboundItem, useRemoveOutboundItem, useCompleteOutboundSession, useUploadOutboundPhoto, useSaveOutboundSignatures } from "@/hooks/use-outbound";
import { useProducts } from "@/hooks/use-products";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Plus, Search, Loader2, Trash2, Camera, CheckCircle2, Save, Truck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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

    // Initial sync
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
            p.sku.toLowerCase().includes(searchLower)
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
                toast({ title: "Item Ditambahkan", description: "Produk berhasil dimasukkan ke daftar outbound." });
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
        });
    };

    const handleFinalize = () => {
        if (!senderName || !driverName || !senderSignature || !driverSignature) {
            toast({
                title: "Data Belum Lengkap",
                description: "Harap isi nama dan tanda tangan pengirim & driver sebagai syarat pengiriman.",
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
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!session) return <div className="p-8 text-center">Session not found</div>;

    return (
        <div className="space-y-6 animate-enter pb-20">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setLocation("/outbound")}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-display font-bold">{session.title}</h1>
                            <StatusBadge status={session.status} />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{session.notes || "Tidak ada catatan."}</p>
                        {session.toBranch && (
                            <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded w-fit mt-1 border border-primary/10">
                                <Store className="w-3 h-3" />
                                Tujuan: {session.toBranch.name}
                            </div>
                        )}
                    </div>
                </div>
                {!isCompleted && canModify && (
                    <Button onClick={handleFinalize} disabled={completeSession.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Finalisasi Pengiriman
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/30">
                            <CardTitle className="text-lg">Daftar Barang Keluar</CardTitle>
                            {canModify && (
                                <Button size="sm" onClick={() => setAddItemOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tambah Produk
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            {session.items.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground">
                                    <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>Belum ada barang yang ditambahkan.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {session.items.map((item) => (
                                        <div key={item.id} className="p-4 flex flex-col gap-3 hover:bg-muted/10 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-16 bg-muted rounded-xl flex items-center justify-center overflow-hidden border">
                                                        {item.product.photoUrl ? (
                                                            <img src={item.product.photoUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Search className="w-6 h-6 text-muted-foreground/30" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg leading-tight">{item.product.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">{item.product.sku}</p>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="px-3 py-0.5">
                                                                Keluar: {item.quantityShipped}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                                {canModify && (
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveItem(item.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {item.notes && (
                                                <div className="bg-muted/50 p-3 rounded-lg border-l-2 border-primary/30">
                                                    <p className="text-xs italic text-muted-foreground">"{item.notes}"</p>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {item.photos?.map((photo: any) => (
                                                    <div key={photo.id} className="group relative w-20 h-20 rounded-xl overflow-hidden border shadow-sm">
                                                        <img src={photo.url} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                {canModify && (
                                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-primary/20 flex flex-col items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer group">
                                                        <Camera className="w-6 h-6 text-primary/40 group-hover:text-primary transition-colors" />
                                                        <span className="text-[10px] text-primary/40 group-hover:text-primary mt-1 font-medium">Foto</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            onChange={(e) => handlePhotoUpload(item.id, e)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="bg-muted/30 py-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Save className="w-4 h-4 text-primary" />
                                Bukti Digital Pengiriman
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {/* PENGIRIM */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold flex items-center gap-2">
                                        <div className="w-5 h-5 bg-primary/10 rounded flex items-center justify-center text-[10px] text-primary">1</div>
                                        Nama Pengirim (Admin/Staff)
                                    </label>
                                    <Input
                                        value={senderName}
                                        onChange={(e) => setSenderName(e.target.value)}
                                        placeholder="Nama staf yang melepas barang"
                                        readOnly={!canModify && isCompleted}
                                    />
                                </div>
                                <SignaturePad
                                    label="Tanda Tangan Pengirim"
                                    defaultValue={senderSignature}
                                    onSave={setSenderSignature}
                                    readOnly={!canModify && isCompleted}
                                />
                            </div>

                            {/* DRIVER */}
                            <div className="border-t border-border/50 pt-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold flex items-center gap-2">
                                        <div className="w-5 h-5 bg-primary/10 rounded flex items-center justify-center text-[10px] text-primary">2</div>
                                        Nama Driver / Kurir
                                    </label>
                                    <Input
                                        value={driverName}
                                        onChange={(e) => setDriverName(e.target.value)}
                                        placeholder="Nama sopir pembawa barang"
                                        readOnly={!canModify && isCompleted}
                                    />
                                </div>
                                <SignaturePad
                                    label="Tanda Tangan Driver"
                                    defaultValue={driverSignature}
                                    onSave={setDriverSignature}
                                    readOnly={!canModify && isCompleted}
                                />
                            </div>

                            {/* PENERIMA */}
                            <div className="border-t border-border/50 pt-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold flex items-center gap-2">
                                        <div className="w-5 h-5 bg-primary/10 rounded flex items-center justify-center text-[10px] text-primary">3</div>
                                        Nama Penerima (Tujuan)
                                    </label>
                                    <Input
                                        value={receiverName}
                                        onChange={(e) => setReceiverName(e.target.value)}
                                        placeholder="Isi saat barang sudah sampai"
                                        readOnly={!canModify && isCompleted}
                                    />
                                </div>
                                <SignaturePad
                                    label="Tanda Tangan Penerima"
                                    defaultValue={receiverSignature}
                                    onSave={setReceiverSignature}
                                    readOnly={!canModify && isCompleted}
                                />
                            </div>

                            {canModify && (
                                <Button className="w-full" variant="outline" onClick={handleSaveSignatures} disabled={saveSignatures.isPending}>
                                    {saveSignatures.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Simpan Bukti (Draft)
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Barang Keluar</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Cari Produk (SKU / Nama)</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Ketik untuk mencari..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            {filteredProducts.length > 0 && !selectedProduct && (
                                <div className="mt-2 border rounded-xl overflow-hidden divide-y bg-card shadow-lg max-h-48 overflow-y-auto">
                                    {filteredProducts.map(p => (
                                        <div
                                            key={p.id}
                                            className="p-3 hover:bg-primary/5 cursor-pointer flex justify-between items-center transition-colors"
                                            onClick={() => {
                                                setSelectedProduct(p.id);
                                                setSearch(p.name);
                                            }}
                                        >
                                            <div>
                                                <p className="font-bold text-sm">{p.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{p.sku}</p>
                                            </div>
                                            <Badge variant="outline" className={cn("text-[10px]", p.currentStock <= 5 ? "text-orange-600 border-orange-200 bg-orange-50" : "")}>
                                                Stok: {p.currentStock}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {selectedProduct && (
                                <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-xl flex justify-between items-center animate-in zoom-in-95">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-bold">{allProducts?.find(p => p.id === selectedProduct)?.name}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)} className="h-7 text-[10px]">Ganti</Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Jumlah Pengiriman</label>
                                <Input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                    min={1}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Catatan Barang (Opsional)</label>
                            <Input
                                value={itemNotes}
                                onChange={(e) => setItemNotes(e.target.value)}
                                placeholder="Misal: Barang titipan, retur, dll"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setAddItemOpen(false)}>Batal</Button>
                        <Button onClick={handleAddItem} disabled={!selectedProduct || addOutboundItem.isPending}>
                            {addOutboundItem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Tambah ke Daftar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
