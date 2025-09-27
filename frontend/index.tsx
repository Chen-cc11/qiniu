// FIX: Reordered imports to ensure global JSX type augmentations from './types'
// are loaded before any other module. This is critical for TypeScript to recognize
// custom elements like <model-viewer> and resolves JSX-related compilation errors
// throughout the application.
import './types';
import React from 'react';

import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// 等待 model-viewer 自定义元素定义完成后再渲染应用
customElements.whenDefined('model-viewer').then(() => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("找不到用于挂载的根元素");
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