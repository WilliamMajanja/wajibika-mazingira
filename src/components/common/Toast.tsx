/// <reference types="react" />
import * as React from 'react';
import { useToasts } from '../../hooks/useToasts';
import { Toast as ToastType } from '../../types';

const Toast: React.FC<{ toast: ToastType; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [toast.id, onDismiss]);

  const baseClasses = 'w-full max-w-sm p-4 rounded-lg shadow-lg flex items-center space-x-4 transition-all duration-300';
  const typeClasses = {
    success: 'bg-green-100 border border-green-200 text-green-800',
    error: 'bg-red-100 border border-red-200 text-red-800',
    info: 'bg-blue-100 border border-blue-200 text-blue-800',
  };

  const Icon = ({ type }: { type: ToastType['type'] }) => {
      if (type === 'success') return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      if (type === 'error') return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
  }

  return (
    <div className={`${baseClasses} ${typeClasses[toast.type]}`}>
      <Icon type={toast.type} />
      <div className="flex-1">
        <p className="font-semibold">{toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}</p>
        <p className="text-sm">{toast.message}</p>
      </div>
       <button onClick={() => onDismiss(toast.id)} className="p-1 rounded-full text-current/50 hover:bg-black/10 hover:text-current/75">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToasts();

    return (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-3">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </div>
    );
};