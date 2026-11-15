import { Component, type ReactNode } from 'react';

/**
 * Around a shop page: a page that throws (data from a newer site the installed app's code does
 * not expect) shows `fallback` (the update screen) instead of a blank app. Keyed by the page's
 * address in AppShell, so the next page starts clean; a new `resetKey` (the page's fresh copy)
 * gives a failed page another try with the new data.
 */
export class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode; resetKey?: unknown },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidUpdate(prev: { resetKey?: unknown }): void {
    if (prev.resetKey !== this.props.resetKey && this.state.failed)
      this.setState({ failed: false });
  }

  override render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
