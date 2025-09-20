import React from 'react';
import ReactDOM from 'react-dom/client';
// AG Grid imports without module registration for now
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import App from './App';
import './css/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);