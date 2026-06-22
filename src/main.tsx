import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || event.reason;
    if (
      msg === 'WebSocket closed without opened.' ||
      (typeof msg === 'string' && (msg.includes('WebSocket') || msg.includes('websocket') || msg.includes('auth/emulator-config-failed')))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
