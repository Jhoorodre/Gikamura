/**
 * Sistema de persistência de rotas
 * AIDEV-NOTE: Salva estado da rota atual para evitar perda no refresh
 */

const ROUTE_STATE_KEY = 'gikamura-route-state';

export const RouteStatePersister = {
  save: (location, params = {}) => {
    try {
      const state = {
        pathname: location.pathname,
        search: location.search,
        params,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem(ROUTE_STATE_KEY, JSON.stringify(state));
      
      if (import.meta.env?.DEV) {
        console.log('💾 [RouteStatePersister] Estado salvo:', state);
      }
    } catch (error) {
      console.error('Erro ao salvar estado da rota:', error);
    }
  },
  
  load: () => {
    try {
      const saved = sessionStorage.getItem(ROUTE_STATE_KEY);
      if (!saved) return null;
      
      const state = JSON.parse(saved);
      
      // Verifica se o estado é recente (menos de 5 minutos)
      const isRecent = Date.now() - state.timestamp < 5 * 60 * 1000;
      
      if (!isRecent) {
        sessionStorage.removeItem(ROUTE_STATE_KEY);
        return null;
      }
      
      if (import.meta.env?.DEV) {
        console.log('📂 [RouteStatePersister] Estado carregado:', state);
      }
      
      return state;
    } catch (error) {
      console.error('Erro ao carregar estado da rota:', error);
      return null;
    }
  },
  
  clear: () => {
    sessionStorage.removeItem(ROUTE_STATE_KEY);
  }
};

// Hook para persistir estado da rota
import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export const useRoutePersistence = () => {
  const location = useLocation();
  const params = useParams();
  
  useEffect(() => {
    RouteStatePersister.save(location, params);
  }, [location, params]);
  
  return {
    savedState: RouteStatePersister.load(),
    clearState: RouteStatePersister.clear
  };
};
