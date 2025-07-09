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
  const hostname = window.location.hostname;
  
  // AIDEV-NOTE: Detecção específica para GitHub Pages
  if (hostname.includes('github.io') || hostname.includes('githubusercontent.com')) {
    return '/gikamura';
  }
  
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

// AIDEV-NOTE: Handle GitHub Pages SPA routing from sessionStorage
const handleInitialRoute = () => {
  const reactRouterPath = sessionStorage.getItem('reactRouterPath');
  if (reactRouterPath) {
    sessionStorage.removeItem('reactRouterPath');
    
    console.log('🔄 [Router] Redirecionando para:', reactRouterPath);
    console.log('🔄 [Router] Basename atual:', basename);
    console.log('🔄 [Router] URL antes do redirect:', window.location.href);
    
    // Special handling for reader routes
    if (reactRouterPath.startsWith('/reader/')) {
      console.log('📖 [Router] Detectado route do reader, aplicando diretamente');
    }
    
    // Use setTimeout to ensure React Router is ready
    setTimeout(() => {
      const newUrl = basename + reactRouterPath;
      console.log('🔄 [Router] Aplicando URL:', newUrl);
      
      // Try to prevent any React Router interference
      window.history.replaceState(null, null, newUrl);
      
      // Force a second update to ensure it sticks
      setTimeout(() => {
        if (window.location.pathname !== newUrl) {
          console.log('⚠️ [Router] URL foi alterada, forçando correção');
          window.history.replaceState(null, null, newUrl);
        }
        console.log('✅ [Router] Redirecionamento completo:', window.location.href);
        
        // Verify the redirect actually worked
        setTimeout(() => {
          console.log('🔍 [Router] Verificação final:', {
            expectedPath: reactRouterPath,
            actualPath: window.location.pathname,
            fullUrl: window.location.href,
            matches: window.location.pathname === newUrl
          });
        }, 50);
      }, 50);
    }, 100);
  }
};

// AIDEV-NOTE: Debug do basename para verificar configuração
console.log('🔗 [Router] Basename detectado:', basename);
console.log('🔗 [Router] URL atual:', window.location.pathname);
console.log('🔗 [Router] Hostname:', window.location.hostname);

// Handle initial route after DOM is ready
document.addEventListener('DOMContentLoaded', handleInitialRoute);
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
