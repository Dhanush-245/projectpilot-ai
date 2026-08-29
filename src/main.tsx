import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Application root element is missing');
const root = createRoot(rootElement);

root.render(
  <main className="min-h-screen bg-[#050505] text-[#aaaaaa] flex items-center justify-center">
    <p className="text-sm">Starting ProjectPilot…</p>
  </main>
);

import('./App.tsx')
  .then(({ default: App }) => {
    root.render(
      <StrictMode>
        <AppErrorBoundary><App /></AppErrorBoundary>
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    console.error('Application initialization failed:', error instanceof Error ? error.name : 'UnknownError');
    root.render(
      <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
        <section className="max-w-lg rounded-2xl border border-red-500/30 bg-[#111111] p-6 text-center space-y-3">
          <h1 className="text-xl font-semibold">ProjectPilot configuration error</h1>
          <p className="text-sm text-[#aaaaaa]">The application could not initialize. Verify the Firebase web configuration and reload.</p>
        </section>
      </main>
    );
  });
