import * as React from "react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { 
  Plus, Camera, Image as LucideImage, X, Loader2, 
  Trash2, CheckCircle2, AlertTriangle, XCircle, 
  Pencil, Save, GripVertical 
} from "lucide-react";

const ImageIcon = LucideImage;
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Form, FormControl, FormField, FormItem, 
  FormLabel, FormMessage 
} from "@/components/ui/form";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { type Product, type ProductPhoto, type ProductUnit, insertProductSchema } from "@shared/schema";
import { 
  useCreateProduct, useUploadProductPhoto, useProductPhotos, 
  useDeleteProductPhoto, useProductUnits, useCreateProductUnit, 
  useUpdateProductUnit, useDeleteProductUnit, useCategoryPriorities, 
  useSetCategoryPriorities 
} from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { useBackgroundUpload } from "@/components/BackgroundUpload";
import { BatchPhotoUpload } from "@/components/BatchPhotoUpload";
import { cn } from "@/lib/utils";
import { 
  DndContext, closestCenter, KeyboardSensor, 
  PointerSensor, TouchSensor, useSensor, useSensors, 
  DragEndEvent 
} from '@dnd-kit/core';
import { 
  arrayMove, SortableContext, sortableKeyboardCoordinates, 
  verticalListSortingStrategy, useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- CREATE PRODUCT DIALOG ---
const createFormSchema = insertProductSchema.omit({ userId: true, photoUrl: true });

export function CreateProductDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createProduct = useCreateProduct();
  const uploadPhoto = useUploadProductPhoto();
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof createFormSchema>>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      sku: "", name: "", category: "", description: "",
      currentStock: 0, locationType: "toko", subCategory: "",
      productCode: "", unitCost: 0, sellingPrice: 0,
      productType: "finished_good", minStock: 0,
      isTaxable: 1, taxRate: 11.0,
    },
  });

  const handleSelectPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    form.reset();
    setSelectedFiles([]);
    setPreviews([]);
    setIsUploading(false);
  };

  const onSubmit = async (data: z.infer<typeof createFormSchema>) => {
    setIsUploading(true);
    createProduct.mutate(data, {
      onSuccess: async (newProduct: Product) => {
        if (selectedFiles.length > 0) {
          const { compressImage } = await import("@/lib/utils");
          let failCount = 0;
          for (const file of selectedFiles) {
            try {
              const compressed = await compressImage(file);
              await uploadPhoto.mutateAsync({ productId: newProduct.id, file: compressed });
            } catch { failCount++; }
          }
          if (failCount > 0) {
            toast({ title: "Peringatan", description: `${failCount} foto gagal diupload.`, variant: "destructive" });
          }
        }
        setIsUploading(false);
        onOpenChange(false);
        resetForm();
      },
      onError: () => setIsUploading(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-lg shadow-primary/20" data-testid="button-add-product">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Tambah Produk Baru</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="sku" render={({ field }) => (
                <FormItem><FormLabel>SKU</FormLabel><FormControl><Input placeholder="Cth: ITEM-001" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Kategori</FormLabel><FormControl><Input placeholder="Elektronik" {...field} value={field.value || ""} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nama Produk</FormLabel><FormControl><Input placeholder="Headphone Wireless" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="unitCost" render={({ field }) => (
                <FormItem><FormLabel>Harga Modal</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="sellingPrice" render={({ field }) => (
                <FormItem><FormLabel>Harga Jual</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? 0} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="currentStock" render={({ field }) => (
                <FormItem><FormLabel>Stok Awal</FormLabel><FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} className="rounded-xl" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="locationType" render={({ field }) => (
                <FormItem><FormLabel>Lokasi</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value || "toko"}><FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl><SelectContent className="rounded-xl"><SelectItem value="toko">Toko</SelectItem><SelectItem value="gudang">Gudang</SelectItem></SelectContent></Select></FormItem>
              )} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => cameraInputRef.current?.click()}><Camera className="w-4 h-4 mr-2" />Kamera</Button>
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => photoInputRef.current?.click()}><ImageIcon className="w-4 h-4 mr-2" />Galeri</Button>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelectPhotos} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSelectPhotos} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button type="submit" disabled={createProduct.isPending || isUploading} className="rounded-xl min-w-[120px]">
                {(createProduct.isPending || isUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isUploading ? "Uploading..." : "Buat Produk"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// --- PHOTO GALLERY DIALOG ---
export function PhotoGalleryDialog({ productId, open, onOpenChange, canManage }: { productId: number | null; open: boolean; onOpenChange: (open: boolean) => void; canManage: boolean; }) {
  const { data: photos, isLoading } = useProductPhotos(productId ?? 0);
  const uploadPhoto = useUploadProductPhoto();
  const deletePhoto = useDeleteProductPhoto();
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const { addUploadJob } = useBackgroundUpload();

  const handleBatchUpload = useCallback(async (files: File[]) => {
    if (!productId) return;
    const pid = productId;
    addUploadJob("Foto Produk", files, (file) => {
      return new Promise<void>((resolve, reject) => {
        uploadPhoto.mutate({ productId: pid, file }, { onSuccess: () => resolve(), onError: (err) => reject(err) });
      });
    });
  }, [productId, uploadPhoto, addUploadJob]);

  return (
    <>
      <Dialog open={open && !viewingPhoto && !batchOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl">
          <DialogHeader><DialogTitle className="text-2xl font-black">Galeri Foto Produk</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            {isLoading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
              <div className="grid grid-cols-3 gap-3">
                {photos?.map((photo: ProductPhoto) => (
                  <div key={photo.id} className="relative group aspect-square rounded-2xl overflow-hidden border bg-muted/30">
                    <img src={photo.url} alt="" className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500" onClick={() => setViewingPhoto(photo.url)} />
                    {canManage && <Button variant="ghost" size="icon" className="absolute top-1 right-1 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => productId && deletePhoto.mutate({ productId, photoId: photo.id })}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>}
                  </div>
                ))}
                {canManage && <div className="aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setBatchOpen(true)}><Camera className="w-6 h-6 text-muted-foreground" /><span className="text-[10px] font-bold">TAMBAH</span></div>}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <BatchPhotoUpload open={batchOpen} onOpenChange={setBatchOpen} onUpload={handleBatchUpload} title="Foto Produk" />
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="sm:max-w-[800px] p-2 bg-transparent border-none shadow-none"><img src={viewingPhoto!} alt="" className="w-full h-auto max-h-[85vh] object-contain rounded-3xl" /></DialogContent>
      </Dialog>
    </>
  );
}

// --- UNIT MANAGEMENT DIALOG ---
export function UnitManagementDialog({ productId, open, onOpenChange }: { productId: number | null; open: boolean; onOpenChange: (open: boolean) => void; }) {
  const { data: units, isLoading } = useProductUnits(productId ?? 0);
  const createUnit = useCreateProductUnit();
  const updateUnit = useUpdateProductUnit();
  const deleteUnit = useDeleteProductUnit();
  const [newUnitName, setNewUnitName] = useState("");
  const [editingUnitId, setEditingUnitId] = useState<number | null>(null);
  const [editUnitName, setEditUnitName] = useState("");
  const [editingRatio, setEditingRatio] = useState<{ id: number; value: string } | null>(null);

  const sortedUnits = useMemo(() => units ? [...units].sort((a, b) => a.sortOrder - b.sortOrder) : [], [units]);

  const handleAddUnit = () => {
    if (!productId || !newUnitName.trim()) return;
    const baseUnitName = sortedUnits.length > 0 ? sortedUnits[sortedUnits.length - 1].unitName : newUnitName.trim();
    const sortOrder = sortedUnits.length > 0 ? sortedUnits[0].sortOrder - 1 : 100;
    createUnit.mutate({ productId, unitName: newUnitName.trim(), conversionToBase: 1, baseUnit: baseUnitName, sortOrder }, { onSuccess: () => setNewUnitName("") });
  };

  const handleUpdateUnitName = (unitId: number) => {
    if (!productId) return;
    updateUnit.mutate({ productId, unitId, unitName: editUnitName.trim() || undefined }, { onSuccess: () => setEditingUnitId(null) });
  };

  const handleUpdateRatio = async (unitId: number, ratioStr: string) => {
    if (!productId || !units) return;
    const ratio = parseFloat(ratioStr);
    if (isNaN(ratio) || ratio <= 0) return;
    const currentUnitIndex = sortedUnits.findIndex(u => u.id === unitId);
    if (currentUnitIndex === -1 || currentUnitIndex === sortedUnits.length - 1) return;
    const nextUnit = sortedUnits[currentUnitIndex + 1];
    const newConvToBase = ratio * nextUnit.conversionToBase;
    updateUnit.mutate({ productId, unitId, conversionToBase: newConvToBase }, { onSuccess: () => setEditingRatio(null) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader><DialogTitle className="text-2xl font-black">Unit (Satuan Beranak)</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          {isLoading ? <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
            <>
              <div className="space-y-4">
                {sortedUnits.map((unit, i) => (
                  <div key={unit.id} className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-2xl border bg-white shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">L{i + 1}</div>
                      {editingUnitId === unit.id ? (
                        <div className="flex-1 flex gap-2"><Input value={editUnitName} onChange={(e) => setEditUnitName(e.target.value)} className="h-8" /><Button size="icon" variant="ghost" onClick={() => handleUpdateUnitName(unit.id)}><Save className="w-4 h-4 text-green-600" /></Button></div>
                      ) : (
                        <div className="flex-1 font-bold text-sm">{unit.unitName} {i === sortedUnits.length - 1 && <span className="text-[9px] text-muted-foreground font-normal">(BASE)</span>}</div>
                      )}
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingUnitId(unit.id); setEditUnitName(unit.unitName); }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => productId && deleteUnit.mutate({ productId, unitId: unit.id })}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                    {i < sortedUnits.length - 1 && (
                      <div className="flex items-center gap-3 px-8 text-xs text-muted-foreground">
                        <div className="w-px h-6 bg-border" />
                        <span>1 {unit.unitName} = </span>
                        {editingRatio?.id === unit.id ? (
                          <Input type="number" value={editingRatio?.value || ""} onChange={(e) => setEditingRatio({ id: unit.id, value: e.target.value })} onBlur={() => editingRatio && handleUpdateRatio(unit.id, editingRatio.value)} className="w-20 h-7" />
                        ) : (
                          <button onClick={() => setEditingRatio({ id: unit.id, value: String(unit.conversionToBase / sortedUnits[i + 1].conversionToBase) })} className="px-3 bg-muted rounded-full font-black text-primary hover:bg-primary/10">{unit.conversionToBase / sortedUnits[i + 1].conversionToBase}</button>
                        )}
                        <span>{sortedUnits[i + 1].unitName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4 border-t border-dashed">
                <Input value={newUnitName} onChange={(e) => setNewUnitName(e.target.value)} placeholder="Satuan baru (cth: Dus)..." className="rounded-xl" />
                <Button onClick={handleAddUnit} disabled={createUnit.isPending || !newUnitName.trim()} className="rounded-xl">Tambah</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- IMPORT RESULT DIALOG ---
export function ImportResultDialog({ result, open, onOpenChange }: { result: any | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!result) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl">
        <DialogHeader><DialogTitle className="text-2xl font-black">Hasil Import</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-green-50 border border-green-100 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div><div className="text-[10px] font-bold text-green-600 uppercase">BERHASIL</div><div className="text-xl font-black">{result.imported}</div></div>
            </div>
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <div><div className="text-[10px] font-bold text-orange-600 uppercase">SKIPPED</div><div className="text-xl font-black">{result.skipped}</div></div>
            </div>
          </div>
          {result.errors.length > 0 && <div className="space-y-2"><h4 className="text-xs font-bold text-muted-foreground uppercase">Detail Error:</h4><div className="max-h-40 overflow-y-auto space-y-1">{result.errors.map((err: any, i: number) => <div key={i} className="text-xs p-2 rounded-xl bg-muted/50 flex gap-2"><XCircle className="w-4 h-4 text-destructive shrink-0" /><span><strong>Baris {err.row}:</strong> {err.message}</span></div>)}</div></div>}
          <div className="flex justify-end"><Button onClick={() => onOpenChange(false)} className="rounded-xl">Tutup</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- CATEGORY PRIORITY DIALOG ---
function SortableCategoryItem({ category, index }: { category: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 1 };
  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-center gap-2 p-3 rounded-2xl border bg-white shadow-sm mb-2 transition-all", isDragging && "shadow-2xl border-primary ring-4 ring-primary/10")}>
      <div {...attributes} {...listeners} className="p-1 cursor-grab active:cursor-grabbing"><GripVertical className="w-4 h-4 text-slate-400" /></div>
      <span className="flex-1 font-bold text-sm">{category}</span>
      <Badge variant="secondary" className="font-black text-[10px]">#{index + 1}</Badge>
    </div>
  );
}

export function CategoryPriorityDialog({ open, onOpenChange, categories }: { open: boolean; onOpenChange: (open: boolean) => void; categories: string[]; }) {
  const { data: priorities, isLoading } = useCategoryPriorities();
  const setCategoryPriorities = useSetCategoryPriorities();
  const [orderedCategories, setOrderedCategories] = useState<string[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    if (!open || categories.length === 0) return;
    if (priorities && priorities.length > 0) {
      const priorityMap = new Map(priorities.map(p => [p.categoryName, p.sortOrder]));
      setOrderedCategories([...categories].sort((a, b) => (priorityMap.get(a) ?? 999) - (priorityMap.get(b) ?? 999)));
    } else { setOrderedCategories([...categories]); }
  }, [open, categories, priorities]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedCategories((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const oldNewIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, oldNewIndex);
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader><DialogTitle className="text-2xl font-black">Urutan Kategori</DialogTitle></DialogHeader>
        <div className="py-2">
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div> : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="max-h-[50vh] overflow-y-auto px-1">
                <SortableContext items={orderedCategories} strategy={verticalListSortingStrategy}>
                  {orderedCategories.map((cat, index) => <SortableCategoryItem key={cat} category={cat} index={index} />)}
                </SortableContext>
              </div>
            </DndContext>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Batal</Button>
          <Button onClick={() => setCategoryPriorities.mutate(orderedCategories.map((cat, i) => ({ categoryName: cat, sortOrder: i })), { onSuccess: () => onOpenChange(false) })} className="rounded-xl min-w-[120px]">{setCategoryPriorities.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Simpan</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
