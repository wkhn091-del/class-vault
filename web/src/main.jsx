import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { LocaleProvider } from './context/LocaleContext.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <ToastProvider>
          <AdminProvider>
            <App />
          </AdminProvider>
        </ToastProvider>
      </LocaleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
