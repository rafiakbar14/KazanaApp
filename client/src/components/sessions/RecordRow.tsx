import * as React from "react";
import { useState, useMemo, useCallback, useEffect, memo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Image, Camera, CheckSquare, Loader2, X, ZoomIn, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateRecord, useUploadRecordPhoto, useDeleteRecordPhoto, useUploadOpnamePhoto } from "@/hooks/use-sessions";
import { useBackgroundUpload } from "@/components/BackgroundUpload";
import { BatchPhotoUpload } from "@/components/BatchPhotoUpload";
import type { OpnameRecordWithProduct } from "@shared/schema";
import { PhotoLightbox } from "./PhotoLightbox";

interface RecordRowProps {
  record: OpnameRecordWithProduct;
  sessionId: number;
  readOnly: boolean;
  isCompleted: boolean;
  isGudang: boolean;
  currentCounter: string;
  isBackedUp?: boolean;
}

export const RecordRow = memo(({
  record,
  sessionId,
  readOnly,
  isCompleted,
  isGudang,
  currentCounter,
  isBackedUp
}: RecordRowProps) => {
  const updateRecord = useUpdateRecord();
  const uploadPhoto = useUploadRecordPhoto();
  const deletePhoto = useDeleteRecordPhoto();
  const [actual, setActual] = useState(record.actualStock?.toString() ?? "");
  const [returned, setReturned] = useState(record.returnedQuantity?.toString() ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [refPhotoOpen, setRefPhotoOpen] = useState(false);
  const [batchPhotoOpen, setBatchPhotoOpen] = useState(false);

  const { jobs, addUploadJob } = useBackgroundUpload();
  const activeJob = jobs.find((j: any) => j.productId === record.productId && (j.status === "uploading" || j.status === "pending"));

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

  useEffect(() => {
    if (hasUnits) {
      const existing = parseExistingUnitValues();
      const result: Record<string, string> = {};
      productUnits.forEach((u: any) => {
        result[u.unitName] = existing[u.unitName]?.toString() ?? "";
      });
      setUnitInputs(result);
    }
  }, [record.unitValues, hasUnits, productUnits, parseExistingUnitValues]);

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

  const baseUnitName = useMemo(() => {
    if (productUnits.length > 0) return productUnits[0].baseUnit;
    return "pcs";
  }, [productUnits]);

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
    }, {
      onSuccess: () => {
        setIsFocused(false);
      }
    });
  }, [actual, returned, record.productId, record.actualStock, sessionId, currentCounter, updateRecord]);

  const handleBlur = () => {
    setIsFocused(false);
    const actualVal = parseInt(actual);
    const returnedVal = parseInt(returned) || 0;

    const hasActualChanged = !isNaN(actualVal) && actualVal !== record.actualStock;
    const hasReturnedChanged = returnedVal !== record.returnedQuantity;

    if (hasActualChanged || hasReturnedChanged) {
      handleApply();
    }
  };

  const handleUnitApply = useCallback(() => {
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

    updateRecord.mutate({
      sessionId,
      productId: record.productId,
      actualStock: computedTotal,
      unitValues: JSON.stringify(unitValues),
      returnedQuantity: returnedVal,
      countedBy: currentCounter
    }, {
      onSuccess: () => {
        setIsFocused(false);
      }
    });
  }, [unitInputs, returned, computedTotal, record.productId, sessionId, currentCounter, updateRecord, productUnits]);

  const handleUnitBlur = () => {
    setIsFocused(false);
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
    const hasReturnedChanged = returnedVal !== record.returnedQuantity;

    if (anyFilled || hasReturnedChanged) {
      handleUnitApply();
    }
  };

  const handleBatchUpload = useCallback(async (files: File[]) => {
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
  }, [uploadPhoto, sessionId, record.productId, record.product.name, addUploadJob]);

  const handleDeletePhoto = (photoId: number) => {
    deletePhoto.mutate({
      sessionId,
      productId: record.productId,
      photoId,
    });
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const formatNumber = (n: number) => n.toLocaleString("id-ID");

  return (
    <>
      <tr className={cn("transition-all duration-200 border-b border-white/5", isFocused ? "bg-primary/5" : "hover:bg-white/5")} data-testid={`row-record-${record.id}`}>
        <td className="px-6 py-4 font-mono text-xs text-muted-foreground/60">{isGudang && record.product.productCode ? record.product.productCode : record.product.sku}</td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            {record.product.photos && record.product.photos.length > 0 ? (
              <button
                onClick={() => setRefPhotoOpen(true)}
                className="cursor-pointer relative group flex-shrink-0"
                data-testid={`button-ref-photo-${record.productId}`}
              >
                <img
                  src={record.product.photos[0].url}
                  alt={record.product.name}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-sm"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  data-testid={`img-product-photo-${record.productId}`}
                />
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="w-4 h-4 text-white" />
                </div>
              </button>
            ) : null}
            <div className={cn("w-10 h-10 rounded-xl bg-muted/20 flex items-center justify-center flex-shrink-0 border border-white/5", record.product.photos && record.product.photos.length > 0 ? "hidden" : "")} data-testid={`img-product-placeholder-${record.productId}`}>
              <Image className="w-5 h-5 text-muted-foreground/30" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground/90 block">{record.product.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{record.product.category || "No Category"}</span>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-widest">Stok Fisik</span>
            {readOnly ? (
              <div className="text-center">
                <div className="font-bold text-foreground py-2 px-4 bg-muted/20 rounded-xl border border-white/5">
                  {record.actualStock !== null ? formatNumber(record.actualStock) : "-"}
                </div>
                {hasUnits && record.unitValues && (
                  <div className="mt-1 text-[10px] text-muted-foreground bg-primary/5 px-2 py-0.5 rounded-full inline-block">
                    {Object.entries(parseExistingUnitValues()).map(([name, val], i, arr) => (
                      <span key={name}>{val} {name}{i < arr.length - 1 ? " | " : ""}</span>
                    ))}
                  </div>
                )}
              </div>
            ) : hasUnits ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-1.5">
                  {productUnits.map((u: any) => (
                    <div key={u.id} className="flex items-center gap-2 group">
                      <Input
                        type="number"
                        className="w-20 h-8 text-center text-xs rounded-lg border-white/10 bg-white/5 focus:bg-white focus:ring-1"
                        placeholder="0"
                        value={unitInputs[u.unitName] || ""}
                        onChange={(e) => setUnitInputs(prev => ({ ...prev, [u.unitName]: e.target.value }))}
                        onFocus={() => setIsFocused(true)}
                        onBlur={handleUnitBlur}
                        disabled={updateRecord.isPending}
                        data-testid={`input-unit-${record.productId}-${u.unitName}`}
                      />
                      <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-bold text-foreground/70 uppercase">{u.unitName}</span>
                        {u.conversionToBase > 1 && (
                          <span className="text-[8px] text-primary/60 font-medium">x{u.conversionToBase}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] font-bold text-primary/60 text-center bg-primary/5 rounded-md py-0.5" data-testid={`text-total-${record.productId}`}>
                  TOTAL: {formatNumber(computedTotal)} {baseUnitName}
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center gap-2">
                <Input
                  type="number"
                  className={cn(
                    "w-24 h-10 text-center font-bold transition-all rounded-xl",
                    actual !== "" ? "border-primary/50 bg-primary/5 text-primary" : "border-white/10 bg-white/5"
                  )}
                  placeholder="-"
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={handleBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                  disabled={updateRecord.isPending}
                  data-testid={`input-count-${record.productId}`}
                />
                {!readOnly && (
                  <Button
                    size="icon"
                    variant={actual !== "" && parseInt(actual) !== record.actualStock ? "default" : "outline"}
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all shadow-sm shrink-0",
                      actual !== "" && parseInt(actual) !== record.actualStock ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-white/10 text-muted-foreground"
                    )}
                    onClick={handleApply}
                    disabled={updateRecord.isPending}
                  >
                    {updateRecord.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-5 h-5" />}
                  </Button>
                )}
              </div>
            )}
          </div>
        </td>
        {isCompleted && (
          <td className="px-6 py-4">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-mono font-medium text-amber-600/60 uppercase tracking-widest">Retur</span>
              <Input
                type="number"
                className={cn(
                  "w-20 h-10 text-center transition-all rounded-xl",
                  returned !== "" && returned !== "0" ? "border-amber-400/50 bg-amber-50 text-amber-700 font-bold shadow-sm" : "border-white/10 bg-white/5"
                )}
                placeholder="0"
                value={returned}
                onChange={(e) => setReturned(e.target.value)}
                onBlur={hasUnits ? handleUnitBlur : handleBlur}
                disabled={false}
                data-testid={`input-returned-${record.productId}`}
              />
            </div>
          </td>
        )}
        <td className="px-6 py-4">
          <div className="flex items-center justify-center gap-1.5 flex-wrap min-w-[100px]">
            {isBackedUp ? (
              <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/50">ARCHIVED</span>
            ) : (
              <>
                {allPhotos.map((photo: any, idx: number) => (
                  <div key={photo.id} className="relative group">
                    <button
                      onClick={() => openLightbox(idx)}
                      className="cursor-pointer"
                      data-testid={`button-view-photo-${record.productId}-${photo.id}`}
                    >
                      <img
                        src={photo.url}
                        alt={`Foto ${record.product.name} ${idx + 1}`}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-sm"
                      />
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Image className="w-4 h-4 text-white" />
                      </div>
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        data-testid={`button-delete-photo-${record.productId}-${photo.id}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
                {allPhotos.length === 0 && record.photoUrl && (
                  <button
                    onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
                    className="relative group cursor-pointer"
                    data-testid={`button-view-photo-${record.productId}`}
                  >
                    <img
                      src={record.photoUrl}
                      alt={`Foto ${record.product.name}`}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-sm"
                    />
                    <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Image className="w-4 h-4 text-white" />
                    </div>
                  </button>
                )}
              </>
            )}
            {!readOnly && !isBackedUp && (
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-xl transition-all border-dashed hover:border-primary hover:bg-primary/5 hover:text-primary",
                    activeJob ? "border-primary bg-primary/10 text-primary animate-pulse" : "border-white/20 text-muted-foreground/40"
                  )}
                  onClick={() => setBatchPhotoOpen(true)}
                  disabled={!!activeJob}
                  data-testid={`button-batch-photo-${record.productId}`}
                >
                  {activeJob ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </Button>
                {activeJob && (
                  <div className="w-8 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(activeJob.progress / activeJob.total) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          {record.actualStock !== null ? (
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200 shadow-sm animate-in zoom-in duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20 mx-auto animate-pulse" />
          )}
        </td>
      </tr>

      <PhotoLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        photos={allPhotos.length > 0 ? allPhotos.map(p => p.url) : record.photoUrl ? [record.photoUrl] : []}
        initialIndex={lightboxIndex}
        title={record.product.name}
        productId={record.productId}
        onDelete={!readOnly && !isBackedUp && allPhotos.length > 0 ? (idx: number) => handleDeletePhoto(allPhotos[idx].id) : undefined}
      />

      <PhotoLightbox
        open={refPhotoOpen}
        onOpenChange={setRefPhotoOpen}
        photos={record.product.photos ? record.product.photos.map((p: any) => p.url) : []}
        initialIndex={0}
        title={`Referensi - ${record.product.name}`}
        productId={record.productId}
      />

      <BatchPhotoUpload
        open={batchPhotoOpen}
        onOpenChange={setBatchPhotoOpen}
        onUpload={handleBatchUpload}
        title={`Foto Opname - ${record.product.name}`}
      />
    </>
  );
});
