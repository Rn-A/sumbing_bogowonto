import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 bg-[#FAF8F5]">
          <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl p-8 max-w-md w-full border border-[#e7e5e4] shadow-xl text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4 shadow-sm border border-amber-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-black text-[#0D5C3A] uppercase tracking-widest block mb-1">
              BASECAMP BOGOWONTO SYSTEM
            </span>
            <h2 className="text-xl font-black text-[#050505] mb-2" style={{ fontFamily: "'Lora', Georgia, serif" }}>
              Terjadi Kendala Memuat Panel
            </h2>
            <p className="text-xs text-[#707070] mb-5 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#e7e5e4] font-mono break-words">
              {this.state.error?.message || 'Gagal memuat komponen aplikasi.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
