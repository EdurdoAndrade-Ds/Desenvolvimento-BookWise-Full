import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './theme/ThemeProvider';
import { FeedbackProvider } from './feedback/FeedbackProvider';
import './index.css';
import BackendMonitor from './components/BackendMonitor';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <FeedbackProvider>
        <BrowserRouter>
          <BackendMonitor />
          <App />
        </BrowserRouter>
      </FeedbackProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
