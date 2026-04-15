import * as React from "react";
import { useState, useMemo, useCallback, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Image, Camera, CheckSquare, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateRecord, useUploadRecordPhoto, useDeleteRecordPhoto } from "@/hooks/use-sessions";
import { useBackgroundUpload } from "@/components/BackgroundUpload";
import { BatchPhotoUpload } from "@/components/BatchPhotoUpload";
import type { OpnameRecordWithProduct } from "@shared/schema";
import { PhotoLightbox } from "./PhotoLightbox";

interface MobileRecordCardProps {
  record: OpnameRecordWithProduct;
  sessionId: number;
  readOnly: boolean;
  isCompleted: boolean;
  isGudang: boolean;
  currentCounter: string;
  isBackedUp?: boolean;
}

export const MobileRecordCard = memo(({ 
  record, 
  sessionId, 
  readOnly, 
  isCompleted, 
  isGudang, 
  currentCounter, 
  isBackedUp 
}: MobileRecordCardProps) => {
  const updateRecord = useUpdateRecord();
  const uploadPhoto = useUploadRecordPhoto();
  const deletePhoto = useDeleteRecordPhoto();
  const { addUploadJob, jobs } = useBackgroundUpload();
  
  const [actual, setActual] = useState(record.actualStock?.toString() ?? "");
  const [returned, setReturned] = useState(record.returnedQuantity?.toString() ?? "");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [batchPhotoOpen, setBatchPhotoOpen] = useState(false);

  const productUnits = record.product.units ?? [];
  const hasUnits = isGudang && productUnits.length > 0;

  const parseExistingUnitValues = useCallback((): Record<string, number> => {
    if (!record.unitValues) return {};
    try {
      return JSON.parse(record.unitValues);
    } catch {
      return {};
    }
  }, [record.unitValues]);

  const [unitInputs, setUnitInputs] = useState<Record<string, string>>(() => {
    const existing = parseExistingUnitValues();
    const result: Record<string, string> = {};
    productUnits.forEach((u: any) => {
      result[u.unitName] = existing[u.unitName]?.toString() ?? "";
    });
    return result;
  });

  const computedTotal = useMemo(() => {
    if (!hasUnits) return 0;
    let total = 0;
    productUnits.forEach((u: any) => {
      const val = parseFloat(unitInputs[u.unitName] || "0");
      if (!isNaN(val)) {
        total += val * u.conversionToBase;
      }
    });
    return Math.round(total);
  }, [unitInputs, productUnits, hasUnits]);

  const allPhotos = record.photos ?? [];

  const handleApply = useCallback(() => {
    const actualVal = parseInt(actual);
    const returnedVal = parseInt(returned) || 0;
    updateRecord.mutate({
      sessionId,
      productId: record.productId,
      actualStock: isNaN(actualVal) ? (record.actualStock ?? 0) : actualVal,
      returnedQuantity: returnedVal,
      countedBy: currentCounter
    });
  }, [actual, returned, record.productId, record.actualStock, sessionId, currentCounter, updateRecord]);

  const handleBlur = () => {
    const actualVal = parseInt(actual);
    const returnedVal = parseInt(returned) || 0;
    const hasChanged = (!isNaN(actualVal) && actualVal !== record.actualStock) || returnedVal !== record.returnedQuantity;
    if (hasChanged) {
      handleApply();
    }
  };

  const handleUnitBlur = () => {
    const unitValues: Record<string, number> = {};
    let anyFilled = false;
    productUnits.forEach((u: any) => {
      const val = parseFloat(unitInputs[u.unitName] || "0");
      if (!isNaN(val) && val > 0) {
        unitValues[u.unitName] = val;
        anyFilled = true;
      }
    });
    const returnedVal = parseInt(returned) || 0;
    if (anyFilled || returnedVal !== record.returnedQuantity) {
      updateRecord.mutate({
        sessionId,
        productId: record.productId,
        actualStock: computedTotal,
        unitValues: JSON.stringify(unitValues),
        returnedQuantity: returnedVal,
        countedBy: currentCounter
      });
    }
  };

  const activeJob = jobs.find((j: any) => j.productId === record.productId && (j.status === "uploading" || j.status === "pending"));

  const handlePhotoSelect = async (files: File[]) => {
    const sid = sessionId;
    const pid = record.productId;
    const label = record.product.name;

    addUploadJob(label, files, (file: File) => {
      return new Promise<void>((resolve, reject) => {
        uploadPhoto.mutate(
          { sessionId: sid, productId: pid, file },
          { onSuccess: () => resolve(), onError: (err) => reject(err) }
        );
      });
    }, pid);
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl border border-white/20 rounded-3xl p-5 space-y-4 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start gap-4">
        {record.product.photos && record.product.photos.length > 0 ? (
          <img src={record.product.photos[0].url} className="w-20 h-20 rounded-2xl object-cover border border-white/50 shadow-md" alt="" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground/30 border border-white/20">
            <Image className="w-8 h-8" />
          </div>
        )}
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="font-display font-bold text-foreground leading-tight">{record.product.name}</h3>
          <p className="text-[10px] font-mono text-muted-foreground mt-1 uppercase tracking-wider">{isGudang && record.product.productCode ? record.product.productCode : record.product.sku}</p>
          <Badge variant="secondary" className="mt-2 bg-primary/5 text-primary border-primary/10 text-[9px] px-2 py-0 uppercase font-black">
            {record.product.category || "General"}
          </Badge>
        </div>
        {record.actualStock !== null && (
          <div className="bg-emerald-100 p-1 rounded-full border border-emerald-200 shadow-sm shrink-0">
             <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 pt-2">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Perhitungan Stok</label>
          {hasUnits ? (
            <div className="space-y-2.5 bg-muted/5 p-3 rounded-2xl border border-white/10">
              {productUnits.map((u: any) => (
                <div key={u.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input
                      type="number"
                      className="h-12 text-center bg-white/50 border-white/20 font-display font-bold text-lg rounded-xl focus:ring-primary"
                      placeholder="0"
                      value={unitInputs[u.unitName] || ""}
                      onChange={(e) => setUnitInputs(prev => ({ ...prev, [u.unitName]: e.target.value }))}
                      onBlur={handleUnitBlur}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="flex flex-col min-w-[60px]">
                    <span className="text-xs font-black text-foreground/80 uppercase">{u.unitName}</span>
                    {u.conversionToBase > 1 && (
                      <span className="text-[10px] text-primary/60 font-black">X {u.conversionToBase}</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-white/10 flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-muted-foreground uppercase">Total Base Unit</span>
                <span className="text-sm font-black text-primary">{computedTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Input
                type="number"
                className={cn(
                  "h-14 text-center font-display font-black text-2xl flex-1 rounded-2xl transition-all", 
                  actual !== "" ? "bg-primary text-white border-transparent shadow-lg shadow-primary/20" : "bg-white/50 border-white/20"
                )}
                placeholder="-"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                onFocus={(e) => e.target.select()}
                onBlur={handleBlur}
                disabled={readOnly}
              />
              {!readOnly && (
                <Button
                  size="icon"
                  className={cn(
                    "h-14 w-14 rounded-2xl shrink-0 transition-all shadow-xl",
                    actual !== "" && parseInt(actual) !== record.actualStock 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                      : "bg-white/50 border-white/20 text-muted-foreground/30 hover:bg-white"
                  )}
                  onClick={handleApply}
                  disabled={updateRecord.isPending}
                >
                  {updateRecord.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckSquare className="w-6 h-6" />}
                </Button>
              )}
            </div>
          )}
        </div>
        
        {isCompleted && (
          <div className="space-y-2">
            <label className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] ml-1">Retur Barang</label>
            <Input
              type="number"
              className={cn(
                "h-12 text-center font-display font-black text-xl rounded-2xl", 
                returned !== "" && returned !== "0" ? "bg-amber-100 border-amber-300 text-amber-700 shadow-lg shadow-amber-100" : "bg-white/50 border-white/20"
              )}
              placeholder="0"
              value={returned}
              onChange={(e) => setReturned(e.target.value)}
              onBlur={hasUnits ? handleUnitBlur : handleBlur}
            />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <div className="flex -space-x-3 overflow-hidden p-1">
          {isBackedUp ? (
            <Badge variant="outline" className="text-[8px] bg-amber-50 text-amber-600 border-amber-200/50 rounded-full py-0">BACKED UP</Badge>
          ) : (
            <>
              {allPhotos.slice(0, 3).map((p: any, i: number) => (
                <img key={p.id} src={p.url} className="w-10 h-10 rounded-full border-4 border-white shadow-sm object-cover" alt="" />
              ))}
              {allPhotos.length > 3 && (
                <div className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                  +{allPhotos.length - 3}
                </div>
              )}
              {allPhotos.length === 0 && (
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                  <Camera className="w-5 h-5" />
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex gap-3">
          {!readOnly && !isBackedUp && (
            <div className="flex flex-col items-end gap-2 min-w-[140px]">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-11 rounded-2xl transition-all shadow-md w-full font-black text-xs uppercase tracking-wider",
                  activeJob
                    ? "bg-amber-500 text-white border-transparent"
                    : "bg-white border-white border-2 text-primary hover:bg-primary hover:text-white"
                )}
                disabled={!!activeJob}
                onClick={() => setBatchPhotoOpen(true)}
              >
                {activeJob ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                {activeJob ? `Upload (${activeJob.progress})` : "Ambil Foto"}
              </Button>
              {activeJob && (
                <div className="w-full space-y-1 px-1">
                  <Progress
                    value={(activeJob.progress / activeJob.total) * 100}
                    className="h-1.5 w-full bg-amber-100"
                  />
                </div>
              )}
            </div>
          )}

          {!isBackedUp && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-11 rounded-2xl text-slate-400 font-bold px-4" 
                onClick={() => {
                  if (allPhotos.length > 0) {
                    setLightboxIndex(0);
                    setLightboxOpen(true);
                  }
                }}
            >
                Lihat
            </Button>
          )}
        </div>
      </div>

      <PhotoLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        photos={allPhotos.map(p => p.url)}
        initialIndex={lightboxIndex}
        title={record.product.name}
        productId={record.productId}
        onDelete={!readOnly && !isBackedUp && allPhotos.length > 0 ? (idx: number) => {
          deletePhoto.mutate({ 
            sessionId, 
            productId: record.productId, 
            photoId: allPhotos[idx].id 
          }, {
            onSuccess: () => {
              if (allPhotos.length <= 1) {
                setLightboxOpen(false);
              }
            }
          });
        } : undefined}
      />

      <BatchPhotoUpload
        open={batchPhotoOpen}
        onOpenChange={setBatchPhotoOpen}
        onUpload={handlePhotoSelect}
        title={`Foto Opname - ${record.product.name}`}
      />
    </div>
  );
});
