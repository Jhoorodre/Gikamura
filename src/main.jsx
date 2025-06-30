import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'
import { HashRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
        <AppProvider>
          <App />
        </AppProvider>
    </HashRouter>
  </React.StrictMode>,
)
