"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="font-medium text-stone-900 mb-1">เกิดข้อผิดพลาด</p>
          <p className="text-sm text-stone-500 mb-4">{this.state.error?.message ?? "Something went wrong"}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800"
          >
            ลองอีกครั้ง
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
