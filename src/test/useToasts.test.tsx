import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as React from 'react';
import { ToastsProvider, useToasts } from '../hooks/useToasts';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ToastsProvider, null, children);

describe('useToasts', () => {
  it('throws when used outside ToastsProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useToasts());
    }).toThrow('useToasts must be used within a ToastsProvider');
    consoleSpy.mockRestore();
  });

  it('starts with an empty toast list', () => {
    const { result } = renderHook(() => useToasts(), { wrapper });
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast', () => {
    const { result } = renderHook(() => useToasts(), { wrapper });

    act(() => {
      result.current.addToast({ type: 'success', message: 'Test success' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].message).toBe('Test success');
    expect(result.current.toasts[0].id).toBeTruthy();
  });

  it('adds multiple toasts', () => {
    const { result } = renderHook(() => useToasts(), { wrapper });

    act(() => {
      result.current.addToast({ type: 'success', message: 'First' });
      result.current.addToast({ type: 'error', message: 'Second' });
      result.current.addToast({ type: 'info', message: 'Third' });
    });

    expect(result.current.toasts).toHaveLength(3);
  });

  it('removes a toast by id', () => {
    const { result } = renderHook(() => useToasts(), { wrapper });

    act(() => {
      result.current.addToast({ type: 'info', message: 'To be removed' });
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.removeToast(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  it('only removes the specified toast', () => {
    const { result } = renderHook(() => useToasts(), { wrapper });

    act(() => {
      result.current.addToast({ type: 'success', message: 'Keep' });
      result.current.addToast({ type: 'error', message: 'Remove' });
    });

    const removeId = result.current.toasts[1].id;

    act(() => {
      result.current.removeToast(removeId);
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Keep');
  });

  it('generates unique IDs for each toast', () => {
    const { result } = renderHook(() => useToasts(), { wrapper });

    act(() => {
      result.current.addToast({ type: 'info', message: 'A' });
      result.current.addToast({ type: 'info', message: 'B' });
    });

    const ids = result.current.toasts.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });
});
