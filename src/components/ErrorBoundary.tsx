import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('TRT FINDS render error:', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white p-6">
          <div className="max-w-md rounded-3xl border border-[#B7C9ED]/80 bg-[#F1F4FC]/60 p-8 text-center shadow-[0_20px_50px_-20px_rgba(16,26,53,0.18)]">
            <h2 className="font-display text-xl font-bold text-[#101A35]">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-[#1C3265]/80">
              We encountered an issue rendering this view. Please reload the page to continue.
            </p>
            {this.state.message && (
              <p className="mt-3 rounded-2xl bg-white/80 px-3 py-2 font-accent text-[11px] text-[#3156A5]/80">
                {this.state.message}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="apple-btn apple-btn-primary mt-5 inline-flex h-11 items-center justify-center px-6 text-sm font-semibold"
            >
              <span className="relative z-10">Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
