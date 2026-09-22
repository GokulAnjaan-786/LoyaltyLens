import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (title: string, message?: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (title: string, message?: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 animate-slideIn transition-all ${
              toast.type === 'success'
                ? 'bg-slate-900/95 border-emerald-500/50 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-slate-900/95 border-red-500/50 text-red-300'
                : toast.type === 'warning'
                ? 'bg-slate-900/95 border-amber-500/50 text-amber-300'
                : 'bg-slate-900/95 border-cyan-500/50 text-cyan-300'
            }`}
          >
            <div className="flex items-start gap-3">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}

              <div>
                <h4 className="text-xs font-bold text-white leading-snug">{toast.title}</h4>
                {toast.message && <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>}
              </div>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
