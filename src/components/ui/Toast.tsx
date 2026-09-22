import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

let toastIdCounter = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
let currentToasts: Toast[] = [];

export function showToast(type: ToastType, message: string) {
  const id = `toast-${++toastIdCounter}`;
  currentToasts = [...currentToasts, { id, type, message }];
  listeners.forEach((fn) => fn(currentToasts));
  setTimeout(() => dismissToast(id), 4000);
}

function dismissToast(id: string) {
  currentToasts = currentToasts.filter((t) => t.id !== id);
  listeners.forEach((fn) => fn(currentToasts));
}

const config = {
  success: { icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/30' },
  error: { icon: XCircle, color: 'text-red-400 border-red-500/30' },
  info: { icon: Info, color: 'text-sky-400 border-sky-500/30' },
  warning: { icon: AlertCircle, color: 'text-orange-400 border-orange-500/30' },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast[]) => setToasts(t);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => {
        const c = config[toast.type];
        const Icon = c.icon;
        return (
          <div
            key={toast.id}
            className={clsx(
              'flex items-center gap-3 rounded-lg border bg-zinc-900/95 px-4 py-3 shadow-xl backdrop-blur animate-slide-in-right',
              c.color
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-sm text-zinc-200">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
