import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4 bg-[#FAF8F5]">
          <div className="bg-white dark:bg-[#F4F0E8] rounded-3xl p-8 sm:p-10 max-w-lg w-full border border-[#e7e5e4] shadow-xl text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>
            
            <div>
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-1">
                Terjadi Kesalahan Sistem
              </span>
              <h2 className="text-2xl font-black text-[#050505]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                {this.props.fallbackTitle || 'Gagal Memuat Console Admin'}
              </h2>
              <p className="text-xs text-[#707070] mt-2 leading-relaxed">
                {this.state.error?.message || 'Terjadi kesalahan tidak terduga saat memproses data. Silakan muat ulang atau periksa koneksi backend server.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 border-t border-[#e7e5e4]">
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-5 py-3 bg-[#0D5C3A] hover:bg-[#064e3b] text-white text-xs font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>
              <a
                href="/"
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
