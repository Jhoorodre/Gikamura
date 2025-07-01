import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { remoteStorage } from '../../services/remotestorage';

const GlobalRemoteStorageWidget = () => {
    const containerRef = useRef(null);
    const widgetRef = useRef(null);
    const [status, setStatus] = useState('loading');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        let mounted = true;
        let retryCount = 0;
        const MAX_RETRIES = 10;

        const initWidget = async () => {
            if (!mounted) return;
            
            try {
                setStatus('loading');
                
                // Verificar se o container existe E se está no DOM
                if (!containerRef.current || !document.contains(containerRef.current)) {
                    retryCount++;
                    if (retryCount < MAX_RETRIES) {
                        console.warn(`Container não encontrado ou não está no DOM, tentativa ${retryCount}/${MAX_RETRIES}`);
                        setTimeout(initWidget, 300); // Aumentei o tempo entre tentativas
                        return;
                    } else {
                        throw new Error('Container não encontrado após várias tentativas');
                    }
                }
                
                // Verificar se já existe um widget
                if (widgetRef.current) {
                    console.log('Widget já existe, pulando inicialização');
                    setStatus('ready');
                    return;
                }

                console.log('Inicializando RemoteStorage Widget...');
                console.log('Container encontrado:', containerRef.current);
                console.log('Container no DOM:', document.contains(containerRef.current));
                
                // Aguardar RemoteStorage estar pronto - com timeout
                await new Promise((resolve, reject) => {
                    let timeoutId;
                    
                    const checkReady = () => {
                        if (!mounted) {
                            reject(new Error('Componente desmontado'));
                            return;
                        }
                        
                        if (remoteStorage && (remoteStorage.remote || remoteStorage.connected || remoteStorage.access)) {
                            clearTimeout(timeoutId);
                            resolve();
                        } else {
                            setTimeout(checkReady, 100);
                        }
                    };
                    
                    // Timeout de 5 segundos
                    timeoutId = setTimeout(() => {
                        reject(new Error('Timeout ao aguardar RemoteStorage'));
                    }, 5000);
                    
                    checkReady();
                });
                
                if (!mounted) return;
                
                // Tentar importar e inicializar o widget de forma robusta
                console.log('Importando widget do RemoteStorage...');
                
                let Widget;
                try {
                    const widgetModule = await import('remotestorage-widget');
                    Widget = widgetModule.default || widgetModule.Widget;
                } catch (importError) {
                    console.error('Erro ao importar widget:', importError);
                    throw new Error('Falha ao importar remotestorage-widget');
                }
                
                if (!Widget) {
                    throw new Error('Widget class não encontrada');
                }
                
                if (!mounted || !containerRef.current || !document.contains(containerRef.current)) {
                    throw new Error('Container removido durante inicialização');
                }
                
                // Limpar container e preparar para o widget
                const container = containerRef.current;
                container.innerHTML = '';
                
                console.log('Criando nova instância do Widget...');
                console.log('Container info:', {
                    tagName: container.tagName,
                    id: container.id,
                    isConnected: container.isConnected,
                    parentNode: !!container.parentNode
                });
                
                const widget = new Widget(remoteStorage);
                
                console.log('Anexando widget ao container...');
                
                // Tentar anexar com tratamento de erro mais específico
                try {
                    widget.attach(container);
                } catch (attachError) {
                    console.error('Erro no attach:', attachError);
                    console.log('Tentando método alternativo...');
                    
                    // Método alternativo: verificar se o widget tem um elemento DOM
                    if (widget.view || widget.element || widget.domNode) {
                        const widgetElement = widget.view || widget.element || widget.domNode;
                        container.appendChild(widgetElement);
                    } else {
                        throw new Error('Widget não possui elemento DOM válido');
                    }
                }
                
                widgetRef.current = widget;
                
                console.log('Widget RemoteStorage inicializado com sucesso!');
                console.log('Widget instance:', widget);
                
                if (mounted) {
                    setStatus('ready');
                }
                
            } catch (error) {
                console.error('Erro ao inicializar RemoteStorage Widget:', error);
                if (mounted) {
                    setStatus('error');
                }
            }
        };

        // Aguardar mais tempo para o DOM estar pronto
        const timer = setTimeout(initWidget, 1000); // Aumentei para 1 segundo

        // Listener para mudanças de conexão
        const handleConnectionChange = () => {
            if (mounted) {
                setIsConnected(remoteStorage?.connected || false);
            }
        };

        if (remoteStorage) {
            remoteStorage.on('connected', handleConnectionChange);
            remoteStorage.on('disconnected', handleConnectionChange);
        }
        
        return () => {
            mounted = false;
            clearTimeout(timer);
            
            if (remoteStorage) {
                remoteStorage.removeEventListener('connected', handleConnectionChange);
                remoteStorage.removeEventListener('disconnected', handleConnectionChange);
            }
            
            if (widgetRef.current) {
                try {
                    if (typeof widgetRef.current.destroy === 'function') {
                        widgetRef.current.destroy();
                    }
                } catch (e) {
                    console.warn('Erro ao destruir widget:', e);
                }
                widgetRef.current = null;
            }
        };
    }, []);

    return (
        <div 
            ref={containerRef}
            id="rs-widget-global"
            className="rs-widget-global-container"
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                zIndex: 9999,
                minWidth: '70px',
                minHeight: '70px',
                fontSize: '14px'
            }}
            role="complementary"
            aria-label="RemoteStorage Connection Widget"
        >
            {status === 'loading' && (
                <div 
                    className="rs-widget-loading-state"
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        animation: 'pulse 2s infinite'
                    }}
                    title="Conectando ao RemoteStorage..."
                >
                    ☁
                </div>
            )}
            {status === 'error' && (
                <div 
                    className="rs-widget-error-state"
                    style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        textAlign: 'center',
                        cursor: 'pointer'
                    }}
                    title="Erro ao carregar RemoteStorage"
                    onClick={() => window.location.reload()}
                >
                    !
                </div>
            )}
            {/* O widget oficial será anexado aqui quando status === 'ready' */}
        </div>
    );
};

export default GlobalRemoteStorageWidget;
