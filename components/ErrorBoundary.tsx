"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Shown in user-facing copy, e.g. "reviews" → "loading reviews". */
  sectionName?: string;
  /** Forward to analytics / Sentry / etc. */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = (): void => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === "development";
      const section = this.props.sectionName?.trim();

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-oma-beige/30 to-white">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full border border-oma-gold/10">
            <h2 className="text-2xl font-canela text-oma-cocoa mb-3">
              Something went wrong
            </h2>
            <p className="text-sm text-oma-cocoa/80 mb-4">
              {section
                ? `We couldn’t load this part (${section}). You can try again or refresh the page.`
                : "Something unexpected happened. You can try again or refresh the page."}
            </p>
            {isDev && this.state.error ? (
              <div className="bg-oma-beige/50 p-4 rounded-md overflow-auto mb-4 border border-oma-gold/20">
                <code className="text-xs text-oma-cocoa whitespace-pre-wrap break-words">
                  {this.state.error.message || "Unknown error"}
                </code>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 border border-oma-cocoa/30 rounded-md text-oma-cocoa hover:bg-oma-beige/50 transition-colors"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={this.handleRefresh}
                className="px-4 py-2 bg-oma-plum text-white rounded-md hover:bg-oma-plum/90 transition-colors"
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
