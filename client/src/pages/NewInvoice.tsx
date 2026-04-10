import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useInvoices } from "@/hooks/use-invoices";
import { useProducts } from "@/hooks/use-products";
import { usePOS } from "@/hooks/use-pos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Minus, Trash2, Search, ArrowLeft, Save, Printer } from "lucide-react";
import { Link } from "wouter";
import InvoicePrinter from "@/components/InvoicePrinter";
import { format } from "date-fns";

export default function NewInvoice() {
    const [, setLocation] = useLocation();
    const { createInvoice } = useInvoices();
    const { data: products, isLoading: isLoadingProducts } = useProducts();
    const { customers, isLoadingCustomers } = usePOS();

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [dueDate, setDueDate] = useState<string>(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
    const [searchQuery, setSearchQuery] = useState("");
    const [cart, setCart] = useState<{ productId: number; name: string; quantity: number; unitPrice: number }[]>([]);
    const [lastInvoice, setLastInvoice] = useState<any>(null);

    const filteredProducts = useMemo(() => {
        if (!products) return [];
        return products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10);
    }, [products, searchQuery]);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                quantity: 1,
                unitPrice: Number(product.sellingPrice)
            }];
        });
    };

    const updateQty = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const totalAmount = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    }, [cart]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomerId || cart.length === 0) return;

        const invoiceData = {
            customerId: parseInt(selectedCustomerId),
            totalAmount,
            paymentMethod: "transfer", // Default for invoices
            paymentStatus: "pending",
            dueDate: new Date(dueDate),
            items: cart.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                subtotal: item.quantity * item.unitPrice
            }))
        };

        const result = await createInvoice.mutateAsync(invoiceData);
        setLastInvoice(result);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-enter pb-20">
            <div className="flex items-center gap-4">
                <Link href="/sales/invoices">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Buat Invoice Baru</h1>
                    <p className="text-muted-foreground mt-1">Gunakan untuk transaksi besar atau pesanan bertempo</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Kiri: Form & Item */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Pilih Pelanggan</Label>
                                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} required>
                                    <SelectTrigger className="h-12 rounded-xl">
                                        <SelectValue placeholder="Pilih pelanggan..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers?.map(c => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Jatuh Tempo</Label>
                                <Input
                                    type="date"
                                    className="h-12 rounded-xl"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Daftar Barang</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari produk..."
                                    className="pl-9 h-10 rounded-xl"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && filteredProducts.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-xl shadow-xl z-50 overflow-hidden">
                                        {filteredProducts.map(p => (
                                            <div
                                                key={p.id}
                                                className="p-3 hover:bg-accent cursor-pointer flex items-center justify-between border-b last:border-0"
                                                onClick={() => {
                                                    addToCart(p);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                <div>
                                                    <p className="font-bold text-sm">{p.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">{p.sku}</p>
                                                </div>
                                                <p className="text-sm font-bold text-primary">Rp {Number(p.sellingPrice).toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {cart.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    <p>Belum ada item. Cari dan tambahkan produk di atas.</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produk</TableHead>
                                            <TableHead className="w-[150px] text-center">Jumlah</TableHead>
                                            <TableHead className="text-right">Harga Satuan</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.map((item) => (
                                            <TableRow key={item.productId}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateQty(item.productId, -1)}>
                                                            <Minus className="w-3 h-3" />
                                                        </Button>
                                                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                                                        <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateQty(item.productId, 1)}>
                                                            <Plus className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    Rp {item.unitPrice.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-bold font-mono">
                                                    Rp {(item.quantity * item.unitPrice).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg" onClick={() => removeFromCart(item.productId)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Kolom Kanan: Ringkasan & Submit */}
                <div className="space-y-6">
                    <Card className="sticky top-24 border-primary/20 bg-primary/[0.02]">
                        <CardHeader>
                            <CardTitle className="text-lg">Ringkasan Invoice</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground font-medium">
                                    <span>Subtotal</span>
                                    <span>Rp {totalAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground font-medium">
                                    <span>PPN (0%)</span>
                                    <span>Rp 0</span>
                                </div>
                                <Separator className="my-4" />
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold">Total Tagihan</span>
                                    <span className="text-2xl font-display font-bold text-primary">
                                        Rp {totalAmount.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 mt-4"
                                disabled={!selectedCustomerId || cart.length === 0 || createInvoice.isPending}
                            >
                                {createInvoice.isPending ? (
                                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                ) : (
                                    <Save className="w-6 h-6 mr-2" />
                                )}
                                Simpan & Terbitkan
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </form>

            {lastInvoice && (
                <InvoicePrinter
                    invoice={lastInvoice}
                    onClose={() => setLocation("/sales/invoices")}
                />
            )}
        </div>
    );
}
