import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Settings } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SessionPrinterProps {
    session: any;
    onClose: () => void;
}

export default function SessionPrinter({ session, onClose }: SessionPrinterProps) {
    const { data: settings } = useQuery<Settings>({
        queryKey: [api.settings.get.path],
    });

    const [paperSize, setPaperSize] = useState<string>(localStorage.getItem("pos_paper_size") || "58mm");

    const togglePaperSize = () => {
        const newSize = paperSize === "58mm" ? "80mm" : "58mm";
        setPaperSize(newSize);
        localStorage.setItem("pos_paper_size", newSize);
    };

    const formatCurrency = (val: number) => {
        try {
            return new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
            }).format(val || 0);
        } catch (e) {
            return "Rp " + (val || 0);
        }
    };

    const safeFormatDate = (dateStr: any, formatStr: string = "dd/MM/yy HH:mm") => {
        try {
            if (!dateStr) return "--/--/-- --:--";
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return "--/--/-- --:--";
            return format(date, formatStr, { locale: id });
        } catch (e) {
            return "--/--/-- --:--";
        }
    };

    const handlePrint = () => {
        window.print();
        onClose();
    };

    if (!session) return null;

    const totalCash = (Number(session.openingBalance) + Number(session.totalCashSales || 0) + Number(session.pettyCashTotal || 0));

    return (
        <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-2xl text-white border-white/10 rounded-[2.5rem] w-[95vw] md:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 no-print">
                    <h3 className="font-bold">Preview Laporan Kasir</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={togglePaperSize}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all no-print"
                        >
                            Ukuran: {paperSize}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                        >
                            CETAK
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 session-print-area-wrapper">
                    <div id="session-report-content" className="bg-white text-black p-4 mx-auto w-full max-w-[300px] text-[12px] font-mono leading-tight session-print-area text-center">
                        <style>{`
                            @page {
                                margin: 0;
                            }
                            @media print {
                                html, body {
                                    background: white !important;
                                    color: #000 !important;
                                    height: max-content !important;
                                    -webkit-print-color-adjust: exact !important;
                                    print-color-adjust: exact !important;
                                }
                                #root, .no-print {
                                    display: none !important;
                                }
                                
                                /* SEMBUNYIKAN SEMUA PORTAL DAN OVERLAY */
                                [data-radix-portal] {
                                    background: transparent !important;
                                    backdrop-filter: none !important;
                                }

                                [data-radix-portal] > div:not(:has(.session-print-area-wrapper)),
                                .fixed.inset-0,
                                [data-state] {
                                    display: none !important;
                                    visibility: hidden !important;
                                    opacity: 0 !important;
                                }
                                
                                /* TARGET SHADCN DIALOG WRAPPER SPESIFIK */
                                div[role="dialog"]:has(.session-print-area-wrapper) {
                                    display: block !important;
                                    position: absolute !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    transform: none !important;
                                    width: ${paperSize} !important;
                                    max-width: none !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                    border: none !important;
                                    border-radius: 0 !important;
                                    background: white !important;
                                    box-shadow: none !important;
                                    overflow: visible !important;
                                    max-height: none !important;
                                    height: max-content !important;
                                    visibility: visible !important;
                                    opacity: 1 !important;
                                }

                                .session-print-area-wrapper {
                                    background: white !important;
                                    padding: 0 !important;
                                    overflow: hidden !important;
                                    display: block !important;
                                    height: max-content !important;
                                }
                                
                                .session-print-area {
                                    width: 100% !important;
                                    max-width: ${paperSize === "58mm" ? "58mm" : "80mm"} !important;
                                    padding: ${paperSize === "58mm" ? "2mm 2mm 10mm 2mm" : "4mm 4mm 15mm 4mm"} !important;
                                    margin: 0 auto !important;
                                    font-size: ${paperSize === "58mm" ? "9px" : "11px"} !important;
                                    line-height: 1.2 !important;
                                    box-sizing: border-box !important;
                                    color: #000 !important;
                                    height: max-content !important;
                                    text-rendering: optimizeLegibility !important;
                                    -webkit-font-smoothing: antialiased !important;
                                    -moz-osx-font-smoothing: grayscale !important;
                                }

                                .session-print-area * {
                                    color: #000 !important;
                                    text-shadow: none !important;
                                    font-weight: 500 !important;
                                }

                                img {
                                    image-rendering: pixelated !important;
                                    image-rendering: -moz-crisp-edges !important;
                                    image-rendering: crisp-edges !important;
                                }
                            }
                            .report-divider {
                                border-top: 1px dashed #000 !important;
                                margin: 5px 0;
                            }
                            .report-row {
                                display: flex;
                                justify-content: space-between;
                                text-align: left;
                            }
                        `}</style>

                        <div className="mb-4">
                            <h2 className="text-sm font-bold uppercase">{settings?.storeName || "STOCKIFY POS"}</h2>
                            <p className="text-[10px] font-bold uppercase">LAPORAN PENUTUPAN KASIR</p>
                            <p className="text-[10px]">Shift ID: #{session.id}</p>
                        </div>

                        <div className="report-divider" />

                        <div className="space-y-0.5 mb-4 text-[10px]">
                            <div className="report-row">
                                <span>Mulai:</span>
                                <span>{safeFormatDate(session.startTime)}</span>
                            </div>
                            <div className="report-row">
                                <span>Selesai:</span>
                                <span>{safeFormatDate(new Date())}</span>
                            </div>
                            <div className="report-row">
                                <span>Kasir:</span>
                                <span className="uppercase">{session.user?.username || "Staff"}</span>
                            </div>
                        </div>

                        <div className="report-divider text-left font-bold">RINGKASAN PENJUALAN</div>
                        <div className="space-y-0.5 mb-4">
                            <div className="report-row">
                                <span>Total Sales:</span>
                                <span>{formatCurrency(Number(session.totalSales || 0))}</span>
                            </div>
                            <div className="report-row">
                                <span>Cash Sales:</span>
                                <span>{formatCurrency(Number(session.totalCashSales || 0))}</span>
                            </div>
                            <div className="report-row">
                                <span>Non-Cash:</span>
                                <span>{formatCurrency(Number(session.totalSales || 0) - Number(session.totalCashSales || 0))}</span>
                            </div>
                        </div>

                        <div className="report-divider text-left font-bold">KAS TUNAI (LACI)</div>
                        <div className="space-y-0.5 mb-4">
                            <div className="report-row">
                                <span>Modal Awal:</span>
                                <span>{formatCurrency(Number(session.openingBalance || 0))}</span>
                            </div>
                            <div className="report-row">
                                <span>Kas Masuk/Keluar:</span>
                                <span>{formatCurrency(Number(session.pettyCashTotal || 0))}</span>
                            </div>
                            <div className="report-divider" />
                            <div className="report-row font-bold">
                                <span>ESTIMASI TUNAI:</span>
                                <span>{formatCurrency(totalCash)}</span>
                            </div>
                        </div>

                        <div className="report-divider" />
                        <div className="mt-8 mb-4">
                            <div className="flex justify-between h-12">
                                <div className="border-b border-black w-[40%] text-[8px] flex items-end justify-center pb-1">KASIR</div>
                                <div className="border-b border-black w-[40%] text-[8px] flex items-end justify-center pb-1">MANAGER</div>
                            </div>
                        </div>

                        <div className="text-[10px] italic">Waktu Cetak: {safeFormatDate(new Date(), "dd MMM yyyy, HH:mm")}</div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

