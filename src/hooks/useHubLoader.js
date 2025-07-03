/**
 * Hook para carregamento e gerenciamento do hub
 * AIDEV-NOTE: Loads and manages hub data and state
 * Centraliza a lógica de carregamento de JSON em um local
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

    // useEffect para sincronizar loading com o estado do contexto
    useEffect(() => {
        if (!isConnected && hubLoading !== undefined) {
            setLoading(hubLoading);
        }
    }, [hubLoading, isConnected]);

    // Monitora mudanças no estado para logs de debug
    useEffect(() => {
        console.log('🎯 [useHubLoader] Estado atual:', {
            isConnected,
            currentHubData: !!currentHubData,
            hubLoading,
            hubTitle: currentHubData?.hub?.title,
            loading
        });
    }, [isConnected, currentHubData, hubLoading, loading]);

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
            
            // Se não conectado ao Remote Storage, carrega diretamente no contexto
            if (!isConnected) {
                console.log('🔄 [useHubLoader] Modo sem Remote Storage - carregando diretamente');
                
                // Chama loadHubInContext que carrega o hub
                await loadHubInContext(targetUrl);
                console.log('✅ [useHubLoader] loadHubInContext concluído');
                
                // Após carregamento bem-sucedido, redirecionar imediatamente
                console.log('✅ [useHubLoader] Hub carregado com sucesso, redirecionando...');
                const encodedUrl = btoa(encodeURIComponent(targetUrl));
                console.log('🎯 [useHubLoader] Redirecionando para:', `/hub/${encodedUrl}`);
                navigate(`/hub/${encodedUrl}`);
                
                setLoading(false);
                return true;
            } else {
                // Se conectado, navega para a rota do hub
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
