import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, Filter, Search } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface CashLedgerEntry {
    id: number;
    date: string;
    description: string;
    reference: string;
    debit: number;
    credit: number;
    balance: number;
}

interface Account {
    id: number;
    code: string;
    name: string;
    type: string;
}

export default function CashLedger() {
    const { user } = useAuth();
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [fromDate, setFromDate] = useState<Date | undefined>(() => {
        const date = new Date();
        date.setDate(1);
        return date;
    });
    const [toDate, setToDate] = useState<Date | undefined>(new Date());
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch accounts (asset type only)
    const { data: accounts = [] } = useQuery<Account[]>({
        queryKey: ["/api/accounting/accounts"],
        enabled: !!user,
    });

    // Filter only asset accounts
    const assetAccounts = accounts.filter(acc => acc.type === "asset");

    // Fetch cash ledger data
    const { data: ledgerData = [], isLoading } = useQuery<CashLedgerEntry[]>({
        queryKey: ["/api/accounting/cash-ledger", selectedAccountId, fromDate?.toISOString(), toDate?.toISOString()],
        enabled: !!selectedAccountId && !!user,
    });

    // Calculate summary
    const totalDebit = ledgerData.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = ledgerData.reduce((sum, entry) => sum + entry.credit, 0);
    const finalBalance = ledgerData.length > 0 ? ledgerData[ledgerData.length - 1].balance : 0;

    // Filter data based on search term
    const filteredData = ledgerData.filter(entry =>
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportCSV = () => {
        if (!filteredData.length) return;

        const headers = ["Tanggal", "Deskripsi", "Referensi", "Debit", "Kredit", "Saldo"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(entry => [
                format(new Date(entry.date), "dd/MM/yyyy"),
                `"${entry.description}"`,
                `"${entry.reference}"`,
                entry.debit.toFixed(2),
                entry.credit.toFixed(2),
                entry.balance.toFixed(2)
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `kas-bank-${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kas & Bank</h1>
                    <p className="text-muted-foreground">
                        Laporan pergerakan kas dan bank dengan running balance
                    </p>
                </div>
                <Button onClick={handleExportCSV} disabled={!filteredData.length}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Filter Section */}
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter Laporan
                    </CardTitle>
                    <CardDescription>
                        Pilih akun dan periode untuk melihat laporan kas & bank
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="account">Akun Kas/Bank</Label>
                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih akun" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assetAccounts.map(account => (
                                        <SelectItem key={account.id} value={account.id.toString()}>
                                            {account.code} - {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Dari Tanggal</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !fromDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {fromDate ? format(fromDate, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={fromDate}
                                        onSelect={setFromDate}
                                        initialFocus
                                        locale={id}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Sampai Tanggal</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !toDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {toDate ? format(toDate, "PPP", { locale: id }) : <span>Pilih tanggal</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={toDate}
                                        onSelect={setToDate}
                                        initialFocus
                                        locale={id}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari deskripsi atau referensi..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-700">Total Masuk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-800">
                            Rp {totalDebit.toLocaleString("id-ID")}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Total Keluar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-800">
                            Rp {totalCredit.toLocaleString("id-ID")}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Saldo Akhir</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-800">
                            Rp {finalBalance.toLocaleString("id-ID")}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Ledger Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Transaksi</CardTitle>
                    <CardDescription>
                        {selectedAccountId && assetAccounts.find(a => a.id.toString() === selectedAccountId)?.name}
                        {fromDate && toDate && ` • Periode: ${format(fromDate, "dd/MM/yyyy")} - ${format(toDate, "dd/MM/yyyy")}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : !selectedAccountId ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Silakan pilih akun untuk melihat laporan
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Tidak ada data transaksi untuk periode yang dipilih
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Deskripsi</TableHead>
                                        <TableHead>Referensi</TableHead>
                                        <TableHead className="text-right">Debit</TableHead>
                                        <TableHead className="text-right">Kredit</TableHead>
                                        <TableHead className="text-right">Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(entry.date), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell>{entry.reference}</TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {entry.debit > 0 ? `Rp ${entry.debit.toLocaleString("id-ID")}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right text-red-600">
                                                {entry.credit > 0 ? `Rp ${entry.credit.toLocaleString("id-ID")}` : "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                Rp {entry.balance.toLocaleString("id-ID")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}