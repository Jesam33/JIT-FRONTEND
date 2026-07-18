"use client";

import { Component } from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
          <h3 className="text-lg font-semibold text-red-400">Something went wrong</h3>
          <p className="mt-2 max-w-md text-sm text-white/60">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
