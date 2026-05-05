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

const parseBooleanEnv = (value: string | boolean | undefined, defaultValue: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === undefined || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

/**
 * GitHub Pages is a production static host, so default Pi SDK usage to mainnet
 * for production builds unless VITE_PI_SANDBOX explicitly opts into sandbox.
 */
export const isPiSandboxMode = (): boolean => (
  parseBooleanEnv(import.meta.env.VITE_PI_SANDBOX as string | undefined, import.meta.env.DEV)
);

/**
 * Pi payments need a server endpoint for approval/completion. Static GitHub
 * Pages deployments can omit this endpoint, in which case premium features
 * should remain usable instead of showing an unusable payment flow.
 */
export const isPiPaymentConfigured = (): boolean => (
  !!(import.meta.env.VITE_PI_PAYMENT_ENDPOINT as string | undefined)
);

/**
 * Initialise the Pi SDK. Should be called once at app startup.
 * In production set `sandbox` to `false`.
 */
export const initPiSdk = (sandbox = isPiSandboxMode()): void => {
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

  const PI_PAYMENT_ENDPOINT = import.meta.env.VITE_PI_PAYMENT_ENDPOINT as string | undefined;

  const approvePaymentOnServer = async (paymentId: PaymentId): Promise<void> => {
    if (!PI_PAYMENT_ENDPOINT) {
      console.warn('Pi payment server endpoint not configured (VITE_PI_PAYMENT_ENDPOINT). Payment approval skipped.');
      return;
    }
    const res = await fetch(PI_PAYMENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', paymentId }),
    });
    if (!res.ok) throw new Error('Server failed to approve payment');
  };

  const completePaymentOnServer = async (paymentId: PaymentId, txId: TxId): Promise<void> => {
    if (!PI_PAYMENT_ENDPOINT) {
      console.warn('Pi payment server endpoint not configured (VITE_PI_PAYMENT_ENDPOINT). Payment completion skipped.');
      return;
    }
    const res = await fetch(PI_PAYMENT_ENDPOINT, {
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
