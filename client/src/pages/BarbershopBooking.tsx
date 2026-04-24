import React, { useState } from "react";
import { useBarbershop } from "@/hooks/use-barbershop";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Users, Clock, Plus, ChevronLeft, ChevronRight, Scissors, Sparkles, CheckCircle2 } from "lucide-react";
import { format, addDays, startOfToday, setHours, setMinutes } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function BarbershopBooking() {
  const { appointments, isLoadingAppointments, createAppointment } = useBarbershop();
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 9); // 09:00 - 20:00

  if (isLoadingAppointments) {
    return <div className="flex h-screen items-center justify-center font-black">MEMUAT KALENDER...</div>;
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Scissors className="h-8 w-8 text-blue-600" />
            Booking & Appointment Hub
          </h1>
          <p className="text-slate-500 text-sm font-medium">Sistem reservasi premium untuk layanan profesional.</p>
        </div>
        <Button className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-xl shadow-blue-500/20 gap-2">
            <Plus className="h-5 w-5" />
            RESERVASI BARU
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left: Mini Calendar / Date Picker */}
        <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="p-6 border-b border-slate-50">
                <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Pilih Tanggal</h3>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSelectedDate(prev => addDays(prev, -7))}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSelectedDate(prev => addDays(prev, 7))}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {["M", "S", "S", "R", "K", "J", "S"].map(d => <span key={d} className="text-[10px] font-black text-slate-300">{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {/* Simplified calendar for demo */}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <button 
                            key={day}
                            onClick={() => setSelectedDate(new Date(2026, 3, day))}
                            className={cn(
                                "h-10 w-full rounded-xl text-xs font-bold transition-all",
                                selectedDate.getDate() === day ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110" : "hover:bg-slate-50 text-slate-600"
                            )}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>

        {/* Right: Daily Schedule View */}
        <div className="xl:col-span-3 space-y-6">
            <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                        <CalendarIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 leading-none">{format(selectedDate, "EEEE, dd MMMM yyyy", { locale: id })}</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Jadwal Harian</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge className="h-8 rounded-lg bg-green-50 text-green-600 border-green-100 font-bold px-3">
                        <CheckCircle2 className="h-3 w-3 mr-1.5" /> 8 TERSEDIA
                    </Badge>
                </div>
            </div>

            <div className="space-y-4">
                {timeSlots.map(hour => {
                    const appt = appointments?.find(a => new Date(a.startTime).getHours() === hour);
                    return (
                        <div key={hour} className="group relative flex gap-6 items-start">
                            <div className="w-16 pt-3 text-right">
                                <span className="text-[13px] font-black text-slate-400 group-hover:text-blue-600 transition-colors uppercase">{hour}:00</span>
                            </div>
                            <div className="hidden lg:block absolute left-[88px] top-0 bottom-0 w-px bg-slate-100 group-hover:bg-blue-200 transition-colors" />
                            
                            <div className="flex-1 pb-6">
                                {appt ? (
                                    <Card className="rounded-[1.5rem] border-slate-200 bg-white hover:border-blue-600/50 shadow-sm hover:shadow-xl transition-all overflow-hidden border-l-4 border-l-blue-600">
                                        <CardContent className="p-5 flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                                    <Users className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800">{appt.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="h-3 w-3 text-blue-600" />
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(appt.startTime), "HH:mm")} - {format(addDays(new Date(appt.startTime), 0.04), "HH:mm")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-bold">VIP SERVICE</Badge>
                                                <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-bold text-[10px] uppercase">DETAIL</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div 
                                        className="h-20 w-full rounded-[1.5rem] border-2 border-dashed border-slate-100 flex items-center justify-center hover:bg-white hover:border-blue-200 transition-all cursor-pointer group/slot"
                                        onClick={() => setIsAddModalOpen(true)}
                                    >
                                        <div className="flex items-center gap-2 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                            <Sparkles className="h-4 w-4 text-amber-500" />
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">+ SLOT TERSEDIA</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
}
