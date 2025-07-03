/**
 * Hook para carregamento e gerenciamento do hub
 * AIDEV-NOTE: Centralized hub loading with state management and navigation
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { encodeUrl } from '../utils/encoding';
import { useAppContext } from '../context/AppContext';
import { useRemoteStorageContext } from '../context/RemoteStorageContext';

export const useHubLoader = (defaultUrl = "") => {
    const [url, setUrl] = useState(defaultUrl);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { loadHub: loadHubInContext, currentHubData, hubLoading } = useAppContext();
    const { isConnected } = useRemoteStorageContext() || { isConnected: false };

    // AIDEV-NOTE: Syncs loading state with context when not connected
    useEffect(() => {
        if (!isConnected && hubLoading !== undefined) {
            setLoading(hubLoading);
        }
    }, [hubLoading, isConnected]);

    // AIDEV-NOTE: Debug monitoring for state changes (dev only)
    useEffect(() => {
        console.log('🎯 [useHubLoader] Estado atual:', {
            isConnected,
            currentHubData: !!currentHubData,
            hubLoading,
            hubTitle: currentHubData?.hub?.title,
            loading
        });
    }, [isConnected, currentHubData, hubLoading, loading]);

    // AIDEV-NOTE: Main hub loading logic with different strategies for connected/disconnected modes
    const loadHub = useCallback(async (hubUrl = url) => {
        const targetUrl = (hubUrl || url).trim();
        
        console.log('🚀 [useHubLoader] loadHub iniciado');
        console.log('🔍 [useHubLoader] Parâmetros:', { 
            hubUrl,
            url, 
            targetUrl,
            isConnected,
            currentHubData: !!currentHubData,
            hubLoading,
            loadHubInContext: typeof loadHubInContext
        });
        
        if (!targetUrl) {
            console.log('❌ [useHubLoader] URL vazia ou inválida');
            setError('URL é obrigatória');
            setLoading(false);
            return false;
        }

        setError('');
        setLoading(true);
        console.log('⏳ [useHubLoader] Loading iniciado...');

        try {
            console.log('🚀 [useHubLoader] Carregando hub:', targetUrl);
            
            // AIDEV-NOTE: Different strategies based on RemoteStorage connection
            if (!isConnected) {
                console.log('🔄 [useHubLoader] Modo sem Remote Storage - carregando diretamente');
                
                // AIDEV-NOTE: Direct loading through context without storage
                await loadHubInContext(targetUrl);
                console.log('✅ [useHubLoader] loadHubInContext concluído');
                
                // AIDEV-NOTE: Immediate redirect after successful loading
                console.log('✅ [useHubLoader] Hub carregado com sucesso, redirecionando...');
                const encodedUrl = btoa(encodeURIComponent(targetUrl));
                console.log('🎯 [useHubLoader] Redirecionando para:', `/hub/${encodedUrl}`);
                navigate(`/hub/${encodedUrl}`);
                
                setLoading(false);
                return true;
            } else {
                // AIDEV-NOTE: Connected mode - navigate to hub route
                console.log('🔄 [useHubLoader] Modo com Remote Storage - navegando para rota');
                const encodedHubUrl = encodeUrl(targetUrl);
                console.log('🎯 [useHubLoader] Navegando para:', `/hub/${encodedHubUrl}`);
                navigate(`/hub/${encodedHubUrl}`);
                setLoading(false);
                return true;
            }
        } catch (error) {
            console.error("❌ [useHubLoader] Falha ao carregar hub:", error);
            console.error("❌ [useHubLoader] Stack trace:", error.stack);
            setError(`Erro ao carregar hub: ${error.message}`);
            setLoading(false);
            return false;
        }
    }, [url, navigate, isConnected, loadHubInContext, currentHubData, hubLoading]);

    // AIDEV-NOTE: Form submission handler with validation
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        console.log('🎯 [useHubLoader] handleSubmit chamado, URL:', url);
        console.log('🎯 [useHubLoader] isConnected:', isConnected);
        return loadHub();
    }, [loadHub, url, isConnected]);

    const resetError = useCallback(() => {
        setError('');
    }, []);

    return {
        url,
        setUrl,
        loading,
        error,
        loadHub,
        handleSubmit,
        resetError
    };
};
