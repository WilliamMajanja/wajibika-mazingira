// src/types/pi.ts

/** Scopes that can be requested during Pi authentication. */
export type PiScope = 'username' | 'payments' | 'wallet_address';

/** User information returned after a successful Pi authentication. */
export interface PiUser {
  uid: string;
  username: string;
}

/** Result of a successful Pi.authenticate() call. */
export interface PiAuthResult {
  accessToken: string;
  user: PiUser;
}

/** Data required to create a Pi payment. */
export interface PiPaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

/** Unique identifier for a payment returned by the SDK. */
export type PaymentId = string;

/** Transaction hash on the Pi blockchain. */
export type TxId = string;

/** Callbacks invoked by the Pi SDK during the payment lifecycle. */
export interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: PaymentId) => void;
  onReadyForServerCompletion: (paymentId: PaymentId, txId: TxId) => void;
  onCancel: (paymentId: PaymentId) => void;
  onError: (error: Error, payment?: unknown) => void;
}

/** Shape of an incomplete payment passed to the handler callback. */
export interface PiIncompletePayment {
  identifier: PaymentId;
  transaction?: { txid: TxId } | null;
}

/** Configuration options for Pi.init(). */
export interface PiInitOptions {
  version: string;
  sandbox?: boolean;
}

/** Global Pi SDK interface exposed on the window object. */
export interface PiSDK {
  init: (options: PiInitOptions) => void;
  authenticate: (
    scopes: PiScope[],
    onIncompletePaymentFound: (payment: PiIncompletePayment) => void,
  ) => Promise<PiAuthResult>;
  createPayment: (
    data: PiPaymentData,
    callbacks: PiPaymentCallbacks,
  ) => void;
}

declare global {
  interface Window {
    Pi?: PiSDK;
  }
}
