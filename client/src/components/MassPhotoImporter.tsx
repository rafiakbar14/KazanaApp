import { useState, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Camera, Upload, AlertTriangle, ImageIcon, X } from "lucide-react";
import { useUploadProductPhoto, useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MassPhotoImporterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PhotoMatch {
  file: File;
  sku: string;
  productId: number | null;
  productName: string | null;
  status: "idle" | "pending" | "success" | "error";
  message?: string;
}

export function MassPhotoImporter({ open, onOpenChange }: MassPhotoImporterProps) {
  const { data: products } = useProducts();
  const uploadPhoto = useUploadProductPhoto();
  const { toast } = useToast();
  const [matches, setMatches] = useState<PhotoMatch[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newMatches: PhotoMatch[] = files.map(file => {
      // Logic for SKU extraction: remove extension and path
      const filename = file.name.split("/").pop() || "";
      const sku = filename.replace(/\.[^/.]+$/, ""); // strip extension
      
      const product = products?.find(p => 
        p.sku.toLowerCase() === sku.toLowerCase() || 
        (p.productCode && p.productCode.toLowerCase() === sku.toLowerCase())
      );

      return {
        file,
        sku,
        productId: product?.id || null,
        productName: product?.name || null,
        status: "idle"
      };
    });

    setMatches(prev => [...prev, ...newMatches]);
    e.target.value = "";
  }, [products]);

  const handleRemove = (index: number) => {
    setMatches(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const toUpload = matches.filter(m => m.productId && m.status !== "success");
    if (toUpload.length === 0) return;

    setIsUploading(true);
    let completed = 0;

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        if (!match.productId || match.status === "success") continue;

        setMatches(prev => prev.map((m, idx) => 
            idx === i ? { ...m, status: "pending" } : m
        ));

        try {
            await uploadPhoto.mutateAsync({
                productId: match.productId,
                file: match.file
            });
            
            setMatches(prev => prev.map((m, idx) => 
                idx === i ? { ...m, status: "success" } : m
            ));
        } catch (err: any) {
            setMatches(prev => prev.map((m, idx) => 
                idx === i ? { ...m, status: "error", message: err.message } : m
            ));
        }
        
        completed++;
        setProgress(Math.round((completed / toUpload.length) * 100));
    }

    setIsUploading(false);
    toast({
        title: "Upload Selesai",
        description: `Berhasil mengunggah ${toUpload.filter(m => m.status === "success").length} foto.`
    });
  };

  const stats = useMemo(() => {
    const matched = matches.filter(m => m.productId).length;
    return {
        total: matches.length,
        matched,
        unmatched: matches.length - matched
    };
  }, [matches]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-black">
            <Upload className="w-6 h-6 text-primary" />
            Bulk Photo Importer
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Unggah banyak foto sekaligus. Sistem akan mencocokkan nama file dengan SKU produk secara otomatis.
            <br />
            Contoh: <span className="font-mono text-primary bg-primary/5 px-1 rounded">SKU123.jpg</span> akan masuk ke produk dengan SKU <span className="font-mono font-bold text-foreground">SKU123</span>.
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col space-y-4 mt-4">
          <div className="flex items-center gap-4">
            <Button 
                variant="outline" 
                className="relative overflow-hidden h-12 px-6 rounded-xl border-dashed border-2 hover:border-primary hover:bg-primary/5 transition-all flex-1"
                disabled={isUploading}
            >
              <Input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
              />
              <Camera className="w-5 h-5 mr-3" />
              Pilih Foto (Dapat banyak sekaligus)
            </Button>
            
            {matches.length > 0 && (
                <Button 
                    onClick={handleUpload} 
                    disabled={isUploading || stats.matched === 0}
                    className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Mulai Upload ({stats.matched})
                </Button>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <span>Mengunggah...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 rounded-full" />
            </div>
          )}

          <div className="flex gap-4">
             <div className="flex-1 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total File</span>
             </div>
             <div className="flex-1 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-emerald-600">{stats.matched}</span>
                <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wider">Terdeteksi</span>
             </div>
             <div className="flex-1 p-4 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-amber-600">{stats.unmatched}</span>
                <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wider">Tidak Cocok</span>
             </div>
          </div>

          <ScrollArea className="flex-1 border border-border/50 rounded-2xl bg-muted/5 p-4">
            <div className="space-y-2">
              {matches.map((match, idx) => (
                <div key={idx} className={cn(
                    "flex items-center gap-4 p-3 rounded-xl border transition-all animate-in fade-in slide-in-from-left-2",
                    match.status === "success" ? "bg-emerald-50 border-emerald-100" :
                    match.status === "error" ? "bg-red-50 border-red-100" :
                    match.productId ? "bg-white border-border/50" : "bg-muted/50 border-dashed border-muted-foreground/20"
                )}>
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                    <img 
                      src={URL.createObjectURL(match.file)} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onLoad={(e) => URL.revokeObjectURL((e.target as any).src)}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground truncate">{match.file.name}</span>
                      {match.status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {match.status === "pending" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                      {match.status === "error" && <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] font-mono h-5 px-1.5 uppercase bg-slate-50">{match.sku}</Badge>
                        {match.productId ? (
                            <span className="text-xs text-emerald-700 font-medium">→ {match.productName}</span>
                        ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-500" /> 
                                SKU tidak ditemukan
                            </span>
                        )}
                    </div>
                  </div>

                  {match.status === "idle" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 rounded-lg" onClick={() => handleRemove(idx)}>
                        <X className="w-4 h-4" />
                    </Button>
                  )}
                  {match.status === "error" && (
                    <span className="text-[10px] text-red-600 font-bold max-w-[100px] truncate">{match.message}</span>
                  )}
                </div>
              ))}
              {matches.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/30">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <p className="text-sm font-medium italic">Belum ada file dipilih</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {matches.length > 0 && stats.unmatched > 0 && (
            <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-3 mt-4">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                <p className="text-[10px] text-amber-700 font-medium">
                    Ada {stats.unmatched} file yang tidak memiliki SKU yang cocok. Pastikan nama file (tanpa ekstensi) sudah sesuai dengan SKU yang ada di sistem. Anda tetap bisa mengunggah file lain yang sudah cocok.
                </p>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
