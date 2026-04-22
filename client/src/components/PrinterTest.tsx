import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Settings } from "@shared/schema";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Printer, Wifi, Usb, Bluetooth, CheckCircle2, XCircle, Monitor } from "lucide-react";

interface PrinterConfig {
    connectionType: "usb" | "bluetooth" | "lan";
    bluetoothName?: string;
    lanIp?: string;
    lanPort?: string;
}

interface PrinterTestProps {
    open: boolean;
    onClose: () => void;
    paperSize: "58mm" | "80mm";
}

function getPrinterConfig(): PrinterConfig {
    try {
        const raw = localStorage.getItem("pos_printer_config");
        if (raw) return JSON.parse(raw);
    } catch (e) { }
    return { connectionType: "usb" };
}

function getConnectionLabel(type: string): string {
    switch (type) {
        case "usb": return "USB / Kabel";
        case "bluetooth": return "Bluetooth";
        case "lan": return "LAN / RJ45 (Ethernet)";
        default: return "Tidak Diketahui";
    }
}

function getConnectionIcon(type: string) {
    switch (type) {
        case "usb": return Usb;
        case "bluetooth": return Bluetooth;
        case "lan": return Wifi;
        default: return Monitor;
    }
}

export default function PrinterTest({ open, onClose, paperSize }: PrinterTestProps) {
    const { data: settings } = useQuery<Settings>({
        queryKey: [api.settings.get.path],
    });

    const config = getPrinterConfig();
    const ConnIcon = getConnectionIcon(config.connectionType);
    const now = new Date();

    // Generate test characters for alignment check
    const charWidth58 = 32; // chars per line for 58mm
    const charWidth80 = 48; // chars per line for 80mm
    const maxChars = paperSize === "58mm" ? charWidth58 : charWidth80;
    const alignmentLine = "=".repeat(maxChars);
    const numberLine = Array.from({ length: maxChars }, (_, i) => ((i + 1) % 10).toString()).join("");

    const handlePrint = () => {
        window.print();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="bg-slate-900/95 backdrop-blur-2xl text-white border-white/10 rounded-[2.5rem] w-[95vw] md:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 no-print">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Printer className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">Tes Cetak Printer</h3>
                            <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">{paperSize} • {getConnectionLabel(config.connectionType)}</p>
                        </div>
                    </div>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
                    >
                        CETAK TEST
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 printer-test-area-wrapper">
                    <div id="printer-test-content" className="bg-white text-black p-4 mx-auto w-full max-w-[300px] text-[12px] font-mono leading-tight printer-test-area text-center">
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

                                [data-radix-portal] > div:not(:has(.printer-test-area-wrapper)),
                                .fixed.inset-0,
                                [data-state] {
                                    display: none !important;
                                    visibility: hidden !important;
                                    opacity: 0 !important;
                                }
                                
                                /* TARGET SHADCN DIALOG WRAPPER SPESIFIK */
                                div[role="dialog"]:has(.printer-test-area-wrapper) {
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

                                .printer-test-area-wrapper {
                                    background: white !important;
                                    padding: 0 !important;
                                    overflow: hidden !important;
                                    display: block !important;
                                    height: max-content !important;
                                }
                                
                                .printer-test-area {
                                    width: 100% !important;
                                    max-width: ${paperSize === "58mm" ? "58mm" : "80mm"} !important;
                                    padding: ${paperSize === "58mm" ? "2mm 2mm 10mm 2mm" : "4mm 4mm 15mm 4mm"} !important;
                                    margin: 0 auto !important;
                                    font-size: ${paperSize === "58mm" ? "10px" : "12px"} !important;
                                    line-height: 1.3 !important;
                                    box-sizing: border-box !important;
                                    color: #000 !important;
                                    height: max-content !important;
                                    text-rendering: optimizeLegibility !important;
                                    -webkit-font-smoothing: antialiased !important;
                                    -moz-osx-font-smoothing: grayscale !important;
                                }

                                .printer-test-area * {
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
                            .test-divider {
                                border-top: 1px dashed #000 !important;
                                margin: 5px 0;
                            }
                            .test-solid-divider {
                                border-top: 2px solid #000 !important;
                                margin: 5px 0;
                            }
                        `}</style>

                        {/* === HEADER === */}
                        <div className="mb-3">
                            <h2 className="text-sm font-bold uppercase">{settings?.storeName || "KAZANA POS"}</h2>
                            <p className="text-[11px] font-bold uppercase mt-1">★ UJI COBA PRINTER ★</p>
                            <p className="text-[9px] uppercase tracking-wider mt-1">DIAGNOSTIK PRINTER THERMAL</p>
                        </div>

                        <div className="test-solid-divider" />

                        {/* === INFO KONEKSI === */}
                        <div className="text-left space-y-0.5 my-3 text-[10px]">
                            <p className="font-bold text-[11px] uppercase">📋 Informasi Koneksi</p>
                            <p>Waktu    : {format(now, "dd/MM/yyyy HH:mm:ss", { locale: id })}</p>
                            <p>Kertas   : {paperSize} ({paperSize === "58mm" ? "Narrow Roll" : "Standard Roll"})</p>
                            <p>Koneksi  : {getConnectionLabel(config.connectionType)}</p>
                            {config.connectionType === "bluetooth" && config.bluetoothName && (
                                <p>Perangkat: {config.bluetoothName}</p>
                            )}
                            {config.connectionType === "lan" && config.lanIp && (
                                <p>IP Addr  : {config.lanIp}:{config.lanPort || "9100"}</p>
                            )}
                            {config.connectionType === "usb" && (
                                <p>Port     : Browser Print Spooler</p>
                            )}
                        </div>

                        <div className="test-divider" />

                        {/* === TES KESELARASAN KARAKTER === */}
                        <div className="text-left my-3 text-[10px]">
                            <p className="font-bold text-[11px] uppercase mb-1">📐 Tes Keselarasan Karakter</p>
                            <p className="text-[9px] italic mb-2">Garis di bawah harus rata kiri-kanan tanpa terpotong:</p>
                            <p className="break-all leading-none">{alignmentLine}</p>
                            <p className="break-all leading-none text-[8px] mt-1">{numberLine}</p>
                            <p className="break-all leading-none mt-1">{alignmentLine}</p>
                        </div>

                        <div className="test-divider" />

                        {/* === TES FORMAT TEKS === */}
                        <div className="text-left my-3 text-[10px] space-y-1">
                            <p className="font-bold text-[11px] uppercase mb-1">🔤 Tes Format Teks</p>
                            <p>Normal   : ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                            <p>Angka    : 0123456789</p>
                            <p className="font-bold">Tebal    : Teks Bold / Tebal</p>
                            <p className="italic">Miring   : Teks Italic / Miring</p>
                            <p>Simbol   : !@#$%^&*()_+-=[];</p>
                            <p>Indonesia: Rp 1.250.000 — ËÏÜÖ áéíóú</p>
                        </div>

                        <div className="test-divider" />

                        {/* === TES TABEL TRANSAKSI === */}
                        <div className="text-left my-3 text-[10px]">
                            <p className="font-bold text-[11px] uppercase mb-1">📊 Tes Layout Struk</p>
                            <div className="flex justify-between">
                                <span className="flex-1">Contoh Produk A</span>
                                <span>Rp 25.000</span>
                            </div>
                            <div className="flex justify-between text-[9px] opacity-60">
                                <span>2 x Rp 12.500</span>
                                <span></span>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="flex-1">Contoh Produk B Nama Panjang</span>
                                <span>Rp 150.000</span>
                            </div>
                            <div className="flex justify-between text-[9px] opacity-60">
                                <span>1 x Rp 150.000</span>
                                <span className="text-red-600 italic">Disc: -Rp 15.000</span>
                            </div>
                            <div className="test-divider" />
                            <div className="flex justify-between font-bold">
                                <span>TOTAL</span>
                                <span>Rp 160.000</span>
                            </div>
                        </div>

                        <div className="test-divider" />

                        {/* === TES BARCODE / QR === */}
                        <div className="my-3 text-[10px]">
                            <p className="font-bold text-[11px] uppercase mb-2">📱 Area QR Code</p>
                            <div className="w-24 h-24 mx-auto border-2 border-black flex items-center justify-center bg-white">
                                <div className="grid grid-cols-5 gap-[2px]">
                                    {Array.from({ length: 25 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-2 ${[0, 1, 2, 3, 4, 5, 6, 10, 14, 15, 16, 17, 18, 19, 20, 21, 24].includes(i) ? "bg-black" : "bg-white"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-[8px] italic mt-2">Jika kotak di atas tercetak rapi,<br />maka resolusi printer mendukung QR.</p>
                        </div>

                        <div className="test-solid-divider" />

                        {/* === STATUS HASIL === */}
                        <div className="my-4">
                            <p className="font-bold text-[12px] uppercase">✅ SISTEM SIAP DIGUNAKAN</p>
                            <p className="text-[9px] mt-2 leading-relaxed">
                                Jika seluruh teks di atas terlihat rapi,<br />
                                rata kiri-kanan, dan tidak terpotong,<br />
                                maka pengaturan printer Anda<br />
                                sudah BENAR dan siap digunakan.
                            </p>
                        </div>

                        <div className="test-divider" />

                        {/* === PETUNJUK POTONG KERTAS === */}
                        <div className="my-3 text-[9px] text-gray-500 italic space-y-1">
                            <p>--- ✂️ POTONG DI SINI ---</p>
                            <p>(Jika printer mendukung auto-cut,</p>
                            <p>kertas akan terpotong otomatis)</p>
                        </div>

                        <div className="test-divider" />

                        <div className="mt-3 text-[8px] text-gray-400">
                            Powered by Kazana ERP • v1.0
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
