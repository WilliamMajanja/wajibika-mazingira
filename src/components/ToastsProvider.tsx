import * as React from 'react';
import type { Toast as ToastType } from '../types';
import { ToastsContext } from '../hooks/useToasts';

const MAX_VISIBLE_TOASTS = 5;

export const ToastsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastType[]>([]);

  const addToast = React.useCallback((t: Omit<ToastType, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts(prev => {
      const next = [...prev, { ...t, id }];
      return next.length > MAX_VISIBLE_TOASTS ? next.slice(next.length - MAX_VISIBLE_TOASTS) : next;
    });
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastsContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastsContext.Provider>
  );
};
