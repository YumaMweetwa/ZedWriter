import { useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';

export const ToastSystem = () => {
  const { toasts, removeToast } = useApp();

  useEffect(() => {
    // Auto-remove toasts after their duration
    toasts.forEach((toast) => {
      if (toast.duration !== undefined) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
        
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2" data-testid="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`max-w-sm p-4 rounded-lg shadow-lg border animate-in slide-in-from-right duration-300 ${
            toast.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : toast.type === 'warning'
              ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
          data-testid={`toast-${toast.type}`}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <i
                className={`fas text-lg ${
                  toast.type === 'success'
                    ? 'fa-check-circle text-green-500'
                    : toast.type === 'error'
                    ? 'fa-exclamation-circle text-red-500'
                    : toast.type === 'warning'
                    ? 'fa-exclamation-triangle text-yellow-500'
                    : 'fa-info-circle text-blue-500'
                }`}
              />
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-semibold">{toast.title}</h4>
              <p className="text-sm mt-1">{toast.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-6 w-6 p-0 hover:bg-transparent"
              onClick={() => removeToast(toast.id)}
              data-testid={`close-toast-${toast.id}`}
            >
              <i className="fas fa-times text-xs opacity-70 hover:opacity-100"></i>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
