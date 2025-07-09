/**
 * Sistema de debug para rotas
 * AIDEV-NOTE: Ajuda a identificar problemas de navegação e refresh
 */

export class RouteDebugger {
  static logRouteChange(location, previousLocation = null) {
    if (!import.meta.env?.DEV) return;
    
    console.group('🛣️ [RouteDebugger] Mudança de rota');
    console.log('📍 Nova rota:', location.pathname);
    console.log('🔍 Search params:', location.search);
    console.log('📌 Hash:', location.hash);
    
    if (previousLocation) {
      console.log('⬅️ Rota anterior:', previousLocation.pathname);
    }
    
    console.log('🌐 URL completa:', window.location.href);
    console.log('🏷️ Basename detectado:', import.meta.env.BASE_URL);
    console.groupEnd();
  }
  
  static logRefresh() {
    if (!import.meta.env?.DEV) return;
    
    const isRefresh = performance.navigation.type === 1;
    
    if (isRefresh) {
      console.group('🔄 [RouteDebugger] Refresh detectado');
      console.log('📍 URL atual:', window.location.pathname);
      console.log('🌐 URL completa:', window.location.href);
      console.log('💾 Session storage:', Object.keys(sessionStorage));
      console.log('🍪 Local storage keys:', Object.keys(localStorage));
      console.groupEnd();
    }
  }
  
  static logRouteValidation(route, params, isValid) {
    if (!import.meta.env?.DEV) return;
    
    console.group(`${isValid ? '✅' : '❌'} [RouteDebugger] Validação de rota`);
    console.log('🛣️ Rota:', route);
    console.log('📦 Parâmetros:', params);
    console.log('✔️ Válida:', isValid);
    console.groupEnd();
  }
  
  static logRedirect(from, to, reason) {
    if (!import.meta.env?.DEV) return;
    
    console.group('↪️ [RouteDebugger] Redirecionamento');
    console.log('⬅️ De:', from);
    console.log('➡️ Para:', to);
    console.log('❓ Motivo:', reason);
    console.groupEnd();
  }
}

// Hook para debug de rotas
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const useRouteDebug = () => {
  const location = useLocation();
  const previousLocationRef = useRef(null);
  
  useEffect(() => {
    RouteDebugger.logRouteChange(location, previousLocationRef.current);
    previousLocationRef.current = location;
  }, [location]);
  
  useEffect(() => {
    RouteDebugger.logRefresh();
  }, []);
};
