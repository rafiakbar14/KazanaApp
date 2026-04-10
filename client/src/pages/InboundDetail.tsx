import { useInboundSession, useAddInboundItem, useRemoveInboundItem, useCompleteInboundSession, useUploadInboundPhoto, useSaveInboundSignatures } from "@/hooks/use-inbound";
import { useProducts } from "@/hooks/use-products";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Plus, Search, Loader2, Trash2, Camera, User, CheckCircle2, History, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { SignaturePad } from "@/components/SignaturePad";
import { useState, useMemo } from "react";
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

    const [senderName, setSenderName] = useState(session?.senderName || "");
    const [receiverName, setReceiverName] = useState(session?.receiverName || "");
    const [senderSignature, setSenderSignature] = useState(session?.senderSignature || "");
    const [receiverSignature, setReceiverSignature] = useState(session?.receiverSignature || "");

    const addInboundItem = useAddInboundItem();
    const removeInboundItem = useRemoveInboundItem();
    const completeSession = useCompleteInboundSession();
    const uploadPhoto = useUploadInboundPhoto();
    const saveSignatures = useSaveInboundSignatures();

    const isCompleted = session?.status === "completed";
    const canModify = !isCompleted && (isAdmin || isSKUManager);

    // Sync state with session data when loaded
    useMemo(() => {
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
            p.sku.toLowerCase().includes(searchLower)
        ).slice(0, 10);
    }, [allProducts, search]);

    const handleAddItem = () => {
        if (!selectedProduct || quantity <= 0) return;
        addInboundItem.mutate({
            sessionId,
            productId: selectedProduct,
            quantityReceived: quantity,
            notes: itemNotes
        }, {
            onSuccess: () => {
                setAddItemOpen(false);
                setSelectedProduct(null);
                setQuantity(1);
                setItemNotes("");
                setSearch("");
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
        });
    };

    const handleFinalize = () => {
        if (!senderName || !receiverName || !senderSignature || !receiverSignature) {
            toast({
                title: "Data Belum Lengkap",
                description: "Harap isi nama dan tanda tangan pengirim & penerima.",
                variant: "destructive"
            });
            return;
        }

        completeSession.mutate(sessionId, {
            onSuccess: () => {
                toast({ title: "Sesi Selesai", description: "Penerimaan barang telah difinalisasi." });
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

    if (!session) return <div>Session not found</div>;

    return (
        <div className="space-y-6 animate-enter pb-20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setLocation("/inbound")}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-display font-bold">{session.title}</h1>
                            <StatusBadge status={session.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">{session.notes || "No notes"}</p>
                    </div>
                </div>
                {!isCompleted && canModify && (
                    <Button onClick={handleFinalize} disabled={completeSession.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Finalisasi Penerimaan
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                            <CardTitle className="text-lg">Daftar Barang Diterima</CardTitle>
                            {canModify && (
                                <Button size="sm" onClick={() => setAddItemOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tambah Produk
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {session.items.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    Belum ada barang yang ditambahkan.
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {session.items.map((item) => (
                                        <div key={item.id} className="py-4 flex flex-col gap-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-3">
                                                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                                        {item.product.photoUrl ? (
                                                            <img src={item.product.photoUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Search className="w-6 h-6 text-muted-foreground/30" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{item.product.name}</p>
                                                        <p className="text-xs text-muted-foreground font-mono">{item.product.sku}</p>
                                                        <Badge variant="secondary" className="mt-1">
                                                            Penerimaan: {item.quantityReceived}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {canModify && (
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveItem(item.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>

                                            {item.notes && (
                                                <p className="text-xs bg-muted/50 p-2 rounded-md italic">"{item.notes}"</p>
                                            )}

                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {item.photos.map((photo: any) => (
                                                    <div key={photo.id} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                                                        <img src={photo.url} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                                {canModify && (
                                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-dashed border-primary/20 flex items-center justify-center hover:bg-primary/5 transition-colors">
                                                        <Camera className="w-6 h-6 text-primary/40" />
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
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Bukti Penerimaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nama Pengirim (Supplier/Driver)</label>
                                    <Input
                                        value={senderName}
                                        onChange={(e) => setSenderName(e.target.value)}
                                        placeholder="Contoh: Budi (Gudang Pusat)"
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

                            <div className="border-t border-border/50 pt-6 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nama Penerima (Staff)</label>
                                    <Input
                                        value={receiverName}
                                        onChange={(e) => setReceiverName(e.target.value)}
                                        placeholder="Contoh: Siti"
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Barang Masuk</DialogTitle>
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
                                <div className="mt-2 border rounded-xl overflow-hidden divide-y bg-card shadow-lg">
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
                                                <p className="text-[10px] text-muted-foreground font-mono uppercase">{p.sku}</p>
                                            </div>
                                            <Badge variant="outline" className="text-[10px]">Stok: {p.currentStock}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {selectedProduct && (
                                <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-xl flex justify-between items-center">
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
                                <label className="text-sm font-medium">Jumlah Diterima</label>
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
                                placeholder="Contoh: Kondisi dus sedikit penyok"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddItemOpen(false)}>Batal</Button>
                        <Button onClick={handleAddItem} disabled={!selectedProduct || addInboundItem.isPending}>
                            {addInboundItem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Tambah ke Daftar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
