import * as React from "react";
import { memo, useState } from "react";
import { 
  Loader2, Package, ChevronDown, ChevronUp, Globe, 
  Image as LucideImage, Trash2, Camera, Pencil, Layers, 
  Save, X, Warehouse, Store, AlertTriangle
} from "lucide-react";

const ImageIcon = LucideImage;
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { type Product, type ProductUnit } from "@shared/schema";
import { useUpdateProduct, useDeleteProduct, useProductPhotos, useProductUnits } from "@/hooks/use-products";
import { useBranch } from "@/hooks/use-branch";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

// --- HELPERS ---
function formatUnitDisplay(units: ProductUnit[]): string {
  if (!units || units.length === 0) return "";
  const sorted = [...units].sort((a, b) => a.sortOrder - b.sortOrder);
  return sorted.map(u => u.unitName).join(", ");
}

// --- TABLE ROW ---
export const ProductRow = memo(({
  product,
  canManageSku,
  selected,
  onToggleSelect,
  onEdit,
  onPhotos,
  onUnits,
}: {
  product: Product;
  canManageSku: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onPhotos: () => void;
  onUnits: () => void;
}) => {
  const { data: photos } = useProductPhotos(product.id);
  const { data: units } = useProductUnits(product.id);
  const { selectedBranchId, selectedBranch } = useBranch();
  const photoCount = photos?.length ?? 0;
  const firstPhoto = photos?.[0];
  const hasUnits = units && units.length > 0;
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: branchStocks, isLoading: isLoadingStock } = useQuery<any[]>({
    queryKey: [api.inventory.consolidatedStock.path, product.id],
    queryFn: async () => {
      const res = await fetch(`/api/inventory/consolidated-stock/${product.id}`);
      if (!res.ok) throw new Error("Gagal mengambil data stok cabang");
      return res.json();
    },
    enabled: isExpanded,
  });

  return (
    <>
    <tr className={cn(
      "hover:bg-muted/20 transition-all duration-300 group premium-table-row border-b border-border/30",
      isExpanded && "bg-primary/[0.02] shadow-inner"
    )} data-testid={`row-product-${product.id}`}>
      {canManageSku && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="rounded"
            data-testid={`checkbox-product-${product.id}`}
          />
        </td>
      )}
      <td className="px-4 py-3">
        <button
          onClick={onPhotos}
          className="relative w-10 h-10 rounded-md overflow-hidden border border-border/50 flex items-center justify-center bg-muted/30 hover:ring-2 hover:ring-primary/20 transition-all"
          data-testid={`button-photos-${product.id}`}
        >
          {firstPhoto ? (
            <img src={firstPhoto.url} alt="" className="w-10 h-10 object-cover" />
          ) : product.photoUrl ? (
            <img src={product.photoUrl} alt="" className="w-10 h-10 object-cover" />
          ) : (
            <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
          )}
          {photoCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 no-default-hover-elevate no-default-active-elevate" variant="secondary">
              {photoCount}
            </Badge>
          )}
        </button>
      </td>
      <td className="px-4 py-3">
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-8 flex items-center gap-1.5 font-mono font-black text-[11px] rounded-lg transition-all",
            isExpanded ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-400 group-hover:text-slate-600"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {product.locationType === "gudang" && product.productCode ? product.productCode : product.sku}
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-foreground">{product.name}</span>
          {product.locationType === "gudang" && product.subCategory && (
            <span className="text-xs text-muted-foreground">{product.subCategory}</span>
          )}
          {hasUnits && (
            <span className="text-xs text-muted-foreground font-medium italic">
               UoM: {formatUnitDisplay(units)}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{product.category || "-"}</td>
      <td className="px-4 py-3 text-center">
        <Badge variant="outline" className={cn(
          "text-[10px] uppercase font-bold",
          product.productType === "raw_material" ? "border-amber-200 text-amber-700 bg-amber-50" :
          product.productType === "component" ? "border-indigo-200 text-indigo-700 bg-indigo-50" :
          "border-primary/20 text-primary bg-primary/5"
        )}>
          {product.productType === "raw_material" ? "Mentah" :
           product.productType === "component" ? "Komponen" : "Jadi"}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge variant={product.locationType === "gudang" ? "outline" : "secondary"} data-testid={`badge-location-${product.id}`}>
          {product.locationType === "gudang" ? (
            <><Warehouse className="w-3 h-3 mr-1" />Gudang</>
          ) : (
            <><Store className="w-3 h-3 mr-1" />Toko</>
          )}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1">
          <span className={product.currentStock <= (product.minStock || 0) ? "text-red-600 font-black flex items-center justify-end gap-1 px-2 py-0.5 bg-red-50 rounded-full" : "text-foreground font-bold"}>
            {product.currentStock <= (product.minStock || 0) && <AlertTriangle className="w-3 h-3" />}
            {product.currentStock.toLocaleString("id-ID")}
          </span>
          {selectedBranchId && (
            <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-bold border-amber-200 text-amber-600 bg-amber-50">
              {selectedBranch?.name || "LOKAL"}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right text-muted-foreground font-mono text-[10px]">
        {product.minStock || 0}
      </td>
      <td className="px-4 py-3 text-right font-bold text-primary">
        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(product.sellingPrice || 0)}
      </td>
      {canManageSku && (
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8" onClick={onUnits} title="Manage Units">
              <Layers className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8" onClick={onPhotos} title="Manage Photos">
              <Camera className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8" onClick={onEdit} title="Quick Edit">
              <Pencil className="w-4 h-4" />
            </Button>
            <DeleteProductButton id={product.id} name={product.name} />
          </div>
        </td>
      )}
    </tr>
    {isExpanded && (
      <tr className="bg-indigo-50/20 animate-in fade-in slide-in-from-top-1">
        <td colSpan={canManageSku ? 11 : 10} className="p-0 border-b border-indigo-100/50">
           <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-100">
                    <Globe className="w-4 h-4 text-indigo-600" />
                 </div>
                 <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Branch Availability Matrix</h4>
                    <p className="text-[10px] font-bold text-slate-500">Stok konsolidasi di seluruh cabang aktif</p>
                 </div>
              </div>

              {isLoadingStock ? (
                <div className="flex items-center gap-2 text-slate-400 p-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Memuat data global...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {branchStocks?.map((bs: any) => (
                    <div key={bs.branchId} className={cn(
                      "p-4 bg-white rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 group/item",
                      bs.currentStock <= bs.minStock ? "bg-red-50/30 border-red-100" : ""
                    )}>
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate max-w-[100px] group-hover/item:text-indigo-600 font-mono italic">
                            {bs.branchName}
                          </span>
                          <Badge variant="outline" className={cn(
                            "text-[8px] h-3 uppercase font-black px-1 border-none",
                            bs.isToko ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                          )}>
                            {bs.isToko ? "TOKO" : "GUDANG"}
                          </Badge>
                       </div>
                       <div className="flex items-baseline gap-2">
                          <span className={cn(
                            "text-xl font-black tracking-tight",
                            bs.currentStock <= bs.minStock ? "text-red-600" : "text-slate-900"
                          )}>
                            {bs.currentStock.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">pcs</span>
                       </div>
                       <div className="mt-2 text-[9px] font-bold text-slate-400 flex items-center gap-1.5 pt-2 border-t border-slate-50">
                          Min: <span className="text-slate-600 font-mono">{bs.minStock}</span>
                          {bs.currentStock <= bs.minStock && 
                            <Badge className="ml-auto bg-red-100 text-red-600 border-none text-[8px] font-black h-3.5 px-1 animate-pulse">REFILL</Badge>
                          }
                       </div>
                    </div>
                  ))}
                </div>
              )}
           </div>
        </td>
      </tr>
    )}
    </>
  );
});

