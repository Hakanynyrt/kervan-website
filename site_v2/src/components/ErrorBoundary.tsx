import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label to prefix console errors with for diagnostics. */
  label?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Class-based ErrorBoundary — Sahnenin runtime hatası tüm React tree'yi
 * ünmount etmesin diye. WebGL fail / GLB load edemezse / bilinmeyen
 * exception olursa fallback render eder, page çalışmaya devam eder.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.label ?? 'errboundary'}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
