import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Settings } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PrinterTestProps {
    open: boolean;
    onClose: () => void;
    paperSize: "58mm" | "80mm";
}

export default function PrinterTest({ open, onClose, paperSize }: PrinterTestProps) {
    const { data: settings } = useQuery<Settings>({
        queryKey: [api.settings.get.path],
    });

    const handlePrint = () => {
        window.print();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-2xl text-white border-white/10 rounded-[2.5rem] w-[95vw] md:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 no-print">
                    <h3 className="font-bold">Preview Test Print ({paperSize})</h3>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        CETAK TEST
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
                    <div id="printer-test-content" className="bg-white text-black p-4 shadow-sm mx-auto w-full max-w-[300px] text-[12px] font-mono leading-tight printer-test-area text-center">
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
                                .printer-test-area {
                                    visibility: visible !important;
                                    position: static !important;
                                    width: ${paperSize} !important;
                                    padding: 2mm !important;
                                    margin: 0 auto !important;
                                    font-size: 10px !important;
                                    line-height: 1.2 !important;
                                }
                                .printer-test-area * {
                                    visibility: visible !important;
                                }
                                body * {
                                    visibility: hidden;
                                }
                            }
                            .test-divider {
                                border-top: 1px dashed #000;
                                margin: 5px 0;
                            }
                        `}</style>

                        <div className="mb-4">
                            <h2 className="text-sm font-bold uppercase">{settings?.storeName || "STOCKIFY POS"}</h2>
                            <p className="text-[10px] font-bold uppercase">UJI COBA PRINTER THERMAL</p>
                            <p className="text-[10px] uppercase">STATUS: TERHUBUNG</p>
                        </div>

                        <div className="test-divider" />
                        
                        <div className="text-left space-y-1 my-4 text-[10px]">
                            <p>Waktu: {format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: id })}</p>
                            <p>Ukuran Kertas: {paperSize}</p>
                            <p>Koneksi: Browser Print Spooler</p>
                        </div>

                        <div className="test-divider" />

                        <div className="my-6">
                            <p className="font-bold text-[11px]">SISTEM SIAP DIGUNAKAN</p>
                            <p className="text-[9px] mt-2 italic">Jika teks ini terlihat rapi dan tidak terpotong, maka pengaturan printer Anda sudah benar.</p>
                        </div>

                        <div className="test-divider" />
                        
                        <div className="mt-4 text-[8px] text-slate-400">
                            Powered by Stockify ERP v1.0
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
