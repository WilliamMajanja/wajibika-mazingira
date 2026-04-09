// src/components/PiPaymentButton.tsx

import * as React from 'react';
import { usePiAuth } from '../contexts/PiAuthContext';
import { createPayment } from '../services/piNetworkService';
import { useToasts } from '../hooks/useToasts';

interface PiPaymentButtonProps {
  /** Amount of Pi to charge. */
  amount: number;
  /** Short description shown to the user in the Pi Browser payment dialog. */
  memo: string;
  /** Arbitrary metadata stored with the payment. */
  metadata?: Record<string, unknown>;
  /** Called after a successful payment — use this to unlock the feature. */
  onPaymentSuccess: () => void;
  /** Label shown on the button. */
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

const PiIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <text x="4" y="18" fontSize="16" fontWeight="bold" fontFamily="serif">π</text>
  </svg>
);

export const PiPaymentButton: React.FC<PiPaymentButtonProps> = ({
  amount,
  memo,
  metadata = {},
  onPaymentSuccess,
  children,
  className = '',
  disabled = false,
}) => {
  const { user, sdkAvailable, login } = usePiAuth();
  const { addToast } = useToasts();
  const [isPaying, setIsPaying] = React.useState(false);

  const handleClick = async () => {
    if (!sdkAvailable) {
      addToast({ type: 'info', message: 'Open this app in the Pi Browser to use Pi payments.' });
      return;
    }

    // Ensure the user is logged in first
    if (!user) {
      await login();
      return;
    }

    setIsPaying(true);
    createPayment(
      amount,
      memo,
      metadata,
      () => {
        setIsPaying(false);
        addToast({ type: 'success', message: 'Payment successful! Feature unlocked.' });
        onPaymentSuccess();
      },
      () => {
        setIsPaying(false);
        addToast({ type: 'info', message: 'Payment was cancelled.' });
      },
      (err) => {
        setIsPaying(false);
        addToast({ type: 'error', message: `Payment failed: ${err.message}` });
      },
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isPaying}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      <PiIcon className="h-4 w-4" />
      {isPaying ? 'Processing…' : children}
    </button>
  );
};
