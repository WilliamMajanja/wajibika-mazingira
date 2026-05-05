// src/contexts/PiAuthContext.tsx

import * as React from 'react';
import type { PiUser, PiIncompletePayment } from '../types/pi';
import {
  isPiSdkAvailable,
  initPiSdk,
  authenticateUser,
  isPiSandboxMode,
} from '../services/piNetworkService';

interface PiAuthState {
  /** Whether the Pi SDK is available (i.e. app is running inside Pi Browser). */
  sdkAvailable: boolean;
  /** The currently authenticated Pi user, or null if not authenticated. */
  user: PiUser | null;
  /** The access token issued by Pi after authentication. */
  accessToken: string | null;
  /** Whether an authentication attempt is in progress. */
  isAuthenticating: boolean;
  /** Trigger a login flow. */
  login: () => Promise<void>;
  /** Clear local auth state (the Pi SDK does not expose a logout method). */
  logout: () => void;
}

const PiAuthContext = React.createContext<PiAuthState | undefined>(undefined);

export const PiAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<PiUser | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const sdkAvailable = React.useMemo(() => isPiSdkAvailable(), []);

  // Initialise Pi SDK on mount
  React.useEffect(() => {
    if (sdkAvailable) {
      initPiSdk(isPiSandboxMode());
    }
  }, [sdkAvailable]);

  const handleIncompletePayment = React.useCallback(async (payment: PiIncompletePayment) => {
    // Attempt to complete the payment server-side if an endpoint is configured
    const piPaymentEndpoint = import.meta.env.VITE_PI_PAYMENT_ENDPOINT as string | undefined;
    try {
      if (payment.transaction?.txid && piPaymentEndpoint) {
        await fetch(piPaymentEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete',
            paymentId: payment.identifier,
            txId: payment.transaction.txid,
          }),
        });
      } else if (!piPaymentEndpoint) {
        console.warn('Pi payment server endpoint not configured. Cannot complete pending payment:', payment.identifier);
      }
    } catch (err) {
      console.error('Failed to complete pending payment:', err);
    }
  }, []);

  const login = React.useCallback(async () => {
    if (!sdkAvailable) return;
    setIsAuthenticating(true);
    try {
      const result = await authenticateUser(handleIncompletePayment);
      setUser(result.user);
      setAccessToken(result.accessToken);
    } catch (err) {
      console.error('Pi authentication failed:', err);
    } finally {
      setIsAuthenticating(false);
    }
  }, [sdkAvailable, handleIncompletePayment]);

  const logout = React.useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = React.useMemo<PiAuthState>(
    () => ({ sdkAvailable, user, accessToken, isAuthenticating, login, logout }),
    [sdkAvailable, user, accessToken, isAuthenticating, login, logout],
  );

  return <PiAuthContext.Provider value={value}>{children}</PiAuthContext.Provider>;
};

export const usePiAuth = (): PiAuthState => {
  const ctx = React.useContext(PiAuthContext);
  if (!ctx) throw new Error('usePiAuth must be used within a PiAuthProvider');
  return ctx;
};
