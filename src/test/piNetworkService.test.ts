import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  isPiSdkAvailable,
  isPiSandboxMode,
  isPiPaymentConfigured,
  initPiSdk,
  authenticateUser,
  createPayment,
} from '../services/piNetworkService';
import type { PiSDK } from '../types/pi';

describe('isPiSdkAvailable', () => {
  afterEach(() => {
    delete (window as any).Pi;
  });

  it('returns false when Pi is not on window', () => {
    delete (window as any).Pi;
    expect(isPiSdkAvailable()).toBe(false);
  });

  it('returns true when Pi is on window', () => {
    (window as any).Pi = { init: vi.fn() };
    expect(isPiSdkAvailable()).toBe(true);
  });
});

describe('isPiSandboxMode', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to sandbox in non-production test builds', () => {
    vi.stubEnv('VITE_PI_SANDBOX', '');
    expect(isPiSandboxMode()).toBe(true);
  });

  it('can be disabled for mainnet deployments', () => {
    vi.stubEnv('VITE_PI_SANDBOX', 'false');
    expect(isPiSandboxMode()).toBe(false);
  });
});

describe('isPiPaymentConfigured', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns false without a payment endpoint', () => {
    vi.stubEnv('VITE_PI_PAYMENT_ENDPOINT', '');
    expect(isPiPaymentConfigured()).toBe(false);
  });

  it('returns true when a payment endpoint is configured', () => {
    vi.stubEnv('VITE_PI_PAYMENT_ENDPOINT', 'https://example.com/pi-payments');
    expect(isPiPaymentConfigured()).toBe(true);
  });
});

describe('initPiSdk', () => {
  afterEach(() => {
    delete (window as any).Pi;
  });

  it('calls Pi.init with sandbox=true by default', () => {
    const mockInit = vi.fn();
    (window as any).Pi = { init: mockInit } as unknown as PiSDK;
    initPiSdk();
    expect(mockInit).toHaveBeenCalledWith({ version: '2.0', sandbox: true });
  });

  it('calls Pi.init with sandbox=false when specified', () => {
    const mockInit = vi.fn();
    (window as any).Pi = { init: mockInit } as unknown as PiSDK;
    initPiSdk(false);
    expect(mockInit).toHaveBeenCalledWith({ version: '2.0', sandbox: false });
  });

  it('does not throw when Pi SDK is not available', () => {
    delete (window as any).Pi;
    expect(() => initPiSdk()).not.toThrow();
  });
});

describe('authenticateUser', () => {
  afterEach(() => {
    delete (window as any).Pi;
  });

  it('throws when Pi SDK is not available', async () => {
    delete (window as any).Pi;
    await expect(authenticateUser()).rejects.toThrow(
      'Pi SDK is not available'
    );
  });

  it('calls Pi.authenticate with correct scopes', async () => {
    const mockAuth = vi.fn().mockResolvedValue({
      accessToken: 'test-token',
      user: { uid: '123', username: 'testuser' },
    });
    (window as any).Pi = {
      init: vi.fn(),
      authenticate: mockAuth,
    } as unknown as PiSDK;

    const result = await authenticateUser();
    expect(mockAuth).toHaveBeenCalledWith(
      ['username', 'payments'],
      expect.any(Function)
    );
    expect(result.accessToken).toBe('test-token');
    expect(result.user.username).toBe('testuser');
  });

  it('passes custom onIncompletePaymentFound handler', async () => {
    const customHandler = vi.fn();
    const mockAuth = vi.fn().mockResolvedValue({
      accessToken: 'token',
      user: { uid: '1', username: 'user1' },
    });
    (window as any).Pi = {
      init: vi.fn(),
      authenticate: mockAuth,
    } as unknown as PiSDK;

    await authenticateUser(customHandler);
    expect(mockAuth).toHaveBeenCalledWith(
      ['username', 'payments'],
      customHandler
    );
  });
});

describe('createPayment', () => {
  afterEach(() => {
    delete (window as any).Pi;
  });

  it('calls onError when Pi SDK is not available', () => {
    delete (window as any).Pi;
    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const onError = vi.fn();

    createPayment(1, 'test memo', {}, onSuccess, onCancel, onError);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toContain('Pi SDK is not available');
  });

  it('calls Pi.createPayment with correct data and callbacks', () => {
    const mockCreatePayment = vi.fn();
    (window as any).Pi = {
      init: vi.fn(),
      authenticate: vi.fn(),
      createPayment: mockCreatePayment,
    } as unknown as PiSDK;

    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const onError = vi.fn();

    createPayment(0.5, 'Test payment', { feature: 'test' }, onSuccess, onCancel, onError);
    expect(mockCreatePayment).toHaveBeenCalledWith(
      { amount: 0.5, memo: 'Test payment', metadata: { feature: 'test' } },
      expect.objectContaining({
        onReadyForServerApproval: expect.any(Function),
        onReadyForServerCompletion: expect.any(Function),
        onCancel: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('onCancel callback invokes the user-provided onCancel', () => {
    const mockCreatePayment = vi.fn();
    (window as any).Pi = {
      init: vi.fn(),
      authenticate: vi.fn(),
      createPayment: mockCreatePayment,
    } as unknown as PiSDK;

    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const onError = vi.fn();

    createPayment(1, 'memo', {}, onSuccess, onCancel, onError);

    // Get the callbacks passed to Pi.createPayment
    const callbacks = mockCreatePayment.mock.calls[0][1];
    callbacks.onCancel('payment-id-123');
    expect(onCancel).toHaveBeenCalled();
  });

  it('onError callback invokes the user-provided onError', () => {
    const mockCreatePayment = vi.fn();
    (window as any).Pi = {
      init: vi.fn(),
      authenticate: vi.fn(),
      createPayment: mockCreatePayment,
    } as unknown as PiSDK;

    const onSuccess = vi.fn();
    const onCancel = vi.fn();
    const onError = vi.fn();

    createPayment(1, 'memo', {}, onSuccess, onCancel, onError);

    const callbacks = mockCreatePayment.mock.calls[0][1];
    const testError = new Error('payment failed');
    callbacks.onError(testError);
    expect(onError).toHaveBeenCalledWith(testError);
  });
});
