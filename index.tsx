import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Assuming a global stylesheet is present, e.g., for Tailwind CSS
// import './index.css'; 

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
