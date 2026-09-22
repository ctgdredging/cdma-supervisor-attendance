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

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
