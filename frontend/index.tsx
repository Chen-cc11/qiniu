import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// FIX: Import types.ts to ensure its global JSX namespace augmentations are applied.
// This makes TypeScript aware of the <model-viewer> custom element across the app.
import './types';

// Wait until the model-viewer custom element is defined before rendering the app
customElements.whenDefined('model-viewer').then(() => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
});