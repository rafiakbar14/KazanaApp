import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-center text-white">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Terjadi Kesalahan Sistem</h1>
          <p className="text-slate-400 max-w-md mx-auto mb-8">
            Waduh! Ada masalah teknis yang menyebabkan layar ini tidak bisa tampil. 
            Coba muat ulang halaman atau hubungi admin.
          </p>
          <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 text-left mb-8 max-w-lg overflow-auto">
            <p className="text-red-400 font-mono text-[10px] whitespace-pre-wrap">
              {this.state.error?.message}
            </p>
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90 rounded-xl px-8 h-12"
            onClick={() => window.location.reload()}
          >
            Muat Ulang Halaman
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
