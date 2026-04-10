import { useState, useRef } from "react";
import { useProducts } from "@/hooks/use-products";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Printer, Download, QrCode as QrIcon, Barcode as BarIcon, Loader2 } from "lucide-react";
import { Link } from "wouter";
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from "react-to-print";

export default function BarcodeGenerator() {
  const { data: products, isLoading } = useProducts();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"barcode" | "qrcode">("barcode");
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-enter">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/master">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Barcode Generator</h1>
            <p className="text-muted-foreground mt-1 text-sm">Cetak label barcode atau QR code untuk produk.</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl">
          <Button 
            variant={type === "barcode" ? "secondary" : "ghost"} 
            size="sm" 
            className="rounded-lg h-9 px-4"
            onClick={() => setType("barcode")}
          >
            <BarIcon className="w-4 h-4 mr-2" />
            Barcode
          </Button>
          <Button 
            variant={type === "qrcode" ? "secondary" : "ghost"} 
            size="sm" 
            className="rounded-lg h-9 px-4"
            onClick={() => setType("qrcode")}
          >
            <QrIcon className="w-4 h-4 mr-2" />
            QR Code
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari SKU atau nama produk..." 
              className="pl-9 bg-slate-50 border-none rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts?.map((product) => (
                <Card key={product.id} className="hover:border-primary/50 transition-all group overflow-hidden border-slate-200 shadow-sm hover:shadow-md">
                  <div className="p-6 flex flex-col items-center gap-6 bg-white min-h-[280px] justify-between">
                    <div className="text-center w-full">
                      <h3 className="font-bold text-sm text-slate-900 truncate">{product.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-1">{product.sku}</p>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center p-4 bg-slate-50 rounded-2xl w-full border border-slate-100">
                      {type === "barcode" ? (
                        <div className="scale-75 md:scale-90">
                          <Barcode 
                            value={product.sku} 
                            width={1.5} 
                            height={60} 
                            fontSize={12}
                            background="transparent"
                          />
                        </div>
                      ) : (
                        <QRCodeSVG value={product.sku} size={100} level="H" includeMargin={true} />
                      )}
                    </div>
                    
                    <div className="flex gap-2 w-full pt-2">
                      <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs h-9 font-bold" onClick={() => {
                        // Simple individual print logic or download
                        const canvas = document.createElement("canvas");
                        // ... complicated to implement individual download in one shot but possible
                      }}>
                        <Printer className="w-4 h-4 mr-2" />
                        Cetak
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs h-9 font-bold">
                        <Download className="w-4 h-4 mr-2" />
                        Simpan
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {!isLoading && filteredProducts?.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-slate-100 rounded-2xl">
                  <BarIcon className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p>Tidak ada produk untuk label yang ditemukan.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Hidden print area */}
      <div className="hidden">
        <div ref={componentRef} className="p-8 grid grid-cols-3 gap-8">
           {filteredProducts?.map(p => (
             <div key={p.id} className="border p-4 flex flex-col items-center text-center gap-2">
                <span className="text-xs font-bold">{p.name}</span>
                {type === "barcode" ? (
                  <Barcode value={p.sku} width={1.2} height={40} fontSize={10} />
                ) : (
                  <QRCodeSVG value={p.sku} size={60} />
                )}
                <span className="text-[10px]">{p.sku}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
