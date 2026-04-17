import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import * as React from 'react';
import { ToastContainer } from '../components/common/Toast';
import { ToastsProvider, useToasts } from '../hooks/useToasts';

// Helper component that adds a toast on mount
const AddToastHelper: React.FC<{ type: 'success' | 'error' | 'info'; message: string }> = ({ type, message }) => {
  const { addToast } = useToasts();
  React.useEffect(() => {
    addToast({ type, message });
  }, []);
  return null;
};

const renderWithToast = (type: 'success' | 'error' | 'info', message: string) => {
  return render(
    <ToastsProvider>
      <AddToastHelper type={type} message={message} />
      <ToastContainer />
    </ToastsProvider>
  );
};

describe('Toast component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a success toast', () => {
    renderWithToast('success', 'Operation completed');
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders an error toast', () => {
    renderWithToast('error', 'Something went wrong');
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('renders an info toast', () => {
    renderWithToast('info', 'Please wait');
    expect(screen.getByText('Please wait')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('auto-dismisses after 5 seconds', () => {
    renderWithToast('info', 'Auto dismiss me');
    expect(screen.getByText('Auto dismiss me')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Auto dismiss me')).not.toBeInTheDocument();
  });
});

describe('ToastContainer', () => {
  it('renders empty when no toasts', () => {
    const { container } = render(
      <ToastsProvider>
        <ToastContainer />
      </ToastsProvider>
    );
    // The container div should exist but have no toast children
    const toastContainer = container.querySelector('.fixed');
    expect(toastContainer).toBeInTheDocument();
    expect(toastContainer?.children).toHaveLength(0);
  });
});
