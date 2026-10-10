import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 text-2xl font-black">
            !
          </div>
          <h1 className="text-xl sm:text-2xl font-black mb-2">AliClip • Cargando Tienda</h1>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Ocurrió una interrupción temporal al inicializar la aplicación. Haz clic abajo para recargar la tienda.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            Recargar Tienda
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
