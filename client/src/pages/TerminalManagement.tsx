import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Loader2, Plus, Terminal, RefreshCw, Trash2, ShieldCheck, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users } from "lucide-react";


export default function TerminalManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: devices, isLoading: isLoadingDevices } = useQuery<any[]>({
        queryKey: [api.pos.devices.list.path],
    });

    const { data: codes, isLoading: isLoadingCodes } = useQuery<any[]>({
        queryKey: [api.pos.devices.registrationCodes.list.path],
    });

    const { data: users, isLoading: isLoadingUsers } = useQuery<any[]>({
        queryKey: [api.roles.list.path],
    });

    const generateCodeMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(api.pos.devices.registrationCodes.generate.path, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Gagal membuat kode");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.pos.devices.registrationCodes.list.path] });
            toast({ title: "Berhasil", description: "Kode registrasi baru telah dibuat." });
        },
    });

    const deleteDeviceMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await fetch(api.pos.devices.delete.path.replace(":id", id.toString()), {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Gagal menghapus terminal");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.pos.devices.list.path] });
            toast({ title: "Berhasil", description: "Terminal telah dihapus." });
        },
    });

    const assignUserMutation = useMutation({
        mutationFn: async ({ deviceId, userId }: { deviceId: string, userId: string | null }) => {
            const res = await fetch(`/api/pos/devices/${deviceId}/assign`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            if (!res.ok) throw new Error("Gagal memperbarui penugasan");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [api.pos.devices.list.path] });
            toast({ title: "Berhasil", description: "Penugasan kasir diperbarui." });
        },
        onError: (err: Error) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-enter">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Terminal POS</h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Kelola perangkat kasir dan buat kode registrasi baru.</p>
                </div>
                <Button
                    onClick={() => generateCodeMutation.mutate()}
                    disabled={generateCodeMutation.isPending}
                    className="bg-primary hover:bg-primary/90 rounded-xl px-6 h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    {generateCodeMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                    BUAT KODE REGISTRASI
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="border-b border-slate-50 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <Terminal className="w-5 h-5 text-primary" />
                                </div>
                                <CardTitle className="text-xl font-bold">Terminal Terdaftar</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingDevices ? (
                                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                            ) : (
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent border-slate-100">
                                            <TableHead className="font-bold text-slate-400 py-4 px-6 text-[10px] uppercase tracking-widest">Nama / Device ID</TableHead>
                                            <TableHead className="font-bold text-slate-400 py-4 px-6 text-[10px] uppercase tracking-widest">Petugas Kasir</TableHead>
                                            <TableHead className="font-bold text-slate-400 py-4 px-6 text-[10px] uppercase tracking-widest">Status</TableHead>
                                            <TableHead className="font-bold text-slate-400 py-4 px-6 text-[10px] uppercase tracking-widest">Terdaftar Pada</TableHead>
                                            <TableHead className="text-right px-6"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {devices?.map((device) => (
                                            <TableRow key={device.id} className="group border-slate-50 hover:bg-slate-50/30 transition-colors">
                                                <TableCell className="py-4 px-6">
                                                    <div className="font-bold text-slate-900">{device.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase">{device.deviceId}</div>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <Select
                                                        value={device.assignedUserId || "none"}
                                                        onValueChange={(val) => assignUserMutation.mutate({ deviceId: device.deviceId, userId: val === "none" ? null : val })}
                                                        disabled={assignUserMutation.isPending}
                                                    >
                                                        <SelectTrigger className="w-[180px] h-9 rounded-lg border-slate-200 text-xs font-semibold">
                                                            <div className="flex items-center gap-2 truncate">
                                                                <Users className="w-3 h-3 text-slate-400" />
                                                                <SelectValue placeholder="Semua Kasir" />
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-slate-200">
                                                            <SelectItem value="none" className="text-xs font-semibold text-slate-500">Bisa Diakses Semua</SelectItem>
                                                            {users?.filter(u => u.role === 'cashier' || u.role === 'admin').map((u: any) => (
                                                                <SelectItem key={u.userId} value={u.userId} className="text-xs font-semibold">
                                                                    {u.firstName || u.username} ({u.role === 'admin' ? 'Admin' : 'Kasir'})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="py-4 px-6">
                                                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wider">
                                                        <ShieldCheck className="w-3 h-3" />
                                                        AKTIF
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-slate-500 font-medium text-sm">
                                                    {format(new Date(device.createdAt), 'dd MMM yyyy HH:mm')}
                                                </TableCell>
                                                <TableCell className="py-4 px-6 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => deleteDeviceMutation.mutate(device.id)}
                                                        className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {devices?.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-40 text-center text-slate-400 font-medium">
                                                    Belum ada terminal terdaftar.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-slate-200/60 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="border-b border-slate-50 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-amber-500" />
                                </div>
                                <CardTitle className="text-xl font-bold">Kode Aktif</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {isLoadingCodes ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            ) : (
                                <div className="space-y-4">
                                    {codes?.map((code) => (
                                        <div key={code.id} className="p-6 rounded-2xl bg-slate-900 text-white shadow-xl relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                                <RefreshCw className="w-12 h-12" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3">Kode Registrasi</div>
                                                <div className="text-4xl font-black tracking-[0.2em] mb-4">{code.code}</div>
                                                <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                                    <Clock className="w-3 h-3" />
                                                    Berakhir: {format(new Date(code.expiresAt), 'HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {codes?.length === 0 && (
                                        <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-slate-100 text-slate-400 text-sm font-medium">
                                            Tidak ada kode aktif. Klik tombol di atas untuk membuat kode baru.
                                        </div>
                                    )}

                                    <div className="mt-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
                                        <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                                            TIPS: Gunakan kode di atas pada perangkat baru di halaman Kasir untuk menghubungkan perangkat tersebut ke toko Anda. Kode berlaku selama 10 menit.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
