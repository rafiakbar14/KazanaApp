import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type Bom, type InsertBom, type BomItem, type InsertBomItem, type AssemblySession, type InsertAssemblySession, type BomWithItems, type AssemblySessionWithBOM } from "@shared/schema";
import { useToast } from "./use-toast";

export function useBOMs() {
    return useQuery<Bom[]>({
        queryKey: [api.production.boms.list.path],
    });
}

export function useBOM(id: number) {
    return useQuery<BomWithItems>({
        queryKey: [buildUrl(api.production.boms.get.path, { id })],
        enabled: !!id,
    });
}

export function useCreateBOM() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: Omit<InsertBom, "userId">) => {
            const res = await fetch(api.production.boms.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json() as Promise<Bom>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.production.boms.list.path] });
            toast({ title: "BOM Berhasil Dibuat", description: "Resep produksi baru telah terdaftar." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal Membuat BOM", description: error.message, variant: "destructive" });
        },
    });
}

export function useAddBOMItem() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ bomId, ...data }: InsertBomItem) => {
            const res = await fetch(buildUrl(api.production.boms.addItem.path, { bomId }), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json() as Promise<BomItem>;
        },
        onSuccess: (_, { bomId }) => {
            queryClient.invalidateQueries({ queryKey: [buildUrl(api.production.boms.get.path, { id: bomId })] });
            toast({ title: "Bahan Baku Ditambahkan", description: "Item telah masuk ke resep BOM." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal Menambah Bahan", description: error.message, variant: "destructive" });
        },
    });
}

export function useRemoveBOMItem() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ bomId, itemId }: { bomId: number, itemId: number }) => {
            const res = await fetch(buildUrl(api.production.boms.removeItem.path, { bomId, itemId }), {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(await res.text());
        },
        onSuccess: (_, { bomId }) => {
            queryClient.invalidateQueries({ queryKey: [buildUrl(api.production.boms.get.path, { id: bomId })] });
            toast({ title: "Bahan Baku Dihapus", description: "Item telah dihapus dari resep BOM." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal Menghapus Bahan", description: error.message, variant: "destructive" });
        },
    });
}

export function useAssemblySessions() {
    return useQuery<AssemblySession[]>({
        queryKey: [api.production.sessions.list.path],
    });
}

export function useAssemblySession(id: number) {
    return useQuery<AssemblySessionWithBOM>({
        queryKey: [buildUrl(api.production.sessions.get.path, { id })],
        enabled: !!id,
    });
}

export function useCreateAssemblySession() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: Omit<InsertAssemblySession, "userId">) => {
            const res = await fetch(api.production.sessions.create.path, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json() as Promise<AssemblySession>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.production.sessions.list.path] });
            toast({ title: "Sesi Produksi Dimulai", description: "Catatan produksi baru telah dibuat." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal Memulai Produksi", description: error.message, variant: "destructive" });
        },
    });
}

export function useCompleteAssemblySession() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(buildUrl(api.production.sessions.complete.path, { id }), {
                method: "POST",
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json() as Promise<AssemblySession>;
        },
        onSuccess: (session) => {
            queryClient.invalidateQueries({ queryKey: [api.production.sessions.list.path] });
            queryClient.invalidateQueries({ queryKey: [buildUrl(api.production.sessions.get.path, { id: session.id })] });
            toast({ title: "Produksi Final", description: "Stok telah diperbarui secara otomatis." });
        },
        onError: (error: Error) => {
            toast({ title: "Gagal Finalisasi", description: error.message, variant: "destructive" });
        },
    });
}
