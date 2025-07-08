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

// AIDEV-NOTE: Configure basename universalmente - funciona em qualquer domínio
const getBasename = () => {
  // Em desenvolvimento, sem basename
  if (import.meta.env.DEV) {
    return '';
  }
  
  // Em produção, detectar automaticamente baseado na URL atual
  const currentPath = window.location.pathname;
  
  // Se a página atual é a raiz ou já tem conteúdo, sem basename
  if (currentPath === '/' || currentPath === '/index.html') {
    return '';
  }
  
  // Se a URL contém /gikamura/, usar como basename
  if (currentPath.includes('/gikamura/')) {
    return '/gikamura';
  }
  
  // Se a URL começa com /gikamura (sem trailing slash)
  if (currentPath.startsWith('/gikamura')) {
    return '/gikamura';
  }
  
  // Para domínios customizados, sem basename
  return '';
};

const basename = getBasename();

// AIDEV-NOTE: Debug do basename para verificar configuração
console.log('🔗 [Router] Basename detectado:', basename);
console.log('🔗 [Router] URL atual:', window.location.pathname);
console.log('🔗 [Router] Hostname:', window.location.hostname);
console.log('🔗 [Router] Produção:', import.meta.env.PROD);

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
