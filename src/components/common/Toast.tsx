
import * as React from 'react';
import { useToasts } from '../../hooks/useToasts';
import { Toast as ToastType } from '../../types';

const SuccessIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const ErrorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

function ToastIcon({ type }: { type: ToastType['type'] }) {
  if (type === 'success') return <SuccessIcon />;
  if (type === 'error') return <ErrorIcon />;
  return <InfoIcon />;
}

export const Toast: React.FC<{ toast: ToastType; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const duration = toast.type === 'error' ? 10000 : toast.type === 'success' ? 5000 : 7000;

  React.useEffect(() => {
    if (isPaused) return;
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.id, onDismiss, duration, isPaused]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const baseClasses = 'w-full max-w-sm p-4 rounded-lg shadow-lg flex items-center space-x-4 transition-all duration-300';
  const typeClasses = {
    success: 'bg-green-100 border border-green-200 text-green-800',
    error: 'bg-red-100 border border-red-200 text-red-800',
    info: 'bg-blue-100 border border-blue-200 text-blue-800',
  };

  return (
    <div
      className={`${baseClasses} ${typeClasses[toast.type]}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <ToastIcon type={toast.type} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}</p>
        <p className="text-sm">{toast.message}</p>
      </div>
       <button
         onClick={() => onDismiss(toast.id)}
         aria-label="Dismiss notification"
         className="p-1.5 rounded-full text-current/50 hover:bg-black/10 hover:text-current/75 focus:outline-none focus:ring-2 focus:ring-current/30 flex-shrink-0 min-h-[32px] min-w-[32px] items-center justify-center"
       >
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
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-3" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} aria-label="Notifications">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </div>
    );
};
