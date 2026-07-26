import * as React from 'react';
import type { Toast } from '../types';

export interface ToastsContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const ToastsContext = React.createContext<ToastsContextValue | undefined>(undefined);

export const useToasts = () => {
  const context = React.useContext(ToastsContext);
  if (context === undefined) {
    throw new Error('useToasts must be used within a ToastsProvider');
  }
  return context;
};
