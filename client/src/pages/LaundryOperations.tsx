import React from "react";
import { useLaundry } from "@/hooks/use-laundry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Waves, Sun, FoldVertical, CheckCircle2, ChevronRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const STEPS = [
  { id: "wash", name: "Cuci", icon: Waves, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "dry", name: "Jemur", icon: Sun, iconColor: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "fold", name: "Lipat", icon: FoldVertical, iconColor: "text-indigo-500", bg: "bg-indigo-500/10" },
  { id: "ready", name: "Selesai", icon: CheckCircle2, iconColor: "text-green-500", bg: "bg-green-500/10" }
];

export default function LaundryOperations() {
  const { orders, isLoadingOrders, updateStatus } = useLaundry();

  if (isLoadingOrders) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" strokeWidth={3} />
      </div>
    );
  }

  const getOrdersInStep = (stepName: string) => {
    return orders?.filter(o => {
      // Find latest status log or default to 'Cuci' if it's a new laundry order
      // For demo, we just look at the last log if it exists
      // Logic would be more robust in production
      return true; // Simplify for layout
    });
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Laundry Operations Hub</h1>
          <p className="text-slate-500 text-sm font-medium">Pantau dan kelola antrean cucian secara real-time.</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="h-10 px-6 rounded-xl border-slate-200 bg-white font-bold text-slate-600">
            {orders?.length || 0} TOTAL ORDER
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((step) => {
            const stepOrders = orders?.filter(o => {
                // In real app, we check the latest OrderStatusLog
                // For demo, we'll just show them in default columns or based on some property
                return true; 
            });

            return (
                <div key={step.id} className="space-y-4">
                    <div className={cn("p-4 rounded-2xl flex items-center justify-between border", step.bg, "border-white/20 shadow-sm")}>
                        <div className="flex items-center gap-3">
                            <div className={cn("p-2 rounded-xl bg-white shadow-sm", step.iconColor || step.color)}>
                                <step.icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-bold text-slate-800">{step.name}</h3>
                        </div>
                        <Badge className="bg-white/50 text-slate-700 border-none px-2.5">{getOrdersInStep(step.name)?.length || 0}</Badge>
                    </div>

                    <div className="space-y-3">
                        {orders?.map(order => (
                            <OrderCard key={order.id} order={order} currentStep={step.id} />
                        ))}
                        
                        {(!orders || orders.length === 0) && (
                            <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-3xl opacity-20">
                                <Clock className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-[10px] font-black uppercase">Kosong</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, currentStep }: { order: any, currentStep: string }) {
    const { updateStatus } = useLaundry();
    
    return (
        <Card className="rounded-2xl border-slate-200 hover:border-primary/50 transition-all hover:shadow-xl shadow-blue-500/5 group overflow-hidden">
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">#{order.invoiceNumber || order.id}</span>
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5 border-blue-100 text-blue-600 bg-blue-50/50">LAUNDRY</Badge>
                        </div>
                        <h4 className="font-black text-slate-800 group-hover:text-primary transition-colors line-clamp-1">{order.customer?.name || "Pelanggan Umum"}</h4>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-slate-400 uppercase font-black">Masuk</p>
                        <p className="text-[10px] font-bold text-slate-600">{format(new Date(order.createdAt), "HH:mm")}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 py-2 border-y border-slate-50">
                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Status Saat Ini</p>
                        <p className="text-xs font-black text-slate-700">Dalam Antrean</p>
                    </div>
                </div>

                <Button 
                    className="w-full h-10 rounded-xl bg-slate-900 group-hover:bg-primary transition-all text-white font-bold text-xs gap-2"
                    onClick={() => updateStatus.mutate({ orderId: order.id.toString(), statusName: "Next Step" })}
                >
                    LANJUTKAN PROSES
                    <ChevronRight className="h-3 w-3" />
                </Button>
            </CardContent>
        </Card>
    );
}
