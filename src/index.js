import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './App.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';

// Automatically adapt API endpoints when deployed to cloud hosts like Vercel
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  const originalFetch = window.fetch;
  window.fetch = function (resource, init) {
    if (typeof resource === 'string' && resource.includes('/api/')) {
      const apiPath = resource.substring(resource.indexOf('/api/'));
      const apiBase = process.env.REACT_APP_API_URL || '';
      resource = apiBase ? `${apiBase}${apiPath}` : apiPath;
    }
    return originalFetch.call(this, resource, init);
  };

  axios.interceptors.request.use((config) => {
    if (config.url && config.url.includes('/api/')) {
      const apiPath = config.url.substring(config.url.indexOf('/api/'));
      const apiBase = process.env.REACT_APP_API_URL || '';
      config.url = apiBase ? `${apiBase}${apiPath}` : apiPath;
    }
    return config;
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
