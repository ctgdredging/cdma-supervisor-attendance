// Ensure fetch property is writable on window / globalThis to prevent
// "TypeError: Cannot set property fetch of #<Window> which has only a getter"
// in restricted iframe environments
try {
  const g = typeof window !== 'undefined' ? window : globalThis;
  const desc = Object.getOwnPropertyDescriptor(g, 'fetch') || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(g), 'fetch');
  if (desc && !desc.writable && !desc.set) {
    let currentFetch = g.fetch;
    Object.defineProperty(g, 'fetch', {
      get() { return currentFetch; },
      set(val) { currentFetch = val; },
      configurable: true,
      enumerable: true,
    });
  }
} catch {
  // Ignore if running in non-configurable environment
}

// Intercept benign abort errors from unhandled promise rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = (reason && (reason.message || reason.name || String(reason))) || '';
    if (
      (reason && reason.name === 'AbortError') ||
      msg.includes('The user aborted a request') ||
      msg.includes('aborted') ||
      msg.includes('cancelled')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = (event && event.message) || '';
    if (msg.includes('The user aborted a request') || msg.includes('AbortError')) {
      event.preventDefault();
    }
  });
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
