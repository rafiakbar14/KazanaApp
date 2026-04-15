import * as React from "react";
import { useState, useRef, useEffect, useMemo, memo } from "react";
import {
  useProducts,
  useCategories,
  useImportExcel,
  useBulkDeleteProducts,
  useCategoryPriorities,
  useBulkResetStock,
  type ExcelImportResult,
} from "@/hooks/use-products";
import { useRole } from "@/hooks/use-role";
import { useBranch } from "@/hooks/use-branch";
import { api } from "@shared/routes";
import { 
  Box, Loader2, Package, LayoutGrid, List
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Sub-components
import { ProductHeader } from "@/components/products/ProductHeader";
import { ProductFilters } from "@/components/products/ProductFilters";
import { 
  ProductRow, EditProductRow, ProductCardItem, 
  MobileProductCard, MobileEditProductCard 
} from "@/components/products/ProductViewItems";
import { 
  CreateProductDialog, PhotoGalleryDialog, UnitManagementDialog, 
  CategoryPriorityDialog, ImportResultDialog 
} from "@/components/products/ProductDialogs";
import { MassPhotoImporter } from "@/components/MassPhotoImporter";

function getDefaultProductTab(role: string): string {
  if (role === "stock_counter_toko") return "toko";
  if (role === "stock_counter_gudang") return "gudang";
  return "semua";
}

export default function Products() {
  const { canManageSku, isAdmin, canCountToko, canCountGudang, role } = useRole();
  const { selectedBranchId, selectedBranch } = useBranch();
  const searchParams = new URLSearchParams(window.location.search);
  const forcedType = searchParams.get("type");

  const defaultTab = forcedType || getDefaultProductTab(role);
  const [locationType, setLocationType] = useState<string>(defaultTab);

  // Sync state if URL changes
  useEffect(() => {
    if (forcedType && forcedType !== locationType) {
      setLocationType(forcedType);
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    }
  }, [forcedType]);

  const queryLocationType = locationType === "semua" ? undefined : (locationType as any);
  const { data: products, isLoading: isInitialLoading } = useProducts(queryLocationType, selectedBranchId);
  const [deferredLoading, setDeferredLoading] = useState(true);

  useEffect(() => {
    if (!isInitialLoading) {
      const timer = setTimeout(() => setDeferredLoading(false), 50);
      return () => clearTimeout(timer);
    } else {
      setDeferredLoading(true);
    }
  }, [isInitialLoading]);

  const { data: categories } = useCategories();
  const { data: categoryPriorities } = useCategoryPriorities();
  const showAllTabs = role === "admin" || role === "sku_manager" || role === "stock_counter";
  
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [importResult, setImportResult] = useState<ExcelImportResult | null>(null);
  const [isImportResultOpen, setIsImportResultOpen] = useState(false);
  const [photosProductId, setPhotosProductId] = useState<number | null>(null);
  const [unitsProductId, setUnitsProductId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [categoryPriorityOpen, setCategoryPriorityOpen] = useState(false);
  const [massPhotoOpen, setMassPhotoOpen] = useState(false);

  const [gudangImportLoading, setGudangImportLoading] = useState(false);
  const importExcel = useImportExcel();
  const bulkDelete = useBulkDeleteProducts();
  const bulkResetStock = useBulkResetStock();
  const [bulkResetOpen, setBulkResetOpen] = useState(false);
  const [productsViewMode, setProductsViewMode] = useState<"table" | "grid">("table");
  const [visibleCount, setVisibleCount] = useState(20);
  
  const excelInputRef = useRef<HTMLInputElement>(null);
  const gudangImportRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const displayCategories = React.useMemo(() => {
    const fromTable = (categories || []).map(cat => typeof cat === 'string' ? cat : cat?.name).filter(Boolean);
    const fromProducts = (products || []).map(p => p.category?.trim()).filter(Boolean) as string[];
    return Array.from(new Set([...fromTable, ...fromProducts])).sort();
  }, [categories, products]);

  useEffect(() => {
    setVisibleCount(20);
  }, [locationType, categoryFilter, search]);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importExcel.mutate(file, {
        onSuccess: (result) => {
          setImportResult(result as any);
          setIsImportResultOpen(true);
        },
      });
      e.target.value = "";
    }
  };

  const handleGudangImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setGudangImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(api.excel.gudangImport.path, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal import");
      }
      const result = await res.json();
      setImportResult(result);
      setIsImportResultOpen(true);
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    } catch (err: any) {
      toast({ title: "Import Gagal", description: err.message, variant: "destructive" });
    } finally {
      setGudangImportLoading(false);
    }
  };

  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    const priorityMap = new Map((categoryPriorities || []).map(p => [p.categoryName, p.sortOrder]));
    const searchLower = search.toLowerCase();
    
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchLower) || p.sku.toLowerCase().includes(searchLower);
      const matchesCategory = categoryFilter === "all" || (String(p.category || "").trim() === String(categoryFilter || "").trim());
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      const aPriority = priorityMap.get(String(a.category || "").trim()) ?? 999;
      const bPriority = priorityMap.get(String(b.category || "").trim()) ?? 999;
      return aPriority !== bPriority ? aPriority - bPriority : 0;
    });
  }, [products, search, categoryFilter, categoryPriorities]);

  return (
    <div className="space-y-6 animate-enter pb-20">
      {/* 1. HEADER & GLOBAL ACTIONS */}
      <ProductHeader 
        locationType={locationType}
        canManageSku={canManageSku}
        selectedIds={selectedIds}
        bulkResetOpen={bulkResetOpen}
        setBulkResetOpen={setBulkResetOpen}
        bulkDeleteOpen={bulkDeleteOpen}
        setBulkDeleteOpen={setBulkDeleteOpen}
        bulkResetStock={bulkResetStock}
        bulkDelete={bulkDelete}
        setSelectedIds={setSelectedIds}
        gudangImportLoading={gudangImportLoading}
        gudangImportRef={gudangImportRef}
        handleGudangImport={handleGudangImport}
        excelInputRef={excelInputRef}
        importExcel={importExcel}
        handleExcelUpload={handleExcelUpload}
        setMassPhotoOpen={setMassPhotoOpen}
        setIsCreateOpen={setIsCreateOpen}
        role={role}
        toast={toast}
      />

      {/* 2. FILTERS & NAVIGATION */}
      <ProductFilters 
        locationType={locationType}
        setLocationType={setLocationType}
        showAllTabs={showAllTabs}
        search={search}
        setSearch={setSearch}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        displayCategories={displayCategories}
        setCategoryPriorityOpen={setCategoryPriorityOpen}
        productsViewMode={productsViewMode}
        setProductsViewMode={setProductsViewMode}
      />

      {/* 3. PRODUCT LIST VIEW */}
      <div className={cn(
        "bg-white/50 backdrop-blur-md border border-border/50 rounded-3xl overflow-hidden min-h-[400px] transition-all duration-500",
        locationType === "toko" ? "shadow-blue-900/5 shadow-2xl" :
        locationType === "gudang" ? "shadow-amber-900/5 shadow-2xl" : "shadow-sm"
      )}>
        {isInitialLoading || deferredLoading ? (
          <LoadingSkeleton />
        ) : filteredProducts?.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {productsViewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
                {filteredProducts?.slice(0, visibleCount).map((product) => (
                  <ProductCardItem key={product.id} product={product} onEdit={() => setEditingId(product.id)} onPhotos={() => setPhotosProductId(product.id)} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      {canManageSku && (
                        <th className="px-4 py-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={filteredProducts ? (filteredProducts.length > 0 && selectedIds.length === filteredProducts.length) : false}
                            onChange={() => {
                              if (!filteredProducts) return;
                              setSelectedIds(selectedIds.length === filteredProducts.length ? [] : filteredProducts.map(p => p.id));
                            }}
                            className="rounded"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 font-bold text-muted-foreground w-16 uppercase text-[10px] tracking-widest">Foto</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground w-32 uppercase text-[10px] tracking-widest">SKU</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground uppercase text-[10px] tracking-widest">Nama</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground w-32 uppercase text-[10px] tracking-widest">Kategori</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground w-24 text-center uppercase text-[10px] tracking-widest">Tipe</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground w-28 uppercase text-[10px] tracking-widest">Lokasi</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground text-right w-24 uppercase text-[10px] tracking-widest">Stok</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground text-right w-20 uppercase text-[10px] tracking-widest">Min</th>
                      <th className="px-4 py-3 font-bold text-muted-foreground text-right w-32 uppercase text-[10px] tracking-widest">Harga</th>
                      {canManageSku && <th className="px-4 py-3 font-bold text-muted-foreground text-right w-36 uppercase text-[10px] tracking-widest">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredProducts?.slice(0, visibleCount).map((product) =>
                      editingId === product.id ? (
                        <EditProductRow key={product.id} product={product} onCancel={() => setEditingId(null)} onSaved={() => setEditingId(null)} />
                      ) : (
                        <ProductRow
                          key={product.id}
                          product={product}
                          canManageSku={canManageSku}
                          selected={selectedIds.includes(product.id)}
                          onToggleSelect={() => setSelectedIds(prev => prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id])}
                          onEdit={() => setEditingId(product.id)}
                          onPhotos={() => setPhotosProductId(product.id)}
                          onUnits={() => setUnitsProductId(product.id)}
                        />
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile View */}
            <div className="md:hidden grid grid-cols-1 gap-4 p-4">
              {filteredProducts?.slice(0, visibleCount).map((p) =>
                editingId === p.id ? (
                  <MobileEditProductCard key={p.id} product={p} onCancel={() => setEditingId(null)} onSaved={() => setEditingId(null)} />
                ) : (
                  <MobileProductCard
                    key={p.id}
                    product={p}
                    canManageSku={canManageSku}
                    selected={selectedIds.includes(p.id)}
                    onToggleSelect={() => setSelectedIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                    onEdit={() => setEditingId(p.id)}
                    onPhotos={() => setPhotosProductId(p.id)}
                    onUnits={() => setUnitsProductId(p.id)}
                  />
                )
              )}
            </div>

            {/* Pagination / Load More */}
            {filteredProducts && filteredProducts.length > visibleCount && (
              <div className="p-8 flex justify-center border-t border-border/30">
                <button
                  onClick={() => setVisibleCount(prev => prev + 50)}
                  className="px-12 py-3 rounded-2xl bg-white border border-border hover:border-primary/50 text-sm font-black transition-all shadow-sm hover:shadow-lg"
                >
                  LOAD MORE (+{filteredProducts.length - visibleCount})
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 4. MODALS & DIALOGS */}
      <CreateProductDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <ImportResultDialog result={importResult} open={isImportResultOpen} onOpenChange={setIsImportResultOpen} />
      <PhotoGalleryDialog productId={photosProductId} open={photosProductId !== null} onOpenChange={(open) => !open && setPhotosProductId(null)} canManage={canManageSku} />
      <UnitManagementDialog productId={unitsProductId} open={unitsProductId !== null} onOpenChange={(open) => !open && setUnitsProductId(null)} />
      <CategoryPriorityDialog open={categoryPriorityOpen} onOpenChange={setCategoryPriorityOpen} categories={displayCategories} />
      <MassPhotoImporter open={massPhotoOpen} onOpenChange={setMassPhotoOpen} />
    </div>
  );
}

// --- HELPER COMPONENTS ---

function LoadingSkeleton() {
  return (
    <div className="p-0">
      <div className="bg-muted/30 border-b border-border/50 p-4 flex gap-4">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-24" />)}
      </div>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="p-4 border-b border-border/10 flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full ml-auto" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-32 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Package className="w-10 h-10 text-muted-foreground/30" />
      </div>
      <h3 className="text-2xl font-black text-foreground">Katalog Kosong</h3>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">Kami tidak menemukan produk yang Anda cari. Coba ubah pencarian atau tambahkan produk baru.</p>
    </div>
  );
}
