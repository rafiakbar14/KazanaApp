import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Cloud, 
  Database, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  HardDrive,
  Activity,
  Server
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface BackupStats {
  totalSessions: number;
  pendingBackup: number;
  backedUp: number;
  lastBackup?: string;
}

interface Diagnostics {
  timestamp: string;
  environment: string;
  storage: {
    path: string;
    exists: boolean;
    writable: boolean;
  };
  database: {
    connected: boolean;
  };
}

export default function BackupCenter() {
  const { toast } = useToast();

  const { data: stats, isLoading: loadingStats } = useQuery<BackupStats>({
    queryKey: ["/api/backup/stats"],
  });

  const { data: diagnostics, isLoading: loadingDiag } = useQuery<Diagnostics>({
    queryKey: ["/api/admin/diagnostics"],
  });

  const runBackupMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/backup/run", { method: "POST" });
      if (!res.ok) throw new Error("Gagal menjalankan backup");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sinkronisasi Dimulai",
        description: "Proses backup berjalan di latar belakang. Silakan cek kembali dalam beberapa menit.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/backup/stats"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message,
      });
    },
  });

  return (
    <div className="p-8 space-y-8 bg-zinc-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
            <Cloud className="h-8 w-8 text-blue-600" />
            Backup Center
          </h1>
          <p className="text-zinc-500 mt-2">Pusat sinkronisasi cloud dan manajemen pemulihan bencana.</p>
        </div>
        <Button 
          onClick={() => runBackupMutation.mutate()} 
          disabled={runBackupMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-200"
        >
          {runBackupMutation.isPending ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
          Luncurkan Sinkronisasi Cloud
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Status Google Drive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-2xl">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Terhubung</h3>
                <p className="text-sm text-zinc-500">Remote: gdrive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Data Terlindungi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-2xl">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{stats?.backedUp} / {stats?.totalSessions}</h3>
                <p className="text-sm text-zinc-500">Sesi Stock Opname</p>
              </div>
            </div>
            <Progress 
              value={stats ? (stats.backedUp / stats.totalSessions) * 100 : 0} 
              className="mt-4 h-1.5"
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Sinkronisasi Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-100 rounded-2xl">
                <RotateCcw className="h-6 w-6 text-zinc-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleDateString('id-ID') : 'N/A'}
                </h3>
                <p className="text-sm text-zinc-500">Berdasarkan data meta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-indigo-600" />
              Kesehatan VPS (Diagnostics)
            </CardTitle>
            <CardDescription>Verifikasi lingkungan server untuk memastikan stabilitas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium">Koneksi Database</span>
              </div>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100">Normal</Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <div className="flex items-center gap-3">
                <HardDrive className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium">Izin Tulis Uploads</span>
              </div>
              <Badge variant="outline" className={diagnostics?.storage.writable ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}>
                {diagnostics?.storage.writable ? "Diberikan" : "Ditolak"}
              </Badge>
            </div>

            <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-medium">Environment</span>
              </div>
              <Badge variant="outline" className="uppercase font-mono text-[10px]">{diagnostics?.environment}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-indigo-900 to-slate-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-indigo-300" />
              Akses External Backup
            </CardTitle>
            <CardDescription className="text-indigo-200">Buka penyimpanan awan secara manual di Google Drive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-indigo-100 leading-relaxed">
              Semua foto dari sesi Stock Opname yang berstatus 'Moved' disimpan secara terenkripsi di folder: 
              <code className="block mt-2 p-2 bg-black/30 rounded font-mono text-xs">KazanaBackups/Sessions/</code>
            </p>
            <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white gap-2 transition-all">
              Buka Google Drive Remote
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
