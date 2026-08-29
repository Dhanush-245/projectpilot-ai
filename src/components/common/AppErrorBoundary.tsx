import React from 'react';

interface State {
  error: Error | null;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Application UI error:', error.name);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
          <section className="max-w-lg rounded-2xl border border-red-500/30 bg-[#111111] p-6 text-center space-y-3">
            <h1 className="text-xl font-semibold">ProjectPilot could not start</h1>
            <p className="text-sm text-[#aaaaaa]">
              The application encountered a configuration or runtime error. Refresh the page, and contact the administrator if the problem continues.
            </p>
            <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black" onClick={() => window.location.reload()}>
              Reload application
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
