"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Patchwork UI:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 rounded-2xl border border-rose-900/60 bg-rose-950/20 text-center space-y-4 shadow-2xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Something went wrong
            </h2>
            <p className="text-xs text-slate-400 font-mono bg-slate-900/80 p-3 rounded-lg border border-slate-800 break-words text-left">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-lg shadow-rose-900/30"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
