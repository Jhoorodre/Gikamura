import { useState, useEffect, useCallback } from 'react';
import { clearNetworkCache } from '../services/networkService.js';

/**
 * Hook para monitoramento da qualidade de rede e recuperação de falhas
 */
export const useNetworkMonitor = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
    const [networkQuality, setNetworkQuality] = useState('unknown'); // fast, slow, offline, unknown
    const [connectionType, setConnectionType] = useState('unknown');
    const [retryCount, setRetryCount] = useState(0);

    // Detecta tipo de conexão se suportado
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

    // Monitora status online/offline
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setLastOnlineTime(Date.now());
            setRetryCount(0);
            
            // Limpa cache quando volta online para forçar dados frescos
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

    // Testa qualidade da rede periodicamente
    const testNetworkQuality = useCallback(async () => {
        if (!isOnline) {
            setNetworkQuality('offline');
            return 'offline';
        }

        try {
            const startTime = Date.now();
            
            // Testa com uma URL pequena e rápida
            const response = await fetch('https://httpbin.org/uuid', {
                method: 'GET',
                cache: 'no-cache'
            });
            
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
                return quality;
            } else {
                setNetworkQuality('slow');
                return 'slow';
            }
        } catch (error) {
            console.warn('[NetworkMonitor] Erro ao testar qualidade da rede:', error);
            setNetworkQuality('slow');
            return 'slow';
        }
    }, [isOnline]);

    // Executa teste de qualidade quando voltar online
    useEffect(() => {
        if (isOnline && networkQuality === 'offline') {
            // Aguarda um pouco para a conexão estabilizar
            const timer = setTimeout(testNetworkQuality, 2000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, networkQuality, testNetworkQuality]);

    // Função para incrementar contador de retry
    const incrementRetry = useCallback(() => {
        setRetryCount(prev => prev + 1);
    }, []);

    // Função para resetar contador de retry
    const resetRetry = useCallback(() => {
        setRetryCount(0);
    }, []);

    // Calcula se está em modo de recuperação
    const isRecovering = isOnline && (Date.now() - lastOnlineTime) < 30000; // 30 segundos

    // Sugere estratégia baseada na qualidade da rede
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
                    cacheDuration: 2 * 60 * 1000, // 2 minutos
                    timeout: 10000,
                    retryCount: 2,
                    description: 'Conexão rápida - dados frescos'
                };
            case 'medium':
                return {
                    strategy: 'medium',
                    cacheDuration: 5 * 60 * 1000, // 5 minutos
                    timeout: 15000,
                    retryCount: 3,
                    description: 'Conexão média - cache moderado'
                };
            case 'slow':
                return {
                    strategy: 'slow',
                    cacheDuration: 10 * 60 * 1000, // 10 minutos
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
 * Hook para exibir notificações de rede
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

    useEffect(() => {
        if (isRecovering) {
            setShowRecoveringMessage(true);
            const timer = setTimeout(() => {
                setShowRecoveringMessage(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isRecovering]);

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
                message: 'Conectividade restaurada. Sincronizando dados...',
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
