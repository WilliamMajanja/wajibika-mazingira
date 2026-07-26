import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { startPerfReporting } from './utils/perf';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Start lightweight perf reporting (exposed on window.__perfMetrics)
startPerfReporting();
