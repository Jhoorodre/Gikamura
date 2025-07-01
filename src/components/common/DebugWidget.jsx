import { useEffect, useRef } from 'react';

const DebugWidget = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        const testWidget = async () => {
            console.log('=== DEBUG WIDGET ===');
            
            try {
                // Testar se o RemoteStorage está disponível
                const { remoteStorage } = await import('../../services/remotestorage');
                console.log('1. RemoteStorage importado:', remoteStorage);
                console.log('2. RemoteStorage conectado:', remoteStorage.connected);
                console.log('3. RemoteStorage backend:', remoteStorage.backend);
                
                // Testar se o widget pode ser importado
                console.log('4. Tentando importar widget...');
                const widgetModule = await import('remotestorage-widget');
                console.log('5. Widget module:', widgetModule);
                
                const Widget = widgetModule.default || widgetModule;
                console.log('6. Widget constructor:', Widget);
                
                // Testar se o widget pode ser criado
                console.log('7. Tentando criar widget...');
                const widget = new Widget(remoteStorage);
                console.log('8. Widget criado:', widget);
                
                // Testar se o widget pode ser anexado
                if (containerRef.current) {
                    console.log('9. Tentando anexar widget...');
                    widget.attach(containerRef.current);
                    console.log('10. Widget anexado com sucesso!');
                    
                    // Verificar se o widget foi realmente anexado
                    setTimeout(() => {
                        const widgetElement = containerRef.current.querySelector('.rs-widget');
                        console.log('11. Widget element encontrado:', widgetElement);
                        if (widgetElement) {
                            console.log('12. Widget HTML:', widgetElement.outerHTML);
                        } else {
                            console.log('12. Widget element NÃO encontrado!');
                        }
                    }, 1000);
                } else {
                    console.error('9. Container não encontrado!');
                }
                
            } catch (error) {
                console.error('Erro no debug widget:', error);
                console.error('Stack trace:', error.stack);
            }
        };

        testWidget();
    }, []);

    return (
        <div 
            ref={containerRef}
            style={{
                position: 'fixed',
                bottom: '80px',
                right: '20px',
                zIndex: 10001,
                minWidth: '200px',
                minHeight: '100px',
                backgroundColor: 'rgba(0, 255, 0, 0.2)',
                border: '2px solid green',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px'
            }}
        >
            <div>DEBUG WIDGET</div>
            <div>Verifique o console para logs</div>
        </div>
    );
};

export default DebugWidget;
