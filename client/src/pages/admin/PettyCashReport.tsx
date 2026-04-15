import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";

interface PettyCashEntry {
    id: number;
    createdAt: string;
    sessionId: number;
    sessionTitle: string;
    description: string;
    type: "in" | "out";
    amount: number;
}

interface POSSession {
    id: number;
    title: string;
    startTime: string;
    endTime: string | null;
    status: string;
}

export default function PettyCashReport() {
    const { user } = useAuth();
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    const [fromDate, setFromDate] = useState<Date | undefined>(() => {
        const date = new Date();
        date.setDate(1);
        return date;
    });
    const [toDate, setToDate] = useState<Date | undefined>(new Date());
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch POS sessions
    const { data: sessions = [] } = useQuery<POSSession[]>({
        queryKey: ["/api/pos/sessions"],
        enabled: !!user,
    });

    // Fetch petty cash data
    const { data: pettyCashData = [], isLoading } = useQuery<PettyCashEntry[]>({
        queryKey: ["/api/admin/petty-cash-report", selectedSessionId, fromDate?.toISOString(), toDate?.toISOString()],
        enabled: !!user,
    });

    // Calculate summary
    const totalIn = pettyCashData
        .filter(entry => entry.type === "in")
        .reduce((sum, entry) => sum + entry.amount, 0);

    const totalOut = pettyCashData
        .filter(entry => entry.type === "out")
        .reduce((sum, entry) => sum + entry.amount, 0);

    const netBalance = totalIn - totalOut;

    // Filter data based on search term
    const filteredData = pettyCashData.filter(entry =>
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.sessionTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExportCSV = () => {
        if (!filteredData.length) return;

        const headers = ["Waktu", "Sesi", "Deskripsi", "Tipe", "Jumlah"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(entry => [
                format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm"),
                `"${entry.sessionTitle}"`,
                `"${entry.description}"`,
                entry.type === "in" ? "Masuk" : "Keluar",
                entry.amount.toFixed(2)
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `laporan-kas-kecil-${format(new Date(), "yyyy-MM-dd")}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Laporan Kas Kecil</h1>
                    <p className="text-muted-foreground">
                        Laporan pergerakan kas kecil per sesi POS
                    </p>
                </div>
                <Button onClick={handleExportCSV} disabled={!filteredData.length}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Filter Section */}
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter Laporan
                    </CardTitle>
                    <CardDescription>
                        Pilih sesi POS atau periode untuk melihat laporan kas kecil
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="session">Sesi POS</Label>
                            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Sesi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Semua Sesi</SelectItem>
                                    {sessions.map(session => (
                                        <SelectItem key={session.id} value={session.id.toString()}>
                                            {session.title} ({format(new Date(session.startTime), "dd/MM/yyyy")})
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
                            placeholder="Cari deskripsi atau sesi..."
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
                            Rp {totalIn.toLocaleString("id-ID")}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {pettyCashData.filter(e => e.type === "in").length} transaksi masuk
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Total Keluar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-800">
                            Rp {totalOut.toLocaleString("id-ID")}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {pettyCashData.filter(e => e.type === "out").length} transaksi keluar
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Saldo Bersih</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netBalance >= 0 ? "text-blue-800" : "text-red-800"}`}>
                            Rp {Math.abs(netBalance).toLocaleString("id-ID")}
                            {netBalance < 0 && " (Defisit)"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {pettyCashData.length} total transaksi
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Petty Cash Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Detail Transaksi Kas Kecil</CardTitle>
                    <CardDescription>
                        {selectedSessionId
                            ? `Sesi: ${sessions.find(s => s.id.toString() === selectedSessionId)?.title}`
                            : "Semua Sesi"}
                        {fromDate && toDate && ` • Periode: ${format(fromDate, "dd/MM/yyyy")} - ${format(toDate, "dd/MM/yyyy")}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Tidak ada data transaksi kas kecil untuk periode yang dipilih
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Waktu</TableHead>
                                        <TableHead>Sesi</TableHead>
                                        <TableHead>Deskripsi</TableHead>
                                        <TableHead>Tipe</TableHead>
                                        <TableHead className="text-right">Jumlah</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{entry.sessionTitle}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        ID: {entry.sessionId}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{entry.description}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={entry.type === "in" ? "default" : "destructive"}
                                                    className={entry.type === "in" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                                                >
                                                    {entry.type === "in" ? "Masuk" : "Keluar"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-medium ${entry.type === "in" ? "text-green-600" : "text-red-600"}`}>
                                                {entry.type === "in" ? "+" : "-"} Rp {entry.amount.toLocaleString("id-ID")}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary by Session */}
            {!selectedSessionId && filteredData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Ringkasan per Sesi</CardTitle>
                        <CardDescription>
                            Total kas kecil per sesi POS
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sesi</TableHead>
                                        <TableHead className="text-right">Masuk</TableHead>
                                        <TableHead className="text-right">Keluar</TableHead>
                                        <TableHead className="text-right">Saldo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array.from(new Set(filteredData.map(e => e.sessionId))).map(sessionId => {
                                        const sessionEntries = filteredData.filter(e => e.sessionId === sessionId);
                                        const session = sessions.find(s => s.id === sessionId);
                                        const sessionIn = sessionEntries.filter(e => e.type === "in").reduce((sum, e) => sum + e.amount, 0);
                                        const sessionOut = sessionEntries.filter(e => e.type === "out").reduce((sum, e) => sum + e.amount, 0);
                                        const sessionBalance = sessionIn - sessionOut;

                                        return (
                                            <TableRow key={sessionId}>
                                                <TableCell className="font-medium">
                                                    {session?.title || `Sesi ${sessionId}`}
                                                </TableCell>
                                                <TableCell className="text-right text-green-600">
                                                    Rp {sessionIn.toLocaleString("id-ID")}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    Rp {sessionOut.toLocaleString("id-ID")}
                                                </TableCell>
                                                <TableCell className={`text-right font-medium ${sessionBalance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                                                    Rp {Math.abs(sessionBalance).toLocaleString("id-ID")}
                                                    {sessionBalance < 0 && " (Defisit)"}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}