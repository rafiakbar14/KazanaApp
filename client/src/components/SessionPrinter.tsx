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
                    <button
                        onClick={handlePrint}
                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        CETAK
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
                    <div id="session-report-content" className="bg-white text-black p-4 shadow-sm mx-auto w-full max-w-[300px] text-[12px] font-mono leading-tight session-print-area text-center">
                        <style>{`
                            @page {
                                margin: 0;
                                size: auto;
                            }
                            @media print {
                                body {
                                    background: white !important;
                                    margin: 0 !important;
                                    padding: 0 !important;
                                }
                                .no-print {
                                    display: none !important;
                                }
                                .session-print-area {
                                    visibility: visible !important;
                                    position: static !important;
                                    width: ${localStorage.getItem("pos_paper_size") || "58mm"} !important;
                                    padding: 2mm !important;
                                    margin: 0 auto !important;
                                    font-size: 10px !important;
                                    line-height: 1.2 !important;
                                }
                                .session-print-area * {
                                    visibility: visible !important;
                                }
                                body * {
                                    visibility: hidden;
                                }
                            }
                            .report-divider {
                                border-top: 1px dashed #000;
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
                                <span>{format(new Date(session.startedAt), "dd/MM/yy HH:mm", { locale: id })}</span>
                            </div>
                            <div className="report-row">
                                <span>Selesai:</span>
                                <span>{format(new Date(), "dd/MM/yy HH:mm", { locale: id })}</span>
                            </div>
                            <div className="report-row">
                                <span>Kasir:</span>
                                <span className="uppercase">{session.salespersonName || "Staff"}</span>
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

                        <div className="text-[10px] italic">Waktu Cetak: {format(new Date(), "dd MMM yyyy, HH:mm")}</div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
