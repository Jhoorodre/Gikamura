/**
 * Hook para lidar com refresh de página e navegação
 * AIDEV-NOTE: Previne problemas de renderização após F5
 */

import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { extractRouteParams } from '../config/routes';

export const useRefreshHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // Verifica se há um path armazenado do redirecionamento 404
    const reactRouterPath = sessionStorage.getItem('reactRouterPath');
    if (reactRouterPath && isInitialMount.current) {
      sessionStorage.removeItem('reactRouterPath');
      
      if (import.meta.env?.DEV) {
        console.log('🔄 [RefreshHandler] Navegando para path salvo:', reactRouterPath);
      }
      
      navigate(reactRouterPath, { replace: true });
      isInitialMount.current = false;
      return;
    }
    
    // Detecta se é refresh (F5)
    const isPageRefresh = performance.navigation.type === 1 || 
                         (performance.getEntriesByType('navigation')[0]?.type === 'reload');
    
    if (isPageRefresh && isInitialMount.current) {
      if (import.meta.env?.DEV) {
        console.log('🔄 [RefreshHandler] Refresh detectado');
      }
      
      // Valida se a rota atual é válida
      const routeParams = extractRouteParams(location.pathname);
      
      if (!routeParams && location.pathname !== '/' && 
          !location.pathname.includes('/collection') && 
          !location.pathname.includes('/works') && 
          !location.pathname.includes('/upload')) {
        
        if (import.meta.env?.DEV) {
          console.warn('❌ [RefreshHandler] Rota inválida após refresh:', location.pathname);
        }
        
        // Tenta recuperar rota salva
        const savedRoute = sessionStorage.getItem('last-valid-route');
        if (savedRoute && savedRoute !== location.pathname) {
          navigate(savedRoute, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        // Salva rota válida
        sessionStorage.setItem('last-valid-route', location.pathname);
      }
    }
    
    isInitialMount.current = false;
  }, [location, navigate]);
  
  // Salva rota válida em cada navegação
  useEffect(() => {
    const routeParams = extractRouteParams(location.pathname);
    
    if (routeParams || location.pathname === '/' || 
        location.pathname.includes('/collection') || 
        location.pathname.includes('/works') || 
        location.pathname.includes('/upload')) {
      sessionStorage.setItem('last-valid-route', location.pathname);
    }
  }, [location.pathname]);
};
