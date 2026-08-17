import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorkerAutoUpdate } from './services/serviceWorkerManager.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register and manage automatic updates for Service Worker and PWA
registerServiceWorkerAutoUpdate();

