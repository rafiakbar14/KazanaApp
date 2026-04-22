import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Settings } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";

interface ReceiptPrinterProps {
    sale: any;
    onClose: () => void;
}

export default function ReceiptPrinter({ sale, onClose }: ReceiptPrinterProps) {
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

    const handlePrint = () => {
        window.print();
        onClose();
    };

    const handleSendWhatsApp = () => {
        if (!sale) return;

        let message = `*Struk Belanja - ${settings?.storeName || "Kazana"}*\n`;
        message += `No. Faktur: #${sale.id.toString().padStart(6, '0')}\n`;
        message += `Kasir: ${sale.salespersonName || "Staff"}\n`;
        message += `Tanggal: ${(() => {
            try {
                return format(new Date(sale.createdAt), "dd/MM/yy HH:mm", { locale: id });
            } catch (e) {
                return "--/--/-- --:--";
            }
        })()}\n`;
        message += `──────────────\n`;

        if (sale.items) {
            sale.items.forEach((item: any) => {
                const itemName = item.product?.name || item.productName || "Produk";
                message += `${itemName}\n${item.quantity} x ${formatCurrency(Number(item.unitPrice))}`;
                if (item.discountAmount > 0) {
                    message += ` (Disc: -${formatCurrency(Number(item.discountAmount))})`;
                }
                message += ` = ${formatCurrency(Number(item.unitPrice) * item.quantity)}\n`;
            });
        }

        message += `──────────────\n`;
        const subtotal = Number(sale.totalAmount) - Number(sale.taxAmount) + Number(sale.discountAmount);
        message += `Subtotal: *${formatCurrency(subtotal)}*\n`;
        if (Number(sale.discountAmount) > 0) {
            message += `Diskon: -*${formatCurrency(Number(sale.discountAmount))}*\n`;
        }
        message += `PPN (11%): *${formatCurrency(Number(sale.taxAmount))}*\n`;
        message += `*Grand Total: ${formatCurrency(Number(sale.totalAmount))}*\n\n`;
        message += `Terima Kasih atas kunjungan Anda!`;

        const encodedMessage = encodeURIComponent(message);

        // Check if customer phone is available
        const phone = sale.customer?.phone ? sale.customer.phone.replace(/\\D/g, "") : "";
        const finalPhone = phone.startsWith("0") ? "62" + phone.substring(1) : phone;

        // If phone is available, open chat directly, else let user select contact
        if (finalPhone) {
            window.open(`https://wa.me/${finalPhone}?text=${encodedMessage}`, "_blank");
        } else {
            window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
        }
    };

    if (!sale) return null;

    return (
        <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-2xl text-white border-white/10 rounded-[2.5rem] w-[95vw] md:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 no-print">
                    <div>
                        <h3 className="font-bold">Preview Struk</h3>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
                            {paperSize} • {(() => {
                                try {
                                    const cfg = JSON.parse(localStorage.getItem("pos_printer_config") || "{}");
                                    const labels: Record<string, string> = { usb: "USB/Kabel", bluetooth: "Bluetooth", lan: "LAN/RJ45" };
                                    return labels[cfg.connectionType] || "USB/Kabel";
                                } catch { return "USB/Kabel"; }
                            })()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSendWhatsApp}
                            className="px-4 py-2 bg-emerald-500 text-white flex items-center gap-2 text-sm font-bold rounded-xl shadow-lg hover:bg-emerald-600 transition-all active:scale-95 no-print"
                        >
                            <MessageCircle className="w-4 h-4" /> Kirim WA
                        </button>
                        <button
                            onClick={togglePaperSize}
                            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/10 transition-all no-print"
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

                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 receipt-print-area-wrapper">
                    {/* The actual printable area */}
                    <div id="receipt-content" className="bg-white text-black p-4 mx-auto w-full max-w-[300px] text-[12px] font-mono leading-tight receipt-print-area">
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

                                [data-radix-portal] > div:not(:has(.receipt-print-area-wrapper)),
                                .fixed.inset-0,
                                [data-state] {
                                    display: none !important;
                                    visibility: hidden !important;
                                    opacity: 0 !important;
                                }
                                
                                /* TARGET SHADCN DIALOG WRAPPER SPESIFIK */
                                div[role="dialog"]:has(.receipt-print-area-wrapper) {
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

                                .receipt-print-area-wrapper {
                                    background: white !important;
                                    padding: 0 !important;
                                    overflow: hidden !important;
                                    display: block !important;
                                    height: max-content !important;
                                }
                                
                                .receipt-print-area {
                                    width: 100% !important;
                                    max-width: ${paperSize === "58mm" ? "58mm" : "80mm"} !important;
                                    padding: ${paperSize === "58mm" ? "2mm 2mm 40mm 2mm" : "4mm 4mm 60mm 4mm"} !important;
                                    margin: 0 auto !important;

                                    font-size: ${paperSize === "58mm" ? "11px" : "13px"} !important;
                                    line-height: 1.2 !important;

                                    box-sizing: border-box !important;
                                    color: #000 !important;
                                    height: max-content !important;
                                    text-rendering: optimizeLegibility !important;
                                    -webkit-font-smoothing: antialiased !important;
                                    -moz-osx-font-smoothing: grayscale !important;
                                }
                                
                                .receipt-print-area * {
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
                            .receipt-divider {
                                border-top: 1px dashed #000 !important;
                                margin: 4px 0;
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
                            {settings?.hideBranding !== 1 && (
                                <p className="text-[10px] italic">Powered by Kazana POS</p>
                            )}
                            {/* Extra spacing for thermal printers without automatic cutters */}
                            <div className="h-40 no-print" />
                            <div className="h-60 print-only" />
                            {/* In thermal printing, we often just need actual empty space */}
                            <div className="py-20" />
                            <div className="py-10" />

                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
