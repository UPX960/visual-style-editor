import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  compact?: boolean;
}

interface ErrorBoundaryState {
  failed: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("Visual Style Editor UI error", error, errorInfo);
    }
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minWidth: this.props.compact ? 320 : 360,
          padding: 20,
          borderRadius: 12,
          background: "#171a23",
          color: "#f4f5f8",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: 13,
          lineHeight: 1.5,
          pointerEvents: "auto"
        }}
      >
        <strong>Visual Style Editor could not render.</strong>
        <div style={{ marginTop: 6, color: "#a7adba", fontSize: 11 }}>
          Reload the page and reopen the extension. Your saved CSS is unchanged.
        </div>
      </div>
    );
  }
}
