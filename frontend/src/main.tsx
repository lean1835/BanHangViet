import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary.tsx';
import './index.css';

// Tự động reload khi người dùng mở tab từ phiên bản cũ và deploy bản mới làm chunk cũ bị 404
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module')
  ) {
    const isReloaded = sessionStorage.getItem('chunk_auto_reloaded');
    if (!isReloaded) {
      sessionStorage.setItem('chunk_auto_reloaded', 'true');
      window.location.reload();
    }
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>,
);
