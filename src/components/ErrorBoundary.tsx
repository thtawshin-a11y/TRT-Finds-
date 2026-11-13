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

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white p-6">
          <div className="max-w-md rounded-2xl border border-[#B7C9ED] bg-[#F1F4FC]/60 p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-[#101A35]">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-[#1C3265]/80">
              We encountered an issue rendering this view. Please reload the page to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-[#1C3265] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#101A35]"
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
