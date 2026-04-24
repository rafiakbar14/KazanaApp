import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Appointment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useBarbershop() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments, isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    queryFn: async () => {
      const res = await fetch("/api/appointments");
      return res.json();
    }
  });

  const createAppointment = useMutation({
    mutationFn: async (appointment: any) => {
      return await apiRequest("POST", "/api/appointments", appointment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ title: "Reservasi Berhasil", description: "Jadwal baru telah ditambahkan ke kalender." });
    }
  });

  const updateAppointment = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return await apiRequest("PATCH", `/api/appointments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    }
  });

  return {
    appointments,
    isLoadingAppointments,
    createAppointment,
    updateAppointment
  };
}
