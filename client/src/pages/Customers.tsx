import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Users, Phone, Mail, Star, ShoppingBag, Calendar, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface CustomerWithStats {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    points: number;
    totalSpent: number;
    totalOrders: number;
    lastOrderDate: string | null;
}

export default function Customers() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: customers = [], isLoading } = useQuery<CustomerWithStats[]>({
        queryKey: [api.crm.customers.listWithStats.path],
    });

    const filteredCustomers = (customers || []).filter(c => {
        const name = c.name?.toLowerCase() || "";
        const search = searchTerm.toLowerCase();
        return name.includes(search) || (c.phone && c.phone.includes(searchTerm));
    });

    const openWhatsApp = (phone: string | null) => {
        if (!phone) return;
        // Clean phone number: remove +, spaces, etc.
        const cleanPhone = phone.replace(/\D/g, "");
        // If it starts with 0, replace with 62
        const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.substring(1) : cleanPhone;
        window.open(`https://wa.me/${formattedPhone}`, "_blank");
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Manajemen Pelanggan (CRM)
                    </h1>
                    <p className="text-slate-500 mt-1">Kelola data pelanggan, loyalitas, dan komunikasi WhatsApp Anda.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-indigo-50 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pelanggan</CardTitle>
                        <Users className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customers.length}</div>
                        <p className="text-xs text-slate-500">Pelanggan terdaftar</p>
                    </CardContent>
                </Card>
                <Card className="border-emerald-50 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Loyalitas</CardTitle>
                        <Star className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {customers.reduce((sum, c) => sum + (c.points || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500">Poin dikumpulkan seluruh pelanggan</p>
                    </CardContent>
                </Card>
                <Card className="border-amber-50 shadow-sm transition-all hover:shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Omzet Pelanggan</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            Rp {customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-slate-500">Total belanja dari pelanggan tetap</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200 shadow-xl overflow-hidden">
                <div className="p-4 border-b bg-slate-50/50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari nama atau nomor telepon..."
                            className="pl-9 bg-white border-slate-200 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold text-slate-800">Pelanggan</TableHead>
                                <TableHead className="font-bold text-slate-800">Loyalitas</TableHead>
                                <TableHead className="font-bold text-slate-800">Statistik Belanja</TableHead>
                                <TableHead className="font-bold text-slate-800">Terakhir Pesan</TableHead>
                                <TableHead className="text-right font-bold text-slate-800">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">Memuat data pelanggan...</TableCell>
                                </TableRow>
                            ) : filteredCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">Tidak ada pelanggan ditemukan.</TableCell>
                                </TableRow>
                            ) : (
                                filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm group-hover:scale-110 transition-transform">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 leading-tight">{customer.name}</p>
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        {customer.phone && (
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                <Phone className="h-3 w-3" /> {customer.phone}
                                                            </div>
                                                        )}
                                                        {customer.email && (
                                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                <Mail className="h-3 w-3" /> {customer.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1 w-fit">
                                                <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                                                {customer.points} Poin
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-bold text-slate-900">Rp {customer.totalSpent.toLocaleString()}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <ShoppingBag className="h-3 w-3" /> {customer.totalOrders} Pesanan
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm">
                                                    {(() => {
                                                        if (!customer.lastOrderDate) return "-";
                                                        try {
                                                            const d = new Date(customer.lastOrderDate);
                                                            if (isNaN(d.getTime())) return "-";
                                                            return format(d, "dd MMM yyyy", { locale: id });
                                                        } catch (err) {
                                                            return "-";
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="border-green-200 text-green-700 hover:bg-green-50 shadow-sm bg-white font-semibold flex items-center gap-1.5"
                                                onClick={() => openWhatsApp(customer.phone)}
                                                disabled={!customer.phone}
                                            >
                                                <MessageCircle className="h-4 w-4" />
                                                Sapa WA
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
