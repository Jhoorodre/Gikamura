import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { remoteStorage } from '../../services/remotestorage';
import { useAppContext } from '../../context/AppContext';

const SimpleRemoteStorageWidgetNew = () => {
    const location = useLocation();
    const { forceRefreshPinnedWorks } = useAppContext();
    const [connected, setConnected] = useState(false);
    const [address, setAddress] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [showConnectedMessage, setShowConnectedMessage] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);

    // AIDEV-NOTE: All hooks must be called before any conditional returns
    // Use effect to ensure route checking happens after navigation
    useEffect(() => {
        const isReadingPage = location.pathname.includes('/read/') || 
                             location.pathname.includes('/manga/') || 
                             location.pathname.includes('/series/');
        
        if (isReadingPage) {
            console.log('🔍 [RemoteStorageWidget] Hiding widget for reading page:', location.pathname);
            setShouldRender(false);
        } else {
            setShouldRender(true);
        }
    }, [location.pathname]);

    useEffect(() => {
        const updateState = () => {
            const wasConnected = connected;
            const isNowConnected = remoteStorage.connected;
            setConnected(isNowConnected);
            
            // AIDEV-NOTE: Show temporary "Connected" message for 5 seconds when connecting
            if (!wasConnected && isNowConnected) {
                setShowConnectedMessage(true);
                setTimeout(() => {
                    setShowConnectedMessage(false);
                }, 5000);
                
                // AIDEV-NOTE: CRITICAL - Force load pinned works immediately after connection for 100% reliability
                setTimeout(() => {
                    if (forceRefreshPinnedWorks) {
                        forceRefreshPinnedWorks();
                    }
                }, 2000); // 2 second delay to ensure RemoteStorage is fully ready
            }
        };

        // Listener para mudanças de conexão
        remoteStorage.on('connected', updateState);
        remoteStorage.on('disconnected', updateState);
        remoteStorage.on('error', (err) => {
            setError(err.message || 'Erro de conexão');
            setTimeout(() => setError(''), 5000);
        });

        // Estado inicial
        updateState();

        return () => {
            remoteStorage.removeEventListener('connected', updateState);
            remoteStorage.removeEventListener('disconnected', updateState);
        };
    }, [connected, forceRefreshPinnedWorks]);

    // AIDEV-NOTE: Early return AFTER all hooks have been called
    if (!shouldRender) {
        return null;
    }

    const handleConnect = async (e) => {
        e.preventDefault();
        if (!address.trim()) return;

        try {
            setError('');
            console.log('Tentando conectar ao:', address);
            
            // Conectar ao RemoteStorage
            await remoteStorage.connect(address.trim());
            
            setShowForm(false);
            setAddress('');
        } catch (err) {
            console.error('Erro ao conectar:', err);
            setError(err.message || 'Erro ao conectar');
        }
    };

    const handleDisconnect = () => {
        remoteStorage.disconnect();
        setShowForm(false);
        setAddress('');
        setError('');
    };

    // Estado conectado - mostrar indicador verde discreto
    if (connected) {
        return (
            <>
                {/* AIDEV-NOTE: Temporary "Connected" message for 5 seconds */}
                {showConnectedMessage && (
                    <div 
                        style={{
                            position: 'fixed',
                            bottom: '90px',
                            left: '20px',
                            zIndex: 10000,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            animation: 'fadeIn 0.3s ease'
                        }}
                    >
                        ✅ Remote Storage Conectado
                    </div>
                )}
                
                <div 
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '20px',
                        zIndex: 9999,
                    }}
                >
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={handleDisconnect}
                        title="Conectado ao RemoteStorage - Clique para desconectar"
                    >
                        ✓
                    </div>
                </div>
            </>
        );
    }

    // Estado desconectado - mostrar widget de conexão
    return (
        <div 
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                zIndex: 9999,
            }}
        >
            {!showForm ? (
                // Botão para abrir formulário
                <div
                    style={{
                        width: '56px',
                        height: '56px',
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
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        animation: 'pulse 2s infinite',
                        transition: 'all 0.3s ease'
                    }}
                    onClick={() => setShowForm(true)}
                    title="Conectar ao RemoteStorage"
                >
                    <svg 
                        width="28" 
                        height="28" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                    >
                        {/* Servidor/Database */}
                        <rect 
                            x="3" 
                            y="4" 
                            width="18" 
                            height="3" 
                            rx="1.5" 
                            fill="currentColor"
                            opacity="0.9"
                        />
                        <rect 
                            x="3" 
                            y="8.5" 
                            width="18" 
                            height="3" 
                            rx="1.5" 
                            fill="currentColor"
                            opacity="0.7"
                        />
                        <rect 
                            x="3" 
                            y="13" 
                            width="18" 
                            height="3" 
                            rx="1.5" 
                            fill="currentColor"
                            opacity="0.5"
                        />
                        {/* Sinal de conexão */}
                        <circle 
                            cx="18" 
                            cy="18" 
                            r="1.5" 
                            fill="currentColor"
                            opacity="0.9"
                        />
                        <circle 
                            cx="18" 
                            cy="18" 
                            r="2.5" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            fill="none"
                            opacity="0.6"
                        />
                        <circle 
                            cx="18" 
                            cy="18" 
                            r="4" 
                            stroke="currentColor" 
                            strokeWidth="1" 
                            fill="none"
                            opacity="0.3"
                        />
                    </svg>
                </div>
            ) : (
                // Formulário de conexão
                <div
                    style={{
                        background: 'rgba(17, 24, 39, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(75, 85, 99, 0.3)',
                        borderRadius: '12px',
                        padding: '20px',
                        minWidth: '280px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                        color: 'white',
                        fontSize: '14px'
                    }}
                >
                    <div style={{ marginBottom: '15px' }}>
                        <h3 style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: '16px', 
                            fontWeight: 'bold',
                            color: '#a78bfa'
                        }}>
                            Remote Storage
                        </h3>
                        <p style={{ margin: '0', color: '#9ca3af', fontSize: '12px' }}>
                            Digite seu endereço RemoteStorage
                        </p>
                    </div>

                    <form onSubmit={handleConnect}>
                        <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="user@provider.com"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid rgba(75, 85, 99, 0.5)',
                                borderRadius: '6px',
                                background: 'rgba(31, 41, 55, 0.8)',
                                color: 'white',
                                fontSize: '14px',
                                marginBottom: '12px',
                                boxSizing: 'border-box'
                            }}
                            autoFocus
                        />

                        {error && (
                            <div style={{
                                color: '#fca5a5',
                                fontSize: '12px',
                                marginBottom: '12px',
                                padding: '8px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '4px'
                            }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="submit"
                                disabled={!address.trim()}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: address.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#374151',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: address.trim() ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Conectar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setAddress('');
                                    setError('');
                                }}
                                style={{
                                    padding: '10px 16px',
                                    background: 'transparent',
                                    color: '#9ca3af',
                                    border: '1px solid rgba(75, 85, 99, 0.5)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
};

export default SimpleRemoteStorageWidgetNew;
