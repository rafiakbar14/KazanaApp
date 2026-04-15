import * as React from "react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckSquare, CalendarDays, Loader2, FileArchive } from "lucide-react";
import type { OpnameRecordWithProduct } from "@shared/schema";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: OpnameRecordWithProduct[];
  onDownload: (options?: { productIds?: number[]; date?: string }) => Promise<void>;
}

export function DownloadDialog({
  open,
  onOpenChange,
  records,
  onDownload
}: DownloadDialogProps) {
  const [mode, setMode] = useState<"all" | "products" | "date">("all");
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const productsWithPhotos = useMemo(() => {
    return records
      .filter(r => (r.photos && r.photos.length > 0) || r.photoUrl)
      .map(r => ({ id: r.productId, name: r.product.name, sku: r.product.sku }))
      .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
  }, [records]);

  const photoDates = useMemo(() => {
    const dates = new Set<string>();
    for (const r of records) {
      if (r.photos) {
        for (const p of r.photos) {
          dates.add(new Date(p.createdAt).toISOString().split("T")[0]);
        }
      }
    }
    return Array.from(dates).sort().reverse();
  }, [records]);

  const toggleProduct = (id: number) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAllProducts = () => {
    if (selectedProducts.length === productsWithPhotos.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(productsWithPhotos.map(p => p.id));
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (mode === "products" && selectedProducts.length > 0) {
        await onDownload({ productIds: selectedProducts });
      } else if (mode === "date" && selectedDate) {
        await onDownload({ date: selectedDate });
      } else {
        await onDownload();
      }
      onOpenChange(false);
    } finally {
      setIsDownloading(false);
    }
  };

  const canDownload = mode === "all" || (mode === "products" && selectedProducts.length > 0) || (mode === "date" && selectedDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Download Foto ZIP</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Pilih mode download:</label>
            <Select value={mode} onValueChange={(v) => setMode(v as "all" | "products" | "date")}>
              <SelectTrigger data-testid="select-download-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border border-border shadow-xl">
                <SelectItem value="all" data-testid="option-download-all">Semua Foto</SelectItem>
                <SelectItem value="products" data-testid="option-download-products">Pilih Produk</SelectItem>
                <SelectItem value="date" data-testid="option-download-date">Pilih Tanggal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "products" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Pilih produk:</label>
                <Button variant="ghost" size="sm" onClick={selectAllProducts} data-testid="button-select-all-products">
                  <CheckSquare className="w-3 h-3 mr-1" />
                  {selectedProducts.length === productsWithPhotos.length ? "Batal Semua" : "Pilih Semua"}
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2">
                {productsWithPhotos.map(p => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/10 transition-colors"
                    data-testid={`checkbox-product-${p.id}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="rounded"
                    />
                    <span className="text-sm">{p.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{p.sku}</span>
                  </label>
                ))}
                {productsWithPhotos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Tidak ada produk dengan foto</p>
                )}
              </div>
              {selectedProducts.length > 0 && (
                <p className="text-xs text-muted-foreground">{selectedProducts.length} produk dipilih</p>
              )}
            </div>
          )}

          {mode === "date" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Pilih tanggal:</label>
              {photoDates.length > 0 ? (
                <div className="space-y-1 border rounded-md p-2">
                  {photoDates.map(d => (
                    <label
                      key={d}
                      className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/10 transition-colors"
                      data-testid={`radio-date-${d}`}
                    >
                      <input
                        type="radio"
                        name="download-date"
                        checked={selectedDate === d}
                        onChange={() => setSelectedDate(d)}
                        className="rounded-full"
                      />
                      <CalendarDays className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm">{new Date(d).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada tanggal foto tersedia</p>
              )}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-download">
            Batal
          </Button>
          <Button onClick={handleDownload} disabled={!canDownload || isDownloading} data-testid="button-confirm-download">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileArchive className="w-4 h-4 mr-2" />}
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
