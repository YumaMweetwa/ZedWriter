import { createContext, useContext, useState, ReactNode } from 'react';
import { NotificationToast, LoadingState } from '@/types';
import { generateId } from '@/utils/helpers';

interface AppContextType {
  toasts: NotificationToast[];
  loading: LoadingState;
  showToast: (toast: Omit<NotificationToast, 'id'>) => void;
  removeToast: (id: string) => void;
  setLoading: (loading: LoadingState) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  const [loading, setLoadingState] = useState<LoadingState>({ isLoading: false });

  const showToast = (toast: Omit<NotificationToast, 'id'>) => {
    const id = generateId();
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const setLoading = (loading: LoadingState) => {
    setLoadingState(loading);
  };

  const value = {
    toasts,
    loading,
    showToast,
    removeToast,
    setLoading,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
