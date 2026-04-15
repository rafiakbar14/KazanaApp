import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, FileArchive, Clock, History, Download, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackupStatusCardProps {
  session: any;
  onBackup: () => void;
  onVerify: () => void;
  isBackupLoading: boolean;
  isVerifyLoading: boolean;
}

export function BackupStatusCard({ 
  session, 
  onBackup, 
  onVerify, 
  isBackupLoading, 
  isVerifyLoading 
}: BackupStatusCardProps) {
  const status = session.backupStatus || 'none';
  const gDriveUrl = session.gDriveUrl;

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return { label: 'Terverifikasi (Aman)', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
      case 'moved':
        return { label: 'Sudah Dipindahkan', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileArchive };
      case 'pending':
        return { label: 'Antrean Backup', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
      default:
        return { label: 'Menunggu (Dalam 3 Hari)', bg: 'bg-slate-50 text-slate-600 border-slate-200', icon: History };
    }
  };

  const config = getStatusConfig();
  const hasPhotos = session.records.some((r: any) => r.photoUrl || (r.photos && r.photos.length > 0));

  if (!hasPhotos && status === 'none') return null;

  return (
    <div className={cn("rounded-3xl p-6 border shadow-xl backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all animate-in fade-in slide-in-from-top-6 duration-500", config.bg, "border-white/20")}>
      <div className="flex items-center gap-5">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", config.bg.replace('50', '200'))}>
          <config.icon className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <p className="font-black uppercase tracking-[0.2em] text-[10px] opacity-50">Status Arsip G-Drive</p>
            <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2 py-0.5 border-current rounded-full bg-white/20")}>{config.label}</Badge>
          </div>
          <p className="text-sm font-bold leading-snug">
            {status === 'verified' ? 'Data sudah aman di Google Drive dan terverifikasi secara sistem.' : 
             status === 'moved' ? 'Data sudah dipindahkan ke Cloud. Silakan verifikasi untuk kepastian data.' :
             status === 'pending' ? 'Data sedang dalam antrean sinkronisasi server (Background Task).' :
             'Sistem menunggu 3 hari sebelum memindahkan data lama ke Google Drive secara otomatis.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 w-full md:w-auto">
        {gDriveUrl && gDriveUrl !== 'no_photos' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/40 border-white hover:bg-white font-black text-xs h-11 px-5 rounded-2xl shadow-sm transition-all active:scale-95"
            onClick={() => window.open(gDriveUrl, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            BUKA GDRIVE
          </Button>
        )}
        
        {status !== 'verified' && (
          <Button 
            variant="default" 
            size="sm" 
            disabled={isBackupLoading || isVerifyLoading}
            className="bg-primary hover:bg-primary/90 text-white font-black text-xs h-11 px-7 shadow-xl shadow-primary/20 rounded-2xl transition-all active:scale-95"
            onClick={status === 'moved' ? onVerify : onBackup}
          >
            {isBackupLoading || isVerifyLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : status === 'moved' ? (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            ) : (
              <ArrowUp className="w-4 h-4 mr-2" />
            )}
            {status === 'moved' ? 'VERIFIKASI SEKARANG' : 'Backup Manual Sekarang'}
          </Button>
        )}
      </div>
    </div>
  );
}
