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

let isMounted = false;

function mount() {
  if (isMounted) return;

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
      setTimeout(mount, 30);
    }
    return;
  }

  try {
    isMounted = true;
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (err) {
    console.error('Critical initialization error:', err);
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #0b0f19; color: #ffffff; font-family: system-ui, -apple-system, sans-serif; padding: 24px; text-align: center;">
          <div style="max-width: 440px;">
            <div style="width: 48px; height: 48px; border-radius: 14px; background: rgba(99, 102, 241, 0.15); color: #818cf8; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; margin: 0 auto 16px;">!</div>
            <h2 style="font-size: 19px; font-weight: 800; margin-bottom: 8px;">AliClip Store</h2>
            <p style="font-size: 13px; color: #94a3b8; margin-bottom: 20px; line-height: 1.5;">La tienda está cargando los componentes más recientes. Haz clic abajo para actualizar.</p>
            <button onclick="window.location.reload()" style="background: #4f46e5; color: #ffffff; border: none; padding: 10px 22px; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">Recargar Tienda</button>
          </div>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
