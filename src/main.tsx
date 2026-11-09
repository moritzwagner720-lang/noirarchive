import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Purge legacy placeholder storage keys so user starts fresh without any placeholder items
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('noir_archive_') && !k.endsWith('_v5')) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  sessionStorage.clear();
} catch {
  // ignore
}

// Enforce manual scroll restoration: always open and reload at the top of the page
if (typeof window !== 'undefined') {
  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });

  window.addEventListener('pageshow', () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}

createRoot(document.getElementById('root')!).render(<App />);

