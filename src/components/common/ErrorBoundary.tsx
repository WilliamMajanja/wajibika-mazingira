import * as React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Changing this value resets the error state without unmounting the tree. */
  resetKey?: React.Key;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  prevResetKey?: React.Key;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, prevResetKey: props.resetKey };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidUpdate(_prevProps: ErrorBoundaryProps): void {
    // Reset error state when resetKey changes (e.g. page navigation)
    if (this.props.resetKey !== undefined && this.props.resetKey !== this.state.prevResetKey) {
      this.setState({ hasError: false, error: null, errorInfo: null, prevResetKey: this.props.resetKey });
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error.message, errorInfo.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-slate-500 mb-1 max-w-md">
            An unexpected error occurred. You can try resetting this section or reload the entire page.
          </p>
          {isDev && this.state.error && (
            <details className="w-full max-w-md mb-4">
              <summary className="text-sm text-red-500 cursor-pointer hover:text-red-600">
                Error details (dev mode)
              </summary>
              <pre className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-left text-red-700 overflow-auto max-h-48">
                {this.state.error.message}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-green-600 rounded-lg hover:bg-brand-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green-500"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green-500"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
