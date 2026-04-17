import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Suppress console.error during expected error boundary tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalConsoleError;
});

const ThrowingComponent = () => {
  throw new Error('Test error message');
};

const WorkingComponent = () => <div>Working content</div>;

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Working content')).toBeInTheDocument();
  });

  it('renders error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('provides a "Try Again" button that resets the boundary', async () => {
    const user = userEvent.setup();
    let shouldThrow = true;

    const ConditionalThrower = () => {
      if (shouldThrow) throw new Error('Conditional error');
      return <div>Recovered content</div>;
    };

    render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    shouldThrow = false;
    await user.click(screen.getByText('Try Again'));

    expect(screen.getByText('Recovered content')).toBeInTheDocument();
  });

  it('provides a "Reload Page" button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('shows a descriptive message about the error', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(
      screen.getByText(/An unexpected error occurred/)
    ).toBeInTheDocument();
  });
});
