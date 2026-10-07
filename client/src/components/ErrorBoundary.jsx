import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="surface-panel p-8 max-w-md w-full text-center border-rose-500/40 shadow-sm border-red-500/50">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Component Execution Error</h3>
            <p className="text-sm text-zinc-400 mb-6 font-mono bg-zinc-900/60 p-3 rounded border border-zinc-800 text-left overflow-auto max-h-32">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-500 text-zinc-950 font-semibold transition-colors shadow-sm border-blue-500/50"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Component
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
