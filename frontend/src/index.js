import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';   // must match the filename case

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
