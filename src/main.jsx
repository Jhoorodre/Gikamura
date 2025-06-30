import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { HistoryProvider } from './context/HistoryContext.jsx'
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <HistoryProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </HistoryProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
