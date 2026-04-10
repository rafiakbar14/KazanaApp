import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SaleWithItems } from "@shared/schema";

export function useInvoices() {
    const { toast } = useToast();

    const { data: invoices, isLoading } = useQuery<SaleWithItems[]>({
        queryKey: [api.erp.invoices.list.path],
        queryFn: async () => {
            const res = await fetch(api.erp.invoices.list.path);
            if (!res.ok) throw new Error("Gagal mengambil data invoice");
            return res.json();
        },
    });

    const createInvoice = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(api.erp.invoices.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Gagal membuat invoice");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.erp.invoices.list.path] });
            toast({ title: "Berhasil", description: "Invoice berhasil dibuat" });
        },
        onError: (err: any) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        },
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            const url = buildUrl(api.erp.invoices.updateStatus.path, { id });
            const res = await fetch(url, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Gagal memperbarui status invoice");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.erp.invoices.list.path] });
            toast({ title: "Berhasil", description: "Status invoice diperbarui" });
        },
    });

    return {
        invoices,
        isLoading,
        createInvoice,
        updateStatus,
    };
}
