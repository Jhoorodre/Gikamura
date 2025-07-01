import { useEffect, useRef } from 'react';
import { remoteStorage } from '../../services/remotestorage';

const SimpleRemoteStorageWidget = () => {
    const containerRef = useRef(null);
    const widgetRef = useRef(null);

    useEffect(() => {
        const initWidget = async () => {
            try {
                console.log('Tentando inicializar widget...');
                console.log('RemoteStorage:', remoteStorage);
                console.log('Container:', containerRef.current);

                // Aguardar que o RemoteStorage esteja pronto
                if (!remoteStorage.remote) {
                    console.log('RemoteStorage não está pronto, aguardando...');
                    await new Promise((resolve) => {
                        remoteStorage.on('ready', () => {
                            console.log('RemoteStorage está pronto!');
                            resolve();
                        });
                    });
                }

                // Tentar importar o widget
                console.log('Importando widget...');
                const widgetModule = await import('remotestorage-widget');
                console.log('Widget module:', widgetModule);
                
                const Widget = widgetModule.default || widgetModule;
                console.log('Widget constructor:', Widget);

                if (!containerRef.current) {
                    console.error('Container não encontrado');
                    return;
                }

                if (widgetRef.current) {
                    console.log('Widget já existe, pulando inicialização');
                    return;
                }

                console.log('Criando widget...');
                const widget = new Widget(remoteStorage);
                console.log('Widget criado:', widget);

                console.log('Anexando widget ao container...');
                widget.attach(containerRef.current);
                widgetRef.current = widget;
                
                console.log('Widget RemoteStorage inicializado com sucesso!');
                
            } catch (error) {
                console.error('Erro detalhado ao inicializar widget:', error);
                console.error('Stack:', error.stack);
            }
        };

        // Aguardar um pouco para garantir que o DOM esteja pronto
        const timer = setTimeout(initWidget, 200);
        
        return () => {
            clearTimeout(timer);
            if (widgetRef.current) {
                try {
                    widgetRef.current.destroy?.();
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
            id="simple-rs-widget"
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                zIndex: 10000,
                minWidth: '60px',
                minHeight: '60px',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                border: '2px solid red',
                borderRadius: '8px'
            }}
            title="Simple RemoteStorage Widget"
        >
            <div style={{ fontSize: '10px', color: 'red', padding: '2px' }}>
                RS Widget
            </div>
        </div>
    );
};

export default SimpleRemoteStorageWidget;
