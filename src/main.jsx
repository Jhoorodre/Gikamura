// AIDEV-NOTE: App entry point; React 19 + router + query + contexts setup
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'
import './styles/widget-clean.css'
import './styles/reader.css'
import { AppProvider } from './context/AppContext.jsx';
import { RemoteStorageProvider } from './context/RemoteStorageContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// AIDEV-NOTE: React Query client with default config for caching
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <RemoteStorageProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </RemoteStorageProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
