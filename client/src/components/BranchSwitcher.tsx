import { useBranch } from "@/hooks/use-branch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, MapPin, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

export function BranchSwitcher() {
  const { branches, selectedBranchId, setSelectedBranchId, isLoading } = useBranch();

  if (isLoading) {
    return (
      <div className="h-10 w-full animate-pulse bg-white/10 rounded-xl" />
    );
  }

  return (
    <div className="space-y-2">
      <Select
        value={selectedBranchId?.toString() || "all"}
        onValueChange={(val) => setSelectedBranchId(val === "all" ? null : parseInt(val))}
      >
        <SelectTrigger className="h-12 bg-white/10 border-white/20 text-white rounded-xl focus:ring-amber-500/50 hover:bg-white/15 transition-all backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500/20 p-1.5 rounded-lg border border-amber-500/30">
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-200/70 leading-none mb-1">
                Lokasi Aktif
              </p>
              <div className="max-w-[120px] truncate">
                <SelectValue placeholder="Semua Cabang" />
              </div>
            </div>
          </div>
        </SelectTrigger>
        <SelectContent className="bg-[#002B80] border-white/20 text-white rounded-xl shadow-2xl">
          <SelectItem value="all" className="focus:bg-white/10 focus:text-white cursor-pointer py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 opacity-70" />
              <span className="font-bold">Semua Cabang (Global)</span>
            </div>
          </SelectItem>
          {branches.map((branch) => (
            <SelectItem 
              key={branch.id} 
              value={branch.id.toString()}
              className="focus:bg-white/10 focus:text-white cursor-pointer py-3 rounded-lg"
            >
              <div className="flex items-center gap-2">
                {branch.type === "warehouse" ? (
                   <Warehouse className="w-4 h-4 text-blue-300" />
                ) : (
                   <Building2 className="w-4 h-4 text-emerald-300" />
                )}
                <div>
                  <p className="font-bold">{branch.name}</p>
                  <p className="text-[10px] opacity-60 uppercase tracking-tighter">{branch.type}</p>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
