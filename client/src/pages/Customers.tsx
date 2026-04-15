import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { 
  Users, 
  Phone, 
  Mail, 
  Star, 
  ShoppingBag, 
  Calendar, 
  MessageCircle, 
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  BrainCircuit,
  Award,
  Clock,
  ChevronRight,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Coins,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
    const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
    const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<CustomerWithStats | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
        const cleanPhone = phone.replace(/\D/g, "");
        const formattedPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.substring(1) : cleanPhone;
        window.open(`https://wa.me/${formattedPhone}`, "_blank");
    };

    const getCustomerTag = (customer: CustomerWithStats) => {
        if (customer.totalSpent > 1000000) return { label: "VIP", color: "bg-amber-100 text-amber-700 border-amber-200" };
        if (customer.totalOrders > 5) return { label: "LOYALIST", color: "bg-blue-100 text-blue-700 border-blue-200" };
        return { label: "REGULAR", color: "bg-slate-100 text-slate-700 border-slate-200" };
    };

    const LoyaltyHistoryDialog = ({ customer }: { customer: CustomerWithStats | null }) => {
        const { data: history = [], isLoading: isLoadingHistory } = useQuery<any[]>({
            queryKey: [api.crm.customers.loyaltyHistory.path.replace(":id", customer?.id.toString() || "")],
            enabled: !!customer && isHistoryOpen,
        });

        return (
            <DialogContent className="max-w-2xl rounded-[2.5rem] bg-slate-50 border-0 p-0 overflow-hidden shadow-2xl">
                <div className="bg-indigo-600 p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                            <History className="w-8 h-8" />
                            Riwayat Poin
                        </DialogTitle>
                    </DialogHeader>
                    {customer && (
                        <div className="mt-6 flex items-end justify-between">
                            <div>
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Pelanggan</p>
                                <h2 className="text-xl font-black uppercase">{customer.name}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Saldo Saat Ini</p>
                                <div className="flex items-center gap-2 text-3xl font-black">
                                    <Coins className="w-6 h-6 text-amber-400" />
                                    {customer.points.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto">
                    {isLoadingHistory ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mengambil data ledger...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-20 text-center text-gray-400 space-y-4">
                            <AlertCircle className="w-16 h-16 mx-auto opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest">Belum ada riwayat poin</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center",
                                            item.action === 'earned' ? "bg-emerald-50 text-emerald-600" : 
                                            item.action === 'spent' ? "bg-blue-50 text-blue-600" : "bg-red-50 text-red-600"
                                        )}>
                                            {item.action === 'earned' ? <ArrowUpRight className="w-6 h-6" /> : 
                                             item.action === 'spent' ? <ArrowDownLeft className="w-6 h-6" /> : <History className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-tight">
                                                {item.action === 'earned' ? "Poin Didapat" : 
                                                 item.action === 'spent' ? "Penukaran Poin" : "Poin Dibatalkan"}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">
                                                {format(new Date(item.createdAt), "dd MMMM yyyy HH:mm", { locale: id })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-lg font-black",
                                            item.pointsDelta > 0 ? "text-emerald-600" : "text-red-600"
                                        )}>
                                            {item.pointsDelta > 0 ? "+" : ""}{item.pointsDelta}
                                        </p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest max-w-[150px] truncate">
                                            {item.note || "Transaksi POS"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <Users className="w-10 h-10 text-indigo-600 bg-indigo-50 p-2 rounded-2xl" />
                        Customer Relationship (CRM)
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Beralih dari sekadar tabel ke sistem pengenalan habit pelanggan.</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border shadow-sm">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("rounded-xl transition-all duration-300", viewMode === "grid" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500")}
                        onClick={() => setViewMode("grid")}
                    >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Grid Cards
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className={cn("rounded-xl transition-all duration-300", viewMode === "table" ? "bg-indigo-600 text-white shadow-lg" : "text-gray-500")}
                        onClick={() => setViewMode("table")}
                    >
                        <List className="w-4 h-4 mr-2" />
                        Classic Table
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                             <div className="p-3 bg-indigo-50 rounded-2xl group-hover:scale-110 transition-transform"><Users className="w-5 h-5 text-indigo-600" /></div>
                             <Badge variant="outline" className="bg-indigo-50 border-none text-indigo-600">+12%</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Base Pelanggan</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">{customers.length}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                             <div className="p-3 bg-emerald-50 rounded-2xl group-hover:scale-110 transition-transform"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
                             <Badge variant="outline" className="bg-emerald-50 border-none text-emerald-600">Stable</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Rata-rata Belanja (AOV)</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">
                                Rp {customers.length > 0 ? (customers.reduce((s,c) => s + c.totalSpent, 0) / customers.length).toLocaleString() : 0}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                             <div className="p-3 bg-amber-50 rounded-2xl group-hover:scale-110 transition-transform"><Award className="w-5 h-5 text-amber-600" /></div>
                        </div>
                        <div className="mt-4">
                            <p className="text-gray-400 text-xs font-bold tracking-widest uppercase">Loyalty Points</p>
                            <h3 className="text-3xl font-black text-gray-900 mt-1">
                                {customers.reduce((sum, c) => sum + (c.points || 0), 0).toLocaleString()} <span className="text-sm font-semibold text-gray-400">Pts</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-xl shadow-indigo-900/10 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-3xl overflow-hidden group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                             <div className="p-3 bg-white/10 rounded-2xl"><BrainCircuit className="w-5 h-5" /></div>
                             <Badge variant="outline" className="bg-white/20 border-none text-white text-[10px]">AI INSIGHT</Badge>
                        </div>
                        <div className="mt-4">
                            <p className="opacity-70 text-xs font-bold tracking-widest uppercase">Retention Rate</p>
                            <h3 className="text-3xl font-black mt-1">84.2%</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Area */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 group-focus-within:scale-110 transition-all" />
                    <Input 
                        placeholder="Ketik nama pelanggan atau nomor handphone..." 
                        className="pl-12 h-14 bg-white border-0 shadow-lg shadow-gray-200/50 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-100"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-200">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Daftarkan Baru
                </Button>
            </div>

            {/* Content Area */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.map((customer) => {
                        const tag = getCustomerTag(customer);
                        return (
                            <Card key={customer.id} className="border-0 shadow-xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden group hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 bg-white">
                                <CardContent className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center text-3xl font-black text-gray-900 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                            {customer.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                             <Badge className={cn("rounded-full px-3 py-1 font-black text-[10px] tracking-widest border-2", tag.color)}>
                                                 {tag.label}
                                             </Badge>
                                             <div className="flex text-amber-400">
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                             </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{customer.name}</h3>
                                            <div className="flex items-center gap-2 text-gray-400 font-medium mt-1">
                                                <Phone className="w-3 h-3" />
                                                <span className="text-xs">{customer.phone || "-"}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed border-gray-100">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Belanja</p>
                                                <p className="text-lg font-black text-gray-900">Rp {customer.totalSpent.toLocaleString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Poin Saya</p>
                                                <p className="text-lg font-black text-amber-600">{customer.points} <span className="text-[10px]">Pts</span></p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                Terakhir: {customer.lastOrderDate ? format(new Date(customer.lastOrderDate), "dd/MM/yy") : "-"}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-indigo-600">
                                                <ShoppingBag className="w-3 h-3" />
                                                {customer.totalOrders}x Transaksi
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button 
                                                className="flex-1 bg-gray-900 text-white rounded-2xl h-12 font-bold hover:bg-gray-800"
                                                onClick={() => openWhatsApp(customer.phone)}
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Kirim Pesan
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                className="w-12 h-12 rounded-2xl border-2 border-gray-100 shadow-none hover:bg-amber-50 hover:border-amber-200 group/btn"
                                                onClick={() => {
                                                    setSelectedCustomerForHistory(customer);
                                                    setIsHistoryOpen(true);
                                                }}
                                            >
                                                <History className="w-5 h-5 text-gray-400 group-hover/btn:text-amber-600" />
                                            </Button>
                                            <Button variant="outline" className="w-12 h-12 rounded-2xl border-2 border-gray-100 shadow-none">
                                                <ChevronRight className="w-5 h-5 text-gray-400" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 border-none">
                                    <TableHead className="py-6 px-8 font-black uppercase text-[10px] tracking-widest text-gray-400">Pelanggan</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-gray-400">Status</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-gray-400">Finansial</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest text-gray-400">Order</TableHead>
                                    <TableHead className="text-right px-8 font-black uppercase text-[10px] tracking-widest text-gray-400">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCustomers.map((customer) => (
                                    <TableRow key={customer.id} className="hover:bg-indigo-50/30 transition-colors border-gray-50">
                                        <TableCell className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-900">{customer.name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-black text-gray-900 uppercase tracking-tight">{customer.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold">{customer.phone}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("rounded-full px-2 py-0 border-none font-bold text-[9px] uppercase", getCustomerTag(customer).color)}>
                                                {getCustomerTag(customer).label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-gray-900">Rp {customer.totalSpent.toLocaleString()}</TableCell>
                                        <TableCell className="text-gray-500 font-medium">{customer.totalOrders}x</TableCell>
                                        <TableCell className="px-8 text-right space-x-2">
                                            <Button variant="ghost" size="icon" className="rounded-xl border hover:bg-amber-50 hover:text-amber-600" onClick={() => {
                                                setSelectedCustomerForHistory(customer);
                                                setIsHistoryOpen(true);
                                            }}>
                                                <History className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="rounded-xl border hover:bg-green-50 hover:text-green-600" onClick={() => openWhatsApp(customer.phone)}>
                                                <MessageCircle className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <LoyaltyHistoryDialog customer={selectedCustomerForHistory} />
            </Dialog>
        </div>
    );
}
