import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { checkAndResetStaleData } from './utils/cleanStorageReset';

// Reset data mock lawas & pastikan mulai dari kondisi bersih (Wajib Login)
checkAndResetStaleData();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
