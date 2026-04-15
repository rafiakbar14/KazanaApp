import * as React from "react";
import { 
  Store, Warehouse, Package, RotateCcw, Trash2, 
  Download, FileSpreadsheet, Camera, Loader2 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { api } from "@shared/routes";

interface ProductHeaderProps {
  locationType: string;
  canManageSku: boolean;
  selectedIds: number[];
  bulkResetOpen: boolean;
  setBulkResetOpen: (open: boolean) => void;
  bulkDeleteOpen: boolean;
  setBulkDeleteOpen: (open: boolean) => void;
  bulkResetStock: any;
  bulkDelete: any;
  setSelectedIds: (ids: number[]) => void;
  gudangImportLoading: boolean;
  gudangImportRef: React.RefObject<HTMLInputElement>;
  handleGudangImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  excelInputRef: React.RefObject<HTMLInputElement>;
  importExcel: any;
  handleExcelUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setMassPhotoOpen: (open: boolean) => void;
  setIsCreateOpen: (open: boolean) => void;
  role: string;
  toast: any;
}

export function ProductHeader({
  locationType,
  canManageSku,
  selectedIds,
  bulkResetOpen,
  setBulkResetOpen,
  bulkDeleteOpen,
  setBulkDeleteOpen,
  bulkResetStock,
  bulkDelete,
  setSelectedIds,
  gudangImportLoading,
  gudangImportRef,
  handleGudangImport,
  excelInputRef,
  importExcel,
  handleExcelUpload,
  setMassPhotoOpen,
  setIsCreateOpen,
  role,
  toast,
}: ProductHeaderProps) {
  return (
    <div className={cn(
      "flex flex-col gap-6 p-6 rounded-3xl border transition-all duration-500 backdrop-blur-md",
      locationType === "toko" ? "bg-blue-50/80 border-blue-100 shadow-blue-900/5 shadow-xl" :
        locationType === "gudang" ? "bg-amber-50/80 border-amber-100 shadow-amber-900/5 shadow-xl" :
          "bg-white/80 border-border shadow-sm"
    )}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl transition-all duration-500",
            locationType === "toko" ? "bg-blue-600 text-white shadow-lg shadow-blue-200" :
              locationType === "gudang" ? "bg-amber-600 text-white shadow-lg shadow-amber-200" :
                "bg-primary text-white shadow-lg shadow-primary/20"
          )}>
            {locationType === "toko" ? <Store className="w-8 h-8" /> :
              locationType === "gudang" ? <Warehouse className="w-8 h-8" /> :
                <Package className="w-8 h-8" />}
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              {locationType === "toko" ? "SKU Toko" :
                locationType === "gudang" ? "SKU Gudang" :
                  "Semua Produk"}
              <Badge variant="outline" className={cn(
                "ml-2 text-[10px] uppercase tracking-widest px-2 py-0 border-none font-bold",
                locationType === "toko" ? "bg-blue-100 text-blue-700" :
                  locationType === "gudang" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-700"
              )}>
                {locationType === "semua" ? "Admin View" : "Mode Aktif"}
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">
              {locationType === "toko" ? "Kelola stok unit pajangan dan ketersediaan di toko." :
                locationType === "gudang" ? "Kelola stok massal dan unit penyimpanan di gudang." :
                  "Melihat seluruh inventaris di semua lokasi."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
          {canManageSku && (
            <>
              {selectedIds.length > 0 && (
                <>
                  <AlertDialog open={bulkResetOpen} onOpenChange={setBulkResetOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-xl" data-testid="button-bulk-reset">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset {selectedIds.length} Stok
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset {selectedIds.length} Stok Produk?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini akan merubah stok saat ini menjadi 0 (nol) untuk semua produk yang dipilih. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl" data-testid="button-cancel-bulk-reset">Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            bulkResetStock.mutate(selectedIds, {
                              onSuccess: () => {
                                setSelectedIds([]);
                                setBulkResetOpen(false);
                              },
                            });
                          }}
                          className="bg-orange-600 text-white hover:bg-orange-700 rounded-xl"
                          data-testid="button-confirm-bulk-reset"
                        >
                          {bulkResetStock.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Reset Stok
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="rounded-xl shadow-lg shadow-red-100" data-testid="button-bulk-delete">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus {selectedIds.length}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus {selectedIds.length} Produk?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini tidak dapat dibatalkan. Semua data produk yang dipilih akan dihapus permanen.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl" data-testid="button-cancel-bulk-delete">Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            bulkDelete.mutate(selectedIds, {
                              onSuccess: () => {
                                setSelectedIds([]);
                                setBulkDeleteOpen(false);
                              },
                            });
                          }}
                          className="bg-destructive text-destructive-foreground rounded-xl"
                          data-testid="button-confirm-bulk-delete"
                        >
                          {bulkDelete.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {locationType === "gudang" ? (
                <>
                  <Button
                    variant="outline"
                    className="border-amber-200 bg-white hover:bg-amber-50 text-amber-700 rounded-xl shadow-sm"
                    onClick={async () => {
                      try {
                        const res = await fetch(api.excel.gudangTemplate.path, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({}),
                          credentials: "include",
                        });
                        if (!res.ok) throw new Error("Gagal download template");
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "template_gudang.xlsx";
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                      }
                    }}
                    data-testid="button-gudang-template"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Template
                  </Button>
                  <Button
                    variant="outline"
                    className="border-amber-200 bg-white hover:bg-amber-50 text-amber-700 rounded-xl shadow-sm"
                    onClick={() => gudangImportRef.current?.click()}
                    disabled={gudangImportLoading}
                    data-testid="button-gudang-import"
                  >
                    {gudangImportLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Import
                  </Button>
                  <Button
                    variant="outline"
                    className="border-amber-200 bg-white hover:bg-amber-50 text-amber-700 rounded-xl shadow-sm"
                    onClick={async () => {
                      try {
                        const res = await fetch(api.excel.gudangExport.path, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({}),
                          credentials: "include",
                        });
                        if (!res.ok) throw new Error("Gagal export gudang");
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "export_gudang.xlsx";
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err: any) {
                        toast({ title: "Error", description: err.message, variant: "destructive" });
                      }
                    }}
                    data-testid="button-gudang-export"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <input
                    ref={gudangImportRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleGudangImport}
                    data-testid="input-gudang-import-file"
                  />
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="rounded-xl shadow-sm bg-white"
                    onClick={() => window.open(api.excel.template.path, "_blank")}
                    data-testid="button-download-template"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Template
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl shadow-sm bg-white"
                    onClick={() => excelInputRef.current?.click()}
                    disabled={importExcel.isPending}
                    data-testid="button-import-excel"
                  >
                    {importExcel.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    Import
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl shadow-sm bg-white"
                    onClick={() => window.open(api.excel.export.path, "_blank")}
                    data-testid="button-export-excel"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <input
                    ref={excelInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleExcelUpload}
                    data-testid="input-excel-file"
                  />
                </>
              )}
              <Button 
                variant="outline" 
                className="rounded-xl shadow-sm bg-white border-primary/20 hover:bg-primary/5 text-primary"
                onClick={() => setMassPhotoOpen(true)}
                data-testid="button-mass-photo"
              >
                <Camera className="w-4 h-4 mr-2" />
                Bulk Photo
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
