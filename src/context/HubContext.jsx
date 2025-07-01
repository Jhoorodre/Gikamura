import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { APP_CONFIG } from '../constants/app';

const HubContext = createContext();

export const useHub = () => {
  const context = useContext(HubContext);
  if (!context) {
    throw new Error('useHub must be used within a HubProvider');
  }
  return context;
};

export const HubProvider = ({ children }) => {
  const [hubUrlToLoad, setHubUrlToLoad] = useState(null);
  const [lastAttemptedUrl, setLastAttemptedUrl] = useState('');

  // Carregamento do Hub com useQuery
  const {
    data: currentHubData,
    isLoading: hubLoading,
    error: hubError,
    refetch: refetchHub
  } = useQuery({
    queryKey: ['hub', hubUrlToLoad],
    queryFn: async () => {
      if (!hubUrlToLoad) return null;
      
      const response = await fetch(`${APP_CONFIG.CORS_PROXY_URL}${encodeURIComponent(hubUrlToLoad)}`);
      if (!response.ok) {
        throw new Error(`${APP_CONFIG.ERROR_MESSAGES.HUB_LOAD_FAILED}. Status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    },
    enabled: !!hubUrlToLoad,
    retry: 2, // Retry failed requests
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const loadHub = useCallback((url) => {
    setLastAttemptedUrl(url);
    setHubUrlToLoad(url);
  }, []);

  const clearHub = useCallback(() => {
    setHubUrlToLoad(null);
    setLastAttemptedUrl('');
  }, []);

  const contextValue = useMemo(() => ({
    currentHubData,
    hubLoading,
    hubError: hubError ? hubError.message : null,
    lastAttemptedUrl,
    loadHub,
    clearHub,
    refetchHub
  }), [currentHubData, hubLoading, hubError, lastAttemptedUrl, loadHub, clearHub, refetchHub]);

  return (
    <HubContext.Provider value={contextValue}>
      {children}
    </HubContext.Provider>
  );
};
