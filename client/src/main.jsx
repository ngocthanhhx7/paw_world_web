import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import App from './App.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '14px',
            background: '#5A3A1B',
            color: '#FFFBEF',
            fontWeight: 600,
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
