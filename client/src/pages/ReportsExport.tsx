import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, TrendingUp, BookOpen, AlertCircle } from "lucide-react";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export default function ReportsExport() {
    const { toast } = useToast();

    const handleExport = (type: string) => {
        try {
            const url = `${api.erp.reports.export.path}?type=${type}`;
            // In a real app we might want to use a blob etc, but for simple CSV 
            // assignment works and triggers browser download
            window.location.assign(url);

            toast({
                title: "Ekspor Dimulai",
                description: "Laporan Sedang Diunduh...",
            });
        } catch (err) {
            toast({
                title: "Gagal",
                description: "Gagal mengekspor laporan",
                variant: "destructive"
            });
        }
    };

    const reportTypes = [
        {
            id: "sales",
            title: "Laporan Penjualan",
            description: "Data seluruh transaksi baik dari POS maupun Invoice ERP, termasuk status pembayaran.",
            icon: TrendingUp,
            color: "bg-blue-500/10 text-blue-500"
        },
        {
            id: "journal",
            title: "Jurnal Umum",
            description: "Seluruh catatan akuntansi (double-entry) dari transaksi penjualan dan pelunasan.",
            icon: BookOpen,
            color: "bg-purple-500/10 text-purple-500"
        },
        {
            id: "profit_loss",
            title: "Laba Rugi (CSV)",
            description: "Rangkuman pendapatan dan beban untuk melihat keuntungan bisnis Anda.",
            icon: TrendingUp,
            color: "bg-emerald-500/10 text-emerald-500"
        },
        {
            id: "balance_sheet",
            title: "Neraca (CSV)",
            description: "Status posisi keuangan Anda (Aset, Liabilitas, Ekuitas) saat ini.",
            icon: BookOpen,
            color: "bg-cyan-500/10 text-cyan-500"
        }
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-enter">
            <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Ekspor Laporan</h1>
                <p className="text-muted-foreground mt-1">Unduh data bisnis Anda dalam format CSV untuk analisis lebih lanjut</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportTypes.map((report) => (
                    <Card key={report.id} className="group hover:border-primary/50 transition-all">
                        <CardHeader>
                            <div className={`w-12 h-12 rounded-2xl ${report.color} flex items-center justify-center mb-2`}>
                                <report.icon className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl font-bold">{report.title}</CardTitle>
                            <CardDescription>{report.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                className="w-full h-12 rounded-xl font-bold"
                                variant="outline"
                                onClick={() => handleExport(report.id)}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Unduh CSV
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex gap-4">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="text-sm text-amber-800">
                        <p className="font-bold">Tips:</p>
                        <p>File CSV dapat dibuka langsung menggunakan Microsoft Excel, Google Sheets, atau aplikasi spreadsheet lainnya.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
