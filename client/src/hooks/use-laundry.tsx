import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { OrderStatusLog } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useLaundry() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading: isLoadingOrders } = useQuery<any[]>({
    queryKey: ["/api/pos/sales", "laundry"],
    queryFn: async () => {
      // Fetch sales that have laundry items or category
      const res = await fetch("/api/pos/sales");
      const sales = await res.json();
      // Simple filter for demo: sales that have category 'Laundry' or metadata with modifiers
      return sales.filter((s: any) => 
        s.items?.some((i: any) => i.product?.category?.toLowerCase() === "laundry")
      );
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, statusName, notes }: { orderId: string, statusName: string, notes?: string }) => {
      return await apiRequest("POST", `/api/orders/${orderId}/logs`, {
        statusName,
        notes,
        createdBy: "Staff" // Fallback
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", variables.orderId, "logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/sales", "laundry"] });
      toast({ title: "Status Diperbarui", description: `Pesanan #${variables.orderId} sekarang: ${variables.statusName}` });
    }
  });

  const getLogs = (orderId: string) => {
    return useQuery<OrderStatusLog[]>({
      queryKey: ["/api/orders", orderId, "logs"],
      queryFn: async () => {
        const res = await fetch(`/api/orders/${orderId}/logs`);
        return res.json();
      },
      enabled: !!orderId
    });
  };

  return {
    orders,
    isLoadingOrders,
    updateStatus,
    getLogs
  };
}