// --- EDIT TABLE ROW ---
export function EditProductRow({ product, onCancel, onSaved }: { product: Product; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(product.name);
  const [currentStock, setCurrentStock] = useState(product.currentStock);
  const [unitCost, setUnitCost] = useState(product.unitCost || 0);
  const [sellingPrice, setSellingPrice] = useState(product.sellingPrice || 0);
  const [productType, setProductType] = useState<"finished_good" | "raw_material" | "component">(product.productType || "finished_good");
  const [minStock, setMinStock] = useState(product.minStock || 0);
  const [isTaxable, setIsTaxable] = useState(product.isTaxable ?? 1);
  const [taxRate, setTaxRate] = useState(product.taxRate || 11.0);
  const updateProduct = useUpdateProduct();

  const handleSave = () => {
    updateProduct.mutate(
      { id: product.id, name, currentStock, unitCost, sellingPrice, productType: productType as any, minStock, isTaxable, taxRate },
      { onSuccess: onSaved }
    );
  };

  return (
    <tr className="bg-primary/5 active-pulse-subtle" data-testid={`row-edit-product-${product.id}`}>
      <td className="px-4 py-3"></td>
      <td className="px-4 py-3">
        <div className="w-10 h-10 rounded-md bg-muted/50 flex items-center justify-center">
          <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
        </div>
      </td>
      <td className="px-4 py-3 font-mono font-medium text-foreground">{product.sku}</td>
      <td className="px-4 py-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 bg-white"
          data-testid={`input-edit-name-${product.id}`}
        />
      </td>
      <td className="px-4 py-3 text-muted-foreground">{product.category || "-"}</td>
      <td className="px-4 py-3 text-center">
        <Select value={productType} onValueChange={(v) => setProductType(v as any)}>
          <SelectTrigger className="w-24 h-8 text-[10px] uppercase font-bold bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="finished_good">Jadi</SelectItem>
            <SelectItem value="raw_material">Mentah</SelectItem>
            <SelectItem value="component">Komponen</SelectItem>
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3">
        <Badge variant={product.locationType === "gudang" ? "outline" : "secondary"}>
          {product.locationType === "gudang" ? "Gudang" : "Toko"}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <Input
          type="number"
          value={currentStock}
          onChange={(e) => setCurrentStock(parseInt(e.target.value) || 0)}
          className="w-20 ml-auto text-right h-9 bg-white"
          data-testid={`input-edit-stock-${product.id}`}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <Input
          type="number"
          value={minStock}
          onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
          className="w-16 ml-auto text-right text-[10px] h-7 bg-white"
          data-testid={`input-edit-min-stock-${product.id}`}
        />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col gap-1 items-end">
          <Input
            type="number"
            value={unitCost}
            onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
            className="w-24 text-right text-[10px] h-7 bg-white"
            placeholder="Modal"
          />
          <Input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
            className="w-24 text-right font-bold text-primary h-8 bg-white ring-1 ring-primary/20"
            placeholder="Jual"
          />
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[8px] uppercase font-bold text-muted-foreground">Tax</span>
            <Input
              type="number"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-10 text-[8px] h-5 px-1 text-right bg-white"
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={handleSave} disabled={updateProduct.isPending} data-testid={`button-save-edit-${product.id}`}>
            {updateProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-green-600" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={onCancel} data-testid={`button-cancel-edit-${product.id}`}>
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// --- GRID CARD ITEM ---
export function ProductCardItem({ product, onEdit, onPhotos }: { product: Product, onEdit: () => void, onPhotos: () => void }) {
  return (
    <Card className="border-0 shadow-lg shadow-gray-200/50 rounded-3xl overflow-hidden group hover:shadow-2xl transition-all duration-500 bg-white/80 backdrop-blur-md">
      <div className="relative aspect-square overflow-hidden bg-gray-50 border-b border-gray-100">
        <button onClick={onPhotos} className="w-full h-full">
            {product.photoUrl ? (
                <img src={product.photoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-200" />
                </div>
            )}
        </button>
        <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge className="bg-white/80 backdrop-blur-md text-gray-900 border-none shadow-sm text-[9px] font-black uppercase tracking-widest">{product.category}</Badge>
            {product.currentStock <= (product.minStock || 0) && (
                <Badge variant="destructive" className="animate-pulse shadow-lg shadow-red-200">LOW STOCK</Badge>
            )}
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{product.sku}</p>
            <h3 className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
        </div>
        
        <div className="flex justify-between items-end">
            <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Harga Jual</p>
                <p className="font-black text-primary">Rp {Number(product.sellingPrice).toLocaleString()}</p>
            </div>
            <div className="text-right">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Stok</p>
                <p className={cn("font-black", product.currentStock <= (product.minStock || 0) ? "text-red-600" : "text-gray-900")}>{product.currentStock.toLocaleString("id-ID")}</p>
            </div>
        </div>

        <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <Button className="flex-1 rounded-xl h-9 bg-gray-900 text-white text-xs font-bold hover:bg-primary transition-colors" onClick={onEdit}>Edit</Button>
            <Button variant="outline" className="h-9 w-9 rounded-xl border-gray-100 hover:bg-gray-50" onClick={onPhotos}><Camera className="w-4 h-4 text-gray-400" /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- MOBILE COMPONENTS ---
export const MobileProductCard = memo(({
  product,
  canManageSku,
  selected,
  onToggleSelect,
  onEdit,
  onPhotos,
  onUnits,
}: {
  product: Product;
  canManageSku: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onPhotos: () => void;
  onUnits: () => void;
}) => {
  const { data: photos } = useProductPhotos(product.id);
  const { selectedBranchId, selectedBranch } = useBranch();
  const firstPhoto = photos?.[0];

  return (
    <div className={cn(
      "bg-white border rounded-2xl p-4 shadow-sm transition-all duration-300",
      selected ? "ring-2 ring-primary border-primary/20 bg-primary/5" : "border-border/50 hover:border-primary/20"
    )}>
      <div className="flex items-start gap-4">
        {canManageSku && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="rounded mt-1.5"
          />
        )}
        <button
          onClick={onPhotos}
          className="w-16 h-16 rounded-xl overflow-hidden border border-border/50 flex items-center justify-center bg-muted/30 shrink-0"
        >
          {firstPhoto ? (
            <img src={firstPhoto.url} className="w-full h-full object-cover" alt="" />
          ) : product.photoUrl ? (
            <img src={product.photoUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-bold text-muted-foreground tracking-wider uppercase">
              {product.locationType === "gudang" && product.productCode ? product.productCode : product.sku}
            </span>
            <div className="flex items-center gap-1">
              <Badge variant={product.locationType === "gudang" ? "outline" : "secondary"} className="text-[9px] h-4 px-1 whitespace-nowrap">
                {product.locationType === "gudang" ? "GUDANG" : "TOKO"}
              </Badge>
              <Badge variant="outline" className={cn(
                "text-[9px] h-4 px-1 whitespace-nowrap uppercase font-bold",
                product.productType === "raw_material" ? "border-amber-200 text-amber-700 bg-amber-50" :
                product.productType === "component" ? "border-indigo-200 text-indigo-700 bg-indigo-50" :
                "border-primary/20 text-primary bg-primary/5"
              )}>
                {product.productType === "raw_material" ? "Mentah" :
                 product.productType === "component" ? "Komponen" : "Jadi"}
              </Badge>
            </div>
          </div>
          <h3 className="font-bold text-foreground leading-tight mt-1 line-clamp-2">{product.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 border-none font-medium">
              {product.category || "No Category"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-dashed border-border/50">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Stok / Harga</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-lg font-bold",
              product.currentStock <= (product.minStock || 0) ? "text-red-600 active-pulse" : "text-foreground"
            )}>
              {product.currentStock.toLocaleString("id-ID")}
              {product.currentStock <= (product.minStock || 0) && <span className="ml-1 text-[10px] font-black">(LOW)</span>}
            </span>
            {selectedBranchId && (
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-black border-amber-300 text-amber-700 bg-amber-50 shadow-sm transition-all duration-300">
                {selectedBranch?.name || "LOKAL"}
              </Badge>
            )}
            <span className="text-primary font-bold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(product.sellingPrice || 0)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {canManageSku && (
            <>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground bg-white" onClick={onUnits}>
                <Layers className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground bg-white" onClick={onEdit}>
                <Pencil className="w-4 h-4" />
              </Button>
              <DeleteProductButton id={product.id} name={product.name} />
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export function MobileEditProductCard({ product, onCancel, onSaved }: { product: Product; onCancel: () => void; onSaved: () => void }) {
  const [name, setName] = useState(product.name);
  const [currentStock, setCurrentStock] = useState(product.currentStock);
  const [unitCost, setUnitCost] = useState(product.unitCost || 0);
  const [sellingPrice, setSellingPrice] = useState(product.sellingPrice || 0);
  const [productType, setProductType] = useState<"finished_good" | "raw_material" | "component">(product.productType || "finished_good");
  const [minStock, setMinStock] = useState(product.minStock || 0);
  const [isTaxable, setIsTaxable] = useState(product.isTaxable ?? 1);
  const [taxRate, setTaxRate] = useState(product.taxRate || 11.0);
  const updateProduct = useUpdateProduct();

  const handleSave = () => {
    updateProduct.mutate(
      { id: product.id, name, currentStock, unitCost, sellingPrice, productType: productType as any, minStock, isTaxable, taxRate },
      { onSuccess: onSaved }
    );
  };

  return (
    <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-4 shadow-md animate-in fade-in zoom-in duration-200">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold text-primary/60 tracking-wider uppercase">{product.sku}</span>
          <Badge variant="outline" className="text-[9px] bg-white border-primary/20 text-primary">EDIT MODE</Badge>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Nama Produk</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white rounded-xl border-primary/10" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Harga Modal</label>
            <Input type="number" value={unitCost} onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)} className="bg-white rounded-xl border-primary/10 text-xs" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Harga Jual</label>
            <Input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)} className="bg-white rounded-xl border-primary/10 font-bold text-primary text-xs" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Tipe Produk</label>
            <Select value={productType} onValueChange={(v) => setProductType(v as any)}>
              <SelectTrigger className="bg-white rounded-xl border-primary/10 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="finished_good">Jadi</SelectItem>
                <SelectItem value="raw_material">Mentah</SelectItem>
                <SelectItem value="component">Komponen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Stok Min</label>
            <Input type="number" value={minStock} onChange={(e) => setMinStock(parseInt(e.target.value) || 0)} className="bg-white rounded-xl border-primary/10 text-xs h-9" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1 bg-primary text-white rounded-xl h-11" onClick={handleSave} disabled={updateProduct.isPending}>
            {updateProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan
          </Button>
          <Button variant="outline" className="rounded-xl h-11 border-border/50 bg-white" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- BUTTONS ---
export function DeleteProductButton({ id, name }: { id: number; name: string }) {
  const deleteProduct = useDeleteProduct();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl text-red-500 hover:text-red-600 bg-white border-red-50 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus <strong>{name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteProduct.mutate(id)} className="rounded-xl bg-destructive text-destructive-foreground">
            {deleteProduct.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
