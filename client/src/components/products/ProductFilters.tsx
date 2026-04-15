import * as React from "react";
import { 
  Store, Warehouse, Package, Search, Filter, 
  ListOrdered, LayoutGrid, List 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  locationType: string;
  setLocationType: (val: string) => void;
  showAllTabs: boolean;
  search: string;
  setSearch: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  displayCategories: string[];
  setCategoryPriorityOpen: (open: boolean) => void;
  productsViewMode: "table" | "grid";
  setProductsViewMode: (mode: "table" | "grid") => void;
}

export function ProductFilters({
  locationType,
  setLocationType,
  showAllTabs,
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  displayCategories,
  setCategoryPriorityOpen,
  productsViewMode,
  setProductsViewMode,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 border-t border-border/10 pt-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-muted/50 p-1 rounded-2xl border border-border/50 shadow-inner flex items-center backdrop-blur-sm">
          <button
            onClick={() => setLocationType("toko")}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
              locationType === "toko"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.05]"
                : "text-muted-foreground hover:bg-white/50"
            )}
            data-testid="button-mode-toko"
          >
            <Store className="w-4 h-4" />
            <span>Toko</span>
          </button>
          <button
            onClick={() => setLocationType("gudang")}
            className={cn(
              "flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
              locationType === "gudang"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-200 scale-[1.05]"
                : "text-muted-foreground hover:bg-white/50"
            )}
            data-testid="button-mode-gudang"
          >
            <Warehouse className="w-4 h-4" />
            <span>Gudang</span>
          </button>
        </div>

        {showAllTabs && (
          <Button
            variant={locationType === "semua" ? "default" : "outline"}
            onClick={() => setLocationType("semua")}
            className={cn(
              "rounded-2xl font-bold h-10 px-6 transition-all duration-300",
              locationType === "semua"
                ? "bg-slate-800 text-white shadow-lg shadow-slate-200"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
            data-testid="button-mode-semua"
          >
            <Package className="w-4 h-4 mr-2" />
            Tampilkan Semua
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap flex-1 lg:justify-end">
        <div className="relative flex-1 lg:flex-none lg:w-64 min-w-[200px] group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Cari SKU atau Nama..."
            className="pl-9 bg-white border-border/50 rounded-xl focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-products"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44 bg-white border-border/50 rounded-xl shadow-sm" data-testid="select-category-filter">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-border shadow-xl rounded-xl">
            <SelectItem value="all">Semua Kategori</SelectItem>
            {displayCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setCategoryPriorityOpen(true)} 
          className="rounded-xl bg-white border-border/50 hover:bg-slate-50 shadow-sm" 
          data-testid="button-category-priority"
        >
          <ListOrdered className="w-4 h-4 mr-2" />
          Urutan
        </Button>
        <div className="flex bg-white/50 p-1 rounded-xl border border-border/50 shadow-sm ml-2 backdrop-blur-sm">
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 rounded-lg transition-all duration-300", productsViewMode === "grid" ? "bg-primary text-white shadow-md scale-110" : "text-gray-400")}
                onClick={() => setProductsViewMode("grid")}
            >
                <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 rounded-lg transition-all duration-300", productsViewMode === "table" ? "bg-primary text-white shadow-md scale-110" : "text-gray-400")}
                onClick={() => setProductsViewMode("table")}
            >
                <List className="w-4 h-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}
