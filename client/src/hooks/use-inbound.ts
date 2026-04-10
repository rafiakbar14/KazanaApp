import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InboundSession, type InboundSessionWithItems, type InboundItem, type InboundItemPhoto } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useInboundSessions() {
    return useQuery<InboundSession[]>({
        queryKey: [api.inbound.list.path],
        queryFn: async () => {
            const res = await fetch(api.inbound.list.path, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch inbound sessions");
            return res.json();
        },
    });
}

export function useInboundSession(id: number) {
    return useQuery<InboundSessionWithItems>({
        queryKey: [api.inbound.get.path, id],
        queryFn: async () => {
            const url = buildUrl(api.inbound.get.path, { id });
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

export function useCreateInboundSession() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (data: { title: string; notes?: string }) => {
            const res = await fetch(api.inbound.create.path, {
                method: api.inbound.create.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
                credentials: "include",
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || "Failed to start inbound session");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.inbound.list.path] });
            toast({ title: "Session Created", description: "New inbound session initialized." });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useCompleteInboundSession() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: number) => {
            const url = buildUrl(api.inbound.complete.path, { id });
            const res = await fetch(url, { method: api.inbound.complete.method, credentials: "include" });
            if (!res.ok) throw new Error("Failed to complete session");
            return res.json();
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: [api.inbound.list.path] });
            queryClient.invalidateQueries({ queryKey: [api.inbound.get.path, id] });
            toast({ title: "Session Completed", description: "Inbound stock has been added to inventory." });
        },
    });
}

export function useAddInboundItem() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ sessionId, productId, quantityReceived, notes }: { sessionId: number; productId: number; quantityReceived: number; notes?: string }) => {
            const url = buildUrl(api.inbound.addItem.path, { sessionId });
            const res = await fetch(url, {
                method: api.inbound.addItem.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId, quantityReceived, notes }),
                credentials: "include",
            });

            if (!res.ok) throw new Error("Failed to add item");
            return res.json();
        },
        onSuccess: (_, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: [api.inbound.get.path, sessionId] });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useRemoveInboundItem() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ sessionId, itemId }: { sessionId: number; itemId: number }) => {
            const url = buildUrl(api.inbound.removeItem.path, { sessionId, itemId });
            const res = await fetch(url, { method: api.inbound.removeItem.method, credentials: "include" });
            if (!res.ok) throw new Error("Failed to remove item");
        },
        onSuccess: (_, { sessionId }) => {
            queryClient.invalidateQueries({ queryKey: [api.inbound.get.path, sessionId] });
        },
    });
}

export function useUploadInboundPhoto() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ sessionId, itemId, file }: { sessionId: number; itemId: number; file: File }) => {
            const url = buildUrl(api.inbound.uploadPhoto.path, { sessionId, itemId });
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
            queryClient.invalidateQueries({ queryKey: [api.inbound.get.path, sessionId] });
            toast({ title: "Foto Berhasil Diupload", description: "Foto barang masuk sudah tersimpan." });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });
}

export function useSaveInboundSignatures() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, senderName, receiverName, senderSignature, receiverSignature }: { id: number; senderName: string; receiverName: string; senderSignature: string; receiverSignature: string }) => {
            const url = buildUrl(api.inbound.saveSignatures.path, { id });
            const res = await fetch(url, {
                method: api.inbound.saveSignatures.method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senderName, receiverName, senderSignature, receiverSignature }),
                credentials: "include",
            });

            if (!res.ok) throw new Error("Failed to save signatures");
            return res.json();
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: [api.inbound.get.path, id] });
            toast({ title: "Tanda Tangan Tersimpan", description: "Data penerimaan sudah diperbarui." });
        },
    });
}
