import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RestaurantTable } from "@shared/schema";
import { Loader2, Plus, Users, Utensils } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FloorMapProps {
  onTableSelect?: (table: RestaurantTable) => void;
  selectedTableId?: number;
  readOnly?: boolean;
}

export function FloorMap({ onTableSelect, selectedTableId, readOnly = false }: FloorMapProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tables, isLoading } = useQuery<RestaurantTable[]>({
    queryKey: ["/api/tables"],
  });

  const updateTableStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/tables/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tables"] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "occupied": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "reserved": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "cleaning": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {tables?.map((table) => (
          <Card 
            key={table.id}
            className={cn(
              "relative overflow-hidden cursor-pointer transition-all hover:scale-105 active:scale-95 group",
              selectedTableId === table.id ? "ring-2 ring-primary border-primary Shadow-lg" : "hover:border-primary/50",
              table.status === "occupied" && "opacity-90"
            )}
            onClick={() => table.status === "available" && onTableSelect?.(table)}
          >
            <CardHeader className="p-3 pb-0">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getStatusColor(table.status))}>
                  {table.status.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span className="text-xs font-medium">{table.capacity}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 text-center">
              <div className="mb-2 flex justify-center">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center shadow-inner",
                  table.status === "available" ? "bg-green-500/5 text-green-600" : 
                  table.status === "occupied" ? "bg-rose-500/5 text-rose-600" : "bg-slate-500/5 text-slate-600"
                )}>
                  <Utensils className="h-6 w-6" />
                </div>
              </div>
              <h3 className="font-bold text-lg">MEJA {table.tableNumber}</h3>
              {table.status === "occupied" && (
                <p className="text-[10px] text-muted-foreground mt-1 animate-pulse">Sedang Makan</p>
              )}
            </CardContent>
            
            {selectedTableId === table.id && (
              <div className="absolute top-0 right-0 p-1">
                <div className="bg-primary text-primary-foreground rounded-full p-0.5">
                  <Plus className="h-3 w-3 rotate-45" />
                </div>
              </div>
            )}
          </Card>
        ))}
        
        {!readOnly && (
          <Card className="border-dashed flex items-center justify-center p-8 hover:bg-muted/50 cursor-pointer transition-colors group">
            <div className="text-center">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary">Tambah Meja</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
