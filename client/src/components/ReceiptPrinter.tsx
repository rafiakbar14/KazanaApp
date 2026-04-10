import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Settings } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ReceiptPrinterProps {
    sale: any;
    onClose: () => void;
}

export default function ReceiptPrinter({ sale, onClose }: ReceiptPrinterProps) {
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

    if (!sale) return null;

    return (
        <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-2xl text-white border-white/10 rounded-[2.5rem] w-[95vw] md:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 no-print">
                    <h3 className="font-bold">Preview Struk</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
                        >
                            CETAK
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
                    {/* The actual printable area */}
                    <div id="receipt-content" className="bg-white text-black p-4 shadow-sm mx-auto w-full max-w-[300px] text-[12px] font-mono leading-tight receipt-print-area">
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
                                .receipt-print-area {
                                    visibility: visible !important;
                                    position: static !important;
                                    width: ${localStorage.getItem("pos_paper_size") || "58mm"} !important;
                                    padding: 2mm !important;
                                    margin: 0 auto !important;
                                    font-size: 10px !important;
                                    line-height: 1.2 !important;
                                }
                                .receipt-print-area * {
                                    visibility: visible !important;
                                }
                                body * {
                                    visibility: hidden;
                                }
                            }
                            .receipt-divider {
                                border-top: 1px dashed #000;
                                margin: 5px 0;
                            }
                        `}</style>

                        {/* Store Header */}
                        <div className="text-center space-y-1 mb-4">
                            {settings?.storeLogo && (
                                <img
                                    src={settings.storeLogo}
                                    alt="Logo"
                                    className="h-12 mx-auto mb-2 object-contain"
                                />
                            )}
                            <h2 className="text-sm font-bold uppercase">{settings?.storeName || "STOCKIFY SHOP"}</h2>
                            {settings?.storeAddress && <p className="text-[10px]">{settings.storeAddress}</p>}
                            {settings?.storePhone && <p className="text-[10px]">Telp: {settings.storePhone}</p>}
                        </div>

                        <div className="receipt-divider" />

                        {/* Transaction Info */}
                        <div className="space-y-0.5 mb-4">
                            <div className="flex justify-between">
                                <span>NO: #{sale.id.toString().padStart(6, '0')}</span>
                                <span>{(() => {
                                    try {
                                        return format(new Date(sale.createdAt), "dd/MM/yy HH:mm", { locale: id });
                                    } catch (e) {
                                        return "--/--/-- --:--";
                                    }
                                })()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>KASIR: {sale.salespersonName || "Staff"}</span>
                                <span className="uppercase">{sale.paymentMethod}</span>
                            </div>
                        </div>

                        <div className="receipt-divider" />

                        {/* Items */}
                        <div className="space-y-2 mb-4">
                            {sale.items?.map((item: any, idx: number) => (
                                <div key={idx} className="space-y-0.5">
                                    <div className="flex justify-between font-bold">
                                        <span className="flex-1 mr-2">{item.product?.name || item.productName || "Produk"}</span>
                                        <span>{formatCurrency(Number(item.unitPrice) * item.quantity)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] opacity-70">
                                        <span>{item.quantity} x {formatCurrency(Number(item.unitPrice))}</span>
                                        {item.discountAmount > 0 && (
                                            <span className="italic text-red-600">Disc: -{formatCurrency(Number(item.discountAmount))}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="receipt-divider" />

                        {/* Totals */}
                        <div className="space-y-1 text-right">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatCurrency(Number(sale.totalAmount) - Number(sale.taxAmount) + Number(sale.discountAmount))}</span>
                            </div>
                            {Number(sale.discountAmount) > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Total Diskon</span>
                                    <span>-{formatCurrency(Number(sale.discountAmount))}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>PPN (11%)</span>
                                <span>{formatCurrency(Number(sale.taxAmount))}</span>
                            </div>
                            <div className="receipt-divider" />
                            <div className="flex justify-between font-bold text-sm">
                                <span>TOTAL</span>
                                <span>{formatCurrency(Number(sale.totalAmount))}</span>
                            </div>
                        </div>

                        <div className="receipt-divider" />

                        {/* Footer */}
                        <div className="text-center mt-6 space-y-1">
                            <p className="font-bold">TERIMA KASIH</p>
                            <p className="text-[10px]">Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
                            <p className="text-[10px] italic">Powered by Kazana POS</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
