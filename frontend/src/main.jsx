import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#13131f',
          color: '#f1f5f9',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          fontSize: '0.875rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#13131f',
          },
          style: {
            borderColor: 'rgba(16,185,129,0.25)',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#13131f',
          },
          style: {
            borderColor: 'rgba(239,68,68,0.25)',
          },
        },
      }}
    />
  </React.StrictMode>
);
