// src/services/piNetworkService.ts

import type {
  PiAuthResult,
  PiIncompletePayment,
  PiPaymentCallbacks,
  PiPaymentData,
  PaymentId,
  TxId,
} from '../types/pi';

/**
 * Whether the Pi SDK is available in the current browser context.
 * The SDK is only injected inside the Pi Browser.
 */
export const isPiSdkAvailable = (): boolean => typeof window !== 'undefined' && !!window.Pi;

/**
 * Initialise the Pi SDK. Should be called once at app startup.
 * In production set `sandbox` to `false`.
 */
export const initPiSdk = (sandbox = true): void => {
  if (!isPiSdkAvailable()) {
    console.warn('Pi SDK is not available. Running outside Pi Browser.');
    return;
  }
  window.Pi!.init({ version: '2.0', sandbox });
};

/**
 * Authenticate the current Pi user and obtain an access token.
 * The `onIncompletePaymentFound` callback is invoked if the user has a
 * payment that was started but not completed — the app should attempt
 * to complete it via the server.
 */
export const authenticateUser = async (
  onIncompletePaymentFound?: (payment: PiIncompletePayment) => void,
): Promise<PiAuthResult> => {
  if (!isPiSdkAvailable()) {
    throw new Error('Pi SDK is not available. Please open this app in the Pi Browser.');
  }

  const handler = onIncompletePaymentFound ?? ((_p: PiIncompletePayment) => {
    // Default: attempt to complete the payment server-side
    console.log('Incomplete payment found:', _p.identifier);
  });

  return window.Pi!.authenticate(['username', 'payments'], handler);
};

/**
 * Initiate a Pi payment for a premium feature.
 *
 * The flow:
 * 1. SDK calls `onReadyForServerApproval` → our server approves the payment.
 * 2. User confirms in Pi Browser.
 * 3. SDK calls `onReadyForServerCompletion` → our server completes the payment.
 */
export const createPayment = (
  amount: number,
  memo: string,
  metadata: Record<string, unknown>,
  onSuccess: () => void,
  onCancel: () => void,
  onError: (err: Error) => void,
): void => {
  if (!isPiSdkAvailable()) {
    onError(new Error('Pi SDK is not available. Please open this app in the Pi Browser.'));
    return;
  }

  const paymentData: PiPaymentData = { amount, memo, metadata };

  const approvePaymentOnServer = async (paymentId: PaymentId): Promise<void> => {
    const res = await fetch('/api/pi-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', paymentId }),
    });
    if (!res.ok) throw new Error('Server failed to approve payment');
  };

  const completePaymentOnServer = async (paymentId: PaymentId, txId: TxId): Promise<void> => {
    const res = await fetch('/api/pi-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', paymentId, txId }),
    });
    if (!res.ok) throw new Error('Server failed to complete payment');
  };

  const callbacks: PiPaymentCallbacks = {
    onReadyForServerApproval: async (paymentId) => {
      try {
        await approvePaymentOnServer(paymentId);
      } catch (err) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onReadyForServerCompletion: async (paymentId, txId) => {
      try {
        await completePaymentOnServer(paymentId, txId);
        onSuccess();
      } catch (err) {
        onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    onCancel: (_paymentId) => {
      onCancel();
    },
    onError: (error, _payment) => {
      onError(error);
    },
  };

  window.Pi!.createPayment(paymentData, callbacks);
};
