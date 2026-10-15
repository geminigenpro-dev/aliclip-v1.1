import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Silently swallow benign Vite HMR WebSocket connection rejections in preview iframe
if (typeof window !== 'undefined') {
  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const msg = event?.reason?.message || String(event?.reason || '');
      if (
        msg.includes('WebSocket') ||
        msg.includes('websocket') ||
        msg.includes('closed without opened') ||
        msg.includes('[vite]')
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );
}

function mount() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    // Retry once if DOM is still being parsed
    setTimeout(mount, 50);
    return;
  }

  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
