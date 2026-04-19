import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

export default function AppIsolation() {
  console.log("[AppIsolation] Rendering...");
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex items-center justify-center bg-blue-500 text-white p-20">
        <div className="text-center">
            <h1 className="text-4xl font-black mb-4">STOCKIFY DIAGNOSTIC MODE</h1>
            <p className="text-xl">Jika Anda melihat ini, berarti masalahnya ada pada salah satu file yang diimpor oleh App.tsx asli.</p>
        </div>
      </div>
    </QueryClientProvider>
  );
}
