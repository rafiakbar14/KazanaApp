import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type OutboundSession, type OutboundSessionWithItems, type OutboundItem, type OutboundItemPhoto } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useOutboundSessions() {
    return useQuery<OutboundSession[]>({
        queryKey: [api.outbound.list.path],
        queryFn: async () => {
            const res = await fetch(api.outbound.list.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch outbound sessions");
            return res.json();
        },
    });
}

export function useOutboundSession(id: number) {
    return useQuery<OutboundSessionWithItems>({
        queryKey: [api.outbound.get.path, id],
        queryFn: async () => {
            const url = buildUrl(api.outbound.get.path, { id });
            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to fetch session details");
            }
            return res.json();
        },
        enabled: !!id,
    });
}

export function useCreateOutboundSession() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { title: string; notes?: string; toBranchId?: number }) => {
            const res = await fetch(api.outbound.create.path, {
                method: api.outbound.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to start outbound session");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.outbound.list.path] });
            toast({ title: "Session Created", description: "New outbound session initialized." });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useCompleteOutboundSession() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: number) => {
            const url = buildUrl(api.outbound.complete.path, { id });
            const res = await fetch(url, { method: api.outbound.complete.method, credentials: "include" });
            if (!res.ok) throw new Error("Failed to complete session");
            return res.json();
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: [api.outbound.list.path] });
            queryClient.invalidateQueries({ queryKey: [api.outbound.get.path, id] });
            toast({ title: "Session Completed", description: "Outbound stock has been removed from inventory." });
        },
    });
}

export function useAddOutboundItem() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ sessionId, productId, quantityShipped, notes }: { sessionId: number; productId: number; quantityShipped: number; notes?: string }) => {
            const url = buildUrl(api.outbound.addItem.path, { sessionId });
            const res = await fetch(url, {
                method: api.outbound.addItem.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantityShipped, notes }),
                credentials: "include",
            });

            if (!res.ok) throw new Error("Failed to add item");
            return res.json();
        },
        onSuccess: (_, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: [api.outbound.get.path, sessionId] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useRemoveOutboundItem() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ sessionId, itemId }: { sessionId: number; itemId: number }) => {
            const url = buildUrl(api.outbound.removeItem.path, { sessionId, itemId });
            const res = await fetch(url, { method: api.outbound.removeItem.method, credentials: "include" });
            if (!res.ok) throw new Error("Failed to remove item");
        },
        onSuccess: (_, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: [api.outbound.get.path, sessionId] });
        },
    });
}

export function useUploadOutboundPhoto() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ sessionId, itemId, file }: { sessionId: number; itemId: number; file: File }) => {
            const url = buildUrl(api.outbound.uploadPhoto.path, { sessionId, itemId });
            const formData = new FormData();
            formData.append("photo", file);
            const res = await fetch(url, {
                method: "POST",
                body: formData,
                credentials: "include",
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Upload failed");
            }
            return res.json();
        },
        onSuccess: (_, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: [api.outbound.get.path, sessionId] });
            toast({ title: "Foto Berhasil Diupload", description: "Foto barang keluar sudah tersimpan." });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useSaveOutboundSignatures() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, senderName, driverName, receiverName, senderSignature, driverSignature, receiverSignature }: { id: number; senderName?: string; driverName?: string; receiverName?: string; senderSignature?: string; driverSignature?: string; receiverSignature?: string }) => {
            const url = buildUrl(api.outbound.saveSignatures.path, { id });
            const res = await fetch(url, {
                method: api.outbound.saveSignatures.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderName, driverName, receiverName, senderSignature, driverSignature, receiverSignature }),
                credentials: "include",
            });

            if (!res.ok) throw new Error("Failed to save signatures");
            return res.json();
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [api.outbound.get.path, id] });
            toast({ title: "Tanda Tangan Tersimpan", description: "Data pengiriman sudah diperbarui." });
        },
    });
}
