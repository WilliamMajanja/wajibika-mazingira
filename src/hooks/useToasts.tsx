import * as React from 'react';
import { Toast } from '../types';

interface ToastsContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastsContext = React.createContext<ToastsContextType | undefined>(undefined);

export const ToastsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts(prevToasts => [...prevToasts, { id, ...toast }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastsContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastsContext.Provider>
  );
};

export const useToasts = () => {
  const context = React.useContext(ToastsContext);
  if (context === undefined) {
    throw new Error('useToasts must be used within a ToastsProvider');
  }
  return context;
};
