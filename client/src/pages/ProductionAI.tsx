import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { BrainCircuit, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function ProductionAI() {
    const { toast } = useToast();

    const predictMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(api.production.predict.path, { method: "POST" });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Gagal mendapatkan prediksi AI");
            }
            return res.json();
        },
        onError: (err: Error) => {
            toast({ title: "Gagal", description: err.message, variant: "destructive" });
        }
    });

    return (
        <div className="space-y-6 animate-in fade-in pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <BrainCircuit className="w-8 h-8 text-indigo-600" />
                        Smart Planner AI
                    </h1>
                    <p className="text-slate-500 mt-1">Sistem Cerdas Penganalisa Kebutuhan Produksi Harian berbasis Google Gemini.</p>
                </div>
            </div>

            <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-20" />
                <CardContent className="p-8 relative z-10 flex flex-col items-center justify-center text-center min-h-[400px]">

                    {!predictMutation.data && !predictMutation.isPending && (
                        <div className="max-w-md mx-auto space-y-6">
                            <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-indigo-200 transition-all hover:scale-110 duration-500">
                                <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Siap Menganalisa Data Anda</h3>
                                <p className="text-slate-500 text-sm">AI akan membaca histori penjualan toko, sisa stok gudang, dan memberikan rekomendasi produksi yang paling optimal agar Anda tidak rugi atau kehabisan barang.</p>
                            </div>
                            <Button
                                onClick={() => predictMutation.mutate()}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 h-14 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95"
                            >
                                Generate Rekomendasi Sekarang
                            </Button>
                        </div>
                    )}

                    {predictMutation.isPending && (
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-indigo-100 absolute inset-0" />
                                <div className="w-24 h-24 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin relative z-10" />
                                <BrainCircuit className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-bold text-slate-800">Menghubungkan ke Gemini AI...</h3>
                                <p className="text-slate-500 text-sm animate-pulse">Memproses jutaan parameter data historis penjualan Anda.</p>
                            </div>
                        </div>
                    )}

                    {predictMutation.error && (
                        <Alert variant="destructive" className="max-w-xl text-left bg-red-50 border-red-200 text-red-800 shadow-lg">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <AlertTitle className="font-bold text-lg">AI Gagal Memproses</AlertTitle>
                            <AlertDescription className="mt-2 text-sm leading-relaxed">
                                {predictMutation.error?.message}
                                <div className="mt-4 pt-4 border-t border-red-200">
                                    <p className="font-semibold mb-1">Catatan Admin:</p>
                                    <p>Pastikan Anda sudah mengonfigurasi GEMINI_API_KEY di dalam environment file (.env).</p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {predictMutation.isSuccess && predictMutation.data && (
                        <div className="w-full text-left space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 pb-4 border-b border-indigo-100">
                                <div className="bg-indigo-600 p-2 rounded-lg shadow-md shadow-indigo-200">
                                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-indigo-950">Hasil Analisa Gemini AI</h3>
                                    <p className="text-xs text-indigo-600/70 font-semibold uppercase tracking-wider">Rekomendasi Produksi</p>
                                </div>
                            </div>

                            <div className="bg-white/60 p-6 xl:p-8 rounded-2xl border border-indigo-50 shadow-inner backdrop-blur-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl -mr-10 -mt-10" />
                                <div className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed text-[15px] relative z-10">
                                    {predictMutation.data.advice}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button variant="outline" onClick={() => predictMutation.mutate()} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm bg-white font-semibold">
                                    Hitung Ulang Analisa
                                </Button>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
