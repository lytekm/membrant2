import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MembrantProvider, type StorageAdapter } from '@membrant/client';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import { App } from './app/App';
import './styles.css';
import { applyAppearance, storedAppearance } from './design/theme';

applyAppearance(storedAppearance());

const storage: StorageAdapter = {
  getItem: async (key) => localStorage.getItem(key),
  setItem: async (key, value) => localStorage.setItem(key, value),
  removeItem: async (key) => localStorage.removeItem(key),
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MembrantProvider
        storage={storage}
        apiUrl={import.meta.env.VITE_API_URL ?? 'http://localhost:3001'}
      >
        <App />
      </MembrantProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
