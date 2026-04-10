import { useState } from "react";
import { useProducts, useImportExcel } from "@/hooks/use-products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Download, FileJson, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";

export default function MasterImportExport() {
  const { data: products } = useProducts();
  const importExcel = useImportExcel();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = () => {
    if (!products) return;
    setIsExporting(true);
    try {
      const ws = XLSX.utils.json_to_sheet(products);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Products");
      XLSX.writeFile(wb, "Kazana_Master_Products.xlsx");
      toast({ title: "Export Berhasil", description: "Data master produk telah diunduh." });
    } catch (err) {
      toast({ title: "Export Gagal", description: "Terjadi kesalahan saat mengekspor data.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    if (!products) return;
    setIsExporting(true);
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "Kazana_Master_Data.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast({ title: "Export Berhasil", description: "Data master JSON telah diunduh." });
    } catch (err) {
      toast({ title: "Export Gagal", description: "Terjadi kesalahan saat mengekspor data.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        importExcel.mutate(file);
      } else {
        toast({ title: "Format Tidak Didukung", description: "Mohon unggah file Excel (.xlsx atau .xls).", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/master">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Import & Export Master</h1>
            <p className="text-muted-foreground mt-1 text-sm">Kelola data master Anda dengan file eksternal secara efisien.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* EXPORT SECTION */}
        <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Ekspor Master Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm text-slate-500 leading-relaxed">
              Unduh semua data produk, kategori, dan pengaturan master lainnya untuk cadangan atau analisis di aplikasi lain (seperti Excel).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" className="rounded-2xl h-28 flex flex-col gap-3 group hover:border-green-500 hover:bg-green-50/30 transition-all font-bold" onClick={handleExportExcel} disabled={isExporting}>
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                Format Excel (.xlsx)
              </Button>
              <Button variant="outline" className="rounded-2xl h-28 flex flex-col gap-3 group hover:border-amber-500 hover:bg-amber-50/30 transition-all font-bold" onClick={handleExportJSON} disabled={isExporting}>
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                  <FileJson className="w-6 h-6" />
                </div>
                Format JSON (.json)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* IMPORT SECTION */}
        <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              Impor Master Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <p className="text-sm text-slate-500 leading-relaxed">
              Tambahkan produk secara massal atau perbarui data yang ada dengan mengunggah template Excel yang sudah diisi.
            </p>
            
            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 hover:border-primary/30 transition-all group">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={importExcel.isPending}
              />
              
              {importExcel.isPending ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-sm font-bold">Sedang memproses...</p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-700">Klik atau seret file ke sini</p>
                    <p className="text-xs text-slate-400 mt-1">Mendukung format Excel (.xlsx)</p>
                  </div>
                  <Button className="rounded-xl px-8 font-bold pointer-events-none">Pilih File</Button>
                </>
              )}
            </div>

            {importExcel.isSuccess && (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm animate-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>Import berhasil! {importExcel.data?.imported} item ditambahkan.</p>
              </div>
            )}

            {importExcel.isError && (
              <div className="flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/10 rounded-xl text-destructive text-sm animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{importExcel.error.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Footer info/template download */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 text-sm">Butuh bantuan format file?</h4>
            <p className="text-xs text-blue-700 mt-0.5">Unduh template Excel resmi untuk memastikan data terimpor dengan benar.</p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl bg-white border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white font-bold h-10 px-6 transition-all shadow-sm" asChild>
          <a href="/api/excel/template">
            <Download className="w-4 h-4 mr-2" />
            Unduh Template
          </a>
        </Button>
      </div>
    </div>
  );
}
