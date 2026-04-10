import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Settings } from "@shared/schema";
import { X, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoicePrinterProps {
    invoice: any;
    onClose: () => void;
}

export default function InvoicePrinter({ invoice, onClose }: InvoicePrinterProps) {
    const { data: settings } = useQuery<Settings>({
        queryKey: [api.settings.get.path],
    });

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(val);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex flex-col no-print">
            {/* Toolbar */}
            <div className="h-20 bg-slate-900 border-b border-white/10 flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-2 rounded-xl">
                        <Printer className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Preview Invoice</h3>
                        <p className="text-white/40 text-xs">Format Standar A4 / Surat</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" className="text-white/60 hover:text-white" onClick={onClose}>
                        <X className="w-5 h-5 mr-2" />
                        Tutup
                    </Button>
                    <Button className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20" onClick={handlePrint}>
                        <Printer className="w-5 h-5 mr-2" />
                        CETAK INVOICE
                    </Button>
                </div>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-12 bg-slate-800 flex justify-center">
                {/* Printable Page */}
                <div className="bg-white text-black w-[210mm] min-h-[297mm] p-[20mm] shadow-2xl invoice-print-area font-sans">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .invoice-print-area, .invoice-print-area * { visibility: visible; }
                            .invoice-print-area {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 210mm;
                                height: 297mm;
                                padding: 20mm;
                                margin: 0;
                                border: none;
                                box-shadow: none;
                            }
                            @page {
                                size: A4;
                                margin: 0;
                            }
                            .no-print { display: none !important; }
                        }
                    `}</style>

                    {/* Header */}
                    <div className="flex justify-between items-start mb-12">
                        <div className="space-y-4">
                            {settings?.storeLogo ? (
                                <img src={settings.storeLogo} alt="Logo" className="h-16 object-contain" />
                            ) : (
                                <div className="p-4 bg-gray-100 rounded-xl"><span className="font-black text-2xl text-gray-400">LOGO</span></div>
                            )}
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tight">{settings?.storeName || "STOCKIFY SHOP"}</h1>
                                <p className="text-gray-500 text-sm max-w-sm">{settings?.storeAddress}</p>
                                <p className="text-gray-500 text-sm">{settings?.storePhone}</p>
                            </div>
                        </div>
                        <div className="text-right space-y-2">
                            <h2 className="text-4xl font-black text-gray-200 uppercase tracking-widest">INVOICE</h2>
                            <div className="pt-4">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nomor</p>
                                <p className="text-xl font-bold">{invoice.invoiceNumber || `#${invoice.id.toString().padStart(6, '0')}`}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-12">
                        <div>
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-2 border-b-2 border-primary/20 pb-1 w-fit">Tagihan Kepada</p>
                            <h3 className="font-bold text-lg">{invoice.customer?.name || "Pelanggan Umum"}</h3>
                            <p className="text-gray-500">{invoice.customer?.address || "Alamat tidak tersedia"}</p>
                            <p className="text-gray-500">{invoice.customer?.phone}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Tanggal</p>
                                <p className="font-bold">{format(new Date(invoice.createdAt), "dd MMMM yyyy", { locale: id })}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-1">Jatuh Tempo</p>
                                <p className="font-bold">{invoice.dueDate ? format(new Date(invoice.dueDate), "dd MMMM yyyy", { locale: id }) : "-"}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Status</p>
                                <p className="font-bold uppercase">{invoice.paymentStatus === 'paid' ? 'Lunas' : 'Belum Lunas'}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Metode</p>
                                <p className="font-bold uppercase">{invoice.paymentMethod}</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full mb-12">
                        <thead>
                            <tr className="border-y-2 border-black/5">
                                <th className="py-4 text-left font-black uppercase tracking-widest text-[10px]">Deskripsi Produk</th>
                                <th className="py-4 text-center font-black uppercase tracking-widest text-[10px] w-24">Qty</th>
                                <th className="py-4 text-right font-black uppercase tracking-widest text-[10px] w-40">Harga</th>
                                <th className="py-4 text-right font-black uppercase tracking-widest text-[10px] w-40">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoice.items?.map((item: any, idx: number) => (
                                <tr key={idx}>
                                    <td className="py-4">
                                        <p className="font-bold">{item.productName || item.product?.name || "Produk"}</p>
                                        <p className="text-[10px] text-gray-400 font-mono tracking-tighter">{item.product?.sku}</p>
                                    </td>
                                    <td className="py-4 text-center font-medium">{item.quantity}</td>
                                    <td className="py-4 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                                    <td className="py-4 text-right font-bold">{formatCurrency(Number(item.unitPrice) * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end pr-0">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                                <span className="font-bold">{formatCurrency(Number(invoice.totalAmount))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Pajak (0%)</span>
                                <span className="font-bold">Rp 0</span>
                            </div>
                            <div className="pt-4 border-t-2 border-black flex justify-between items-center">
                                <span className="font-black uppercase tracking-widest text-xs">Total Tagihan</span>
                                <span className="text-xl font-black">{formatCurrency(Number(invoice.totalAmount))}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom */}
                    <div className="mt-24 grid grid-cols-2 gap-24">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100 pb-1">Syarat & Ketentuan</p>
                            <p className="text-[10px] text-gray-500 leading-relaxed italic">
                                * Harap melakukan pembayaran sebelum tanggal jatuh tempo.<br />
                                * Pembayaran via transfer mohon lampirkan bukti pembayaran.<br />
                                * Barang yang sudah dibeli tidak dapat dikembalikan.
                            </p>
                        </div>
                        <div className="text-center space-y-12">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Hormat Kami,</p>
                            <div className="pt-8">
                                <div className="w-32 h-0.5 bg-black mx-auto mb-2" />
                                <p className="font-bold uppercase text-[10px]">{settings?.storeName || "Admin POS"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
