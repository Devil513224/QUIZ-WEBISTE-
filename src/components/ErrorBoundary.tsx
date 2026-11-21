import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

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
      message: error?.message || 'An unexpected error occurred.',
    };
  }

  render() {
    if (this.state.hasError) {
      let friendly = 'Something went wrong while loading application data.';
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error) {
          friendly = `Database access issue (${parsed.operationType || 'read'}): ${parsed.error}`;
        }
      } catch {
        if (this.state.message) friendly = this.state.message;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6 text-slate-900 dark:bg-[#0b1730] dark:text-slate-100">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-lg dark:border-red-900/40 dark:bg-[#122443]">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-600 dark:text-red-400" />
            <h1 className="font-display text-xl font-bold">LEARN WITH TG</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-[#9fb0c8]">{friendly}</p>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#102544] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reload Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
