import { useBOM, useAddBOMItem, useRemoveBOMItem } from "@/hooks/use-production";
import { useProducts } from "@/hooks/use-products";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Plus, Search, Loader2, Trash2, Settings2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function BOMDetail() {
    const { id } = useParams();
    const bomId = parseInt(id!);
    const [, setLocation] = useLocation();
    const { data: bom, isLoading } = useBOM(bomId);
    const { data: allProducts } = useProducts();
    const { toast } = useToast();

    const [search, setSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<number>(1);

    const addBOMItem = useAddBOMItem();
    const removeBOMItem = useRemoveBOMItem();

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
        addBOMItem.mutate({
            bomId,
            productId: selectedProduct,
            quantityNeeded: quantity,
        }, {
            onSuccess: () => {
                setSelectedProduct(null);
                setQuantity(1);
                setSearch("");
                toast({ title: "Bahan Ditambahkan", description: "Bahan baku berhasil dimasukkan ke resep." });
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

    if (!bom) return <div className="p-8 text-center">BOM not found</div>;

    return (
        <div className="space-y-6 animate-enter pb-20">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setLocation("/production/boms")}>
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-display font-bold">{bom.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] uppercase font-mono">
                            Target: {bom.targetProduct.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">v{bom.version || "1.0"}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 py-4">
                            <CardTitle className="text-lg">Komponen Bahan Baku</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {bom.items.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground">
                                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>Belum ada bahan baku yang ditambahkan ke resep ini.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {bom.items.map((item) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden border">
                                                    {item.product.photoUrl ? (
                                                        <img src={item.product.photoUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-muted-foreground/30" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm leading-tight">{item.product.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{item.product.sku}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge variant="outline" className="px-3 py-1 font-mono">
                                                    {item.quantityNeeded} unit
                                                </Badge>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => removeBOMItem.mutate({ bomId, itemId: item.id })}
                                                    disabled={removeBOMItem.isPending}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
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
                                <Plus className="w-4 h-4 text-primary" />
                                Tambah Bahan Baku
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cari Produk</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="SKU atau Nama..."
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
                                                <Badge variant="outline" className="text-[10px]">Stok: {p.currentStock}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedProduct && (
                                    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-xl flex justify-between items-center animate-in zoom-in-95">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-primary" />
                                            <span className="text-sm font-bold truncate max-w-[120px]">{allProducts?.find(p => p.id === selectedProduct)?.name}</span>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)} className="h-7 text-[10px]">Ganti</Button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Kuantitas di Resep</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                                    min={0.1}
                                />
                            </div>

                            <Button 
                                className="w-full" 
                                onClick={handleAddItem} 
                                disabled={!selectedProduct || addBOMItem.isPending}
                            >
                                {addBOMItem.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Tambahkan ke Resep
                            </Button>
                        </CardContent>
                    </Card>

                    {bom.notes && (
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="py-3 bg-muted/20">
                                <CardTitle className="text-sm font-medium">Catatan Resep</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <p className="text-sm text-muted-foreground italic">"{bom.notes}"</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
