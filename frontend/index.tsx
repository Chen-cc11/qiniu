
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Wait until the model-viewer custom element is defined before rendering the app
customElements.whenDefined('model-viewer').then(() => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
