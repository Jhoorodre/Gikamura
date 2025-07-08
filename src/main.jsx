// AIDEV-NOTE: App entry point; React 19 + router + query + contexts setup
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
// AIDEV-NOTE: css-import; usando apenas o novo sistema CSS unificado
import './styles/index.css'
import { AppProvider } from './context/AppContext.jsx';
import { RemoteStorageProvider } from './context/RemoteStorageContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// AIDEV-NOTE: React Query client with default config for caching
const queryClient = new QueryClient();

// AIDEV-NOTE: Configure basename for GitHub Pages - auto-detect from URL
const getBasename = () => {
  // Se estiver em produção, detectar automaticamente o basename
  if (import.meta.env.PROD) {
    const path = window.location.pathname;
    // Se a URL atual já contém /gikamura, usar como basename
    if (path.startsWith('/gikamura')) {
      return '/gikamura';
    }
    // Se não, assumir que não precisa de basename (domínio customizado)
    return '';
  }
  // Em desenvolvimento, sem basename
  return '';
};

const basename = getBasename();

// AIDEV-NOTE: Debug do basename para verificar configuração
if (import.meta.env.DEV) {
  console.log('🔗 [Router] Basename detectado:', basename);
  console.log('🔗 [Router] URL atual:', window.location.pathname);
  console.log('🔗 [Router] Produção:', import.meta.env.PROD);
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Anti-flickering improvements
const rootElement = document.getElementById('root');
rootElement.style.visibility = 'visible';
rootElement.style.opacity = '1';

root.render(
  <BrowserRouter basename={basename}>
    <QueryClientProvider client={queryClient}>
      <RemoteStorageProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </RemoteStorageProvider>
    </QueryClientProvider>
  </BrowserRouter>
);
