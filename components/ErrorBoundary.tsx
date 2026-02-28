'use client';

import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-semibold mb-4">Terjadi Kesalahan</h1>
            <p className="text-muted-foreground mb-8">
              Aplikasi mengalami error. Silakan muat ulang halaman.
            </p>
            <button
              onClick={this.handleReload}
              className="min-h-[44px] px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 active:scale-[0.98] transition-transform"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
