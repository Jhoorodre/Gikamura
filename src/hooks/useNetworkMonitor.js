// AIDEV-NOTE: Network quality monitoring with recovery logic and user notifications
import { useState, useEffect, useCallback, useRef } from 'react';
import { clearNetworkCache, cancellableFetch } from '../services/networkService.js';

/**
 * Hook para monitoramento da qualidade de rede e recuperação de falhas
 * AIDEV-NOTE: Monitors network status, quality and triggers recovery logic
 */
export const useNetworkMonitor = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
    const [networkQuality, setNetworkQuality] = useState('unknown'); // AIDEV-NOTE: fast, slow, offline, unknown
    const [connectionType, setConnectionType] = useState('unknown');
    const [retryCount, setRetryCount] = useState(0);
    
    // AIDEV-NOTE: Track pending network test to allow cancellation
    const currentTestRef = useRef(null);

    // AIDEV-NOTE: Detects connection type if browser supports it
    useEffect(() => {
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (connection) {
                setConnectionType(connection.effectiveType || 'unknown');
                
                const updateConnection = () => {
                    setConnectionType(connection.effectiveType || 'unknown');
                };
                
                connection.addEventListener('change', updateConnection);
                return () => connection.removeEventListener('change', updateConnection);
            }
        }
    }, []);

    // AIDEV-NOTE: Monitors online/offline status with cache clearing on recovery
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setLastOnlineTime(Date.now());
            setRetryCount(0);
            
            // AIDEV-NOTE: Clears cache when back online to force fresh data
            setTimeout(() => {
                clearNetworkCache();
            }, 1000);
        };
        
        const handleOffline = () => {
            setIsOnline(false);
            setNetworkQuality('offline');
        };
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // AIDEV-NOTE: Tests network quality with response time measurement and cancellation support
    const testNetworkQuality = useCallback(async () => {
        if (!isOnline) {
            setNetworkQuality('offline');
            return 'offline';
        }

        // AIDEV-NOTE: Cancel previous test if still running
        if (currentTestRef.current) {
            currentTestRef.current.cancel();
        }

        try {
            const startTime = Date.now();
            
            // AIDEV-NOTE: Use cancellable fetch for proper cleanup
            const testRequest = await cancellableFetch('https://httpbin.org/uuid', {
                method: 'GET',
                cache: 'no-cache',
                timeout: 5000
            });
            
            currentTestRef.current = testRequest;
            const response = testRequest.response;
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            if (response.ok) {
                let quality;
                if (responseTime < 1000) {
                    quality = 'fast';
                } else if (responseTime < 3000) {
                    quality = 'medium';
                } else {
                    quality = 'slow';
                }
                
                setNetworkQuality(quality);
                currentTestRef.current = null; // Clear completed test
                return quality;
            } else {
                setNetworkQuality('slow');
                currentTestRef.current = null;
                return 'slow';
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn('[NetworkMonitor] Erro ao testar qualidade da rede:', error);
                setNetworkQuality('slow');
            }
            currentTestRef.current = null;
            return 'slow';
        }
    }, [isOnline]);

    // AIDEV-NOTE: Runs quality test when coming back online with delay for stabilization
    useEffect(() => {
        if (isOnline && networkQuality === 'offline') {
            const timer = setTimeout(testNetworkQuality, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, networkQuality, testNetworkQuality]);

    const incrementRetry = useCallback(() => {
        setRetryCount(prev => prev + 1);
    }, []);

    const resetRetry = useCallback(() => {
        setRetryCount(0);
    }, []);

    // AIDEV-NOTE: Considers recovering state for 30 seconds after coming online
    const isRecovering = isOnline && (Date.now() - lastOnlineTime) < 3000; // AIDEV-NOTE: Reduced from 30s to 3s

    // AIDEV-NOTE: Network strategy recommendation based on quality assessment
    const getNetworkStrategy = useCallback(() => {
        if (!isOnline) {
            return {
                strategy: 'offline',
                cacheDuration: Infinity,
                timeout: 0,
                retryCount: 0,
                description: 'Modo offline - usando apenas cache'
            };
        }

        switch (networkQuality) {
            case 'fast':
                return {
                    strategy: 'fast',
                    cacheDuration: 2 * 60 * 1000, // AIDEV-NOTE: 2 minutes cache for fast connections
                    timeout: 10000,
                    retryCount: 2,
                    description: 'Conexão rápida - dados frescos'
                };
            case 'medium':
                return {
                    strategy: 'medium',
                    cacheDuration: 5 * 60 * 1000, // AIDEV-NOTE: 5 minutes cache for medium connections
                    timeout: 15000,
                    retryCount: 3,
                    description: 'Conexão média - cache moderado'
                };
            case 'slow':
                return {
                    strategy: 'slow',
                    cacheDuration: 10 * 60 * 1000, // AIDEV-NOTE: 10 minutes cache for slow connections
                    timeout: 30000,
                    retryCount: 1,
                    description: 'Conexão lenta - cache agressivo'
                };
            default:
                return {
                    strategy: 'unknown',
                    cacheDuration: 5 * 60 * 1000,
                    timeout: 15000,
                    retryCount: 2,
                    description: 'Qualidade desconhecida - padrão'
                };
        }
    }, [isOnline, networkQuality]);

    // AIDEV-NOTE: Cleanup on unmount to cancel pending requests
    useEffect(() => {
        return () => {
            if (currentTestRef.current) {
                currentTestRef.current.cancel();
                currentTestRef.current = null;
            }
        };
    }, []);

    return {
        isOnline,
        networkQuality,
        connectionType,
        lastOnlineTime,
        retryCount,
        isRecovering,
        incrementRetry,
        resetRetry,
        testNetworkQuality,
        getNetworkStrategy: getNetworkStrategy()
    };
};

/**
 * AIDEV-NOTE: Network notifications hook with smart timing and dismissal
 */
export const useNetworkNotifications = () => {
    const { isOnline, networkQuality, isRecovering } = useNetworkMonitor();
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);
    const [showSlowConnectionMessage, setShowSlowConnectionMessage] = useState(false);
    const [showRecoveringMessage, setShowRecoveringMessage] = useState(false);

    useEffect(() => {
        setShowOfflineMessage(!isOnline);
    }, [isOnline]);

    useEffect(() => {
        setShowSlowConnectionMessage(isOnline && networkQuality === 'slow');
    }, [isOnline, networkQuality]);

    // AIDEV-NOTE: Shows recovery message for 2 seconds after reconnection (reduced)
    useEffect(() => {
        if (isRecovering) {
            setShowRecoveringMessage(true);
            const timer = setTimeout(() => {
                setShowRecoveringMessage(false);
            }, 2000); // AIDEV-NOTE: Reduced from 5s to 2s
            return () => clearTimeout(timer);
        }
    }, [isRecovering]);

    // AIDEV-NOTE: Returns appropriate message based on current network state
    const getNetworkMessage = () => {
        if (showOfflineMessage) {
            return {
                type: 'offline',
                message: 'Você está offline. Apenas conteúdo em cache estará disponível.',
                action: null
            };
        }

        if (showRecoveringMessage) {
            return {
                type: 'recovering',
                message: 'Conectividade restaurada. Carregando dados...',
                action: null
            };
        }

        if (showSlowConnectionMessage) {
            return {
                type: 'slow',
                message: 'Conexão lenta detectada. Usando cache para melhor performance.',
                action: 'Entendi'
            };
        }

        return null;
    };

    const dismissSlowMessage = () => {
        setShowSlowConnectionMessage(false);
    };

    return {
        networkMessage: getNetworkMessage(),
        dismissSlowMessage,
        hasActiveMessage: showOfflineMessage || showSlowConnectionMessage || showRecoveringMessage
    };
};
