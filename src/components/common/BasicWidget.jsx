import { useEffect, useRef } from 'react';
import Widget from 'remotestorage-widget';
import { remoteStorage } from '../../services/remotestorage';

const BasicWidget = () => {
    const containerRef = useRef(null);
    const widgetRef = useRef(null);

    useEffect(() => {
        console.log('=== BASIC WIDGET INIT ===');
        
        const initWidget = () => {
            try {
                console.log('1. Container:', containerRef.current);
                console.log('2. RemoteStorage:', remoteStorage);
                console.log('3. Widget constructor:', Widget);
                
                if (!containerRef.current) {
                    console.error('4. Container não encontrado!');
                    return;
                }
                
                if (widgetRef.current) {
                    console.log('4. Widget já existe');
                    return;
                }
                
                console.log('4. Criando widget...');
                const widget = new Widget(remoteStorage);
                console.log('5. Widget criado:', widget);
                
                console.log('6. Anexando widget...');
                widget.attach(containerRef.current);
                widgetRef.current = widget;
                console.log('7. Widget anexado!');
                
                // Verificar depois de um tempo
                setTimeout(() => {
                    const widgetEl = containerRef.current.querySelector('.rs-widget');
                    console.log('8. Widget element:', widgetEl);
                    if (widgetEl) {
                        console.log('9. Widget HTML:', widgetEl.outerHTML.substring(0, 200) + '...');
                    }
                }, 500);
                
            } catch (error) {
                console.error('Erro basic widget:', error);
            }
        };
        
        // Aguardar um pouco para DOM estar pronto
        const timer = setTimeout(initWidget, 100);
        
        return () => {
            clearTimeout(timer);
            if (widgetRef.current) {
                try {
                    widgetRef.current.destroy?.();
                } catch (e) {
                    console.warn('Erro ao destruir:', e);
                }
                widgetRef.current = null;
            }
        };
    }, []);

    return (
        <div 
            ref={containerRef}
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '20px',
                zIndex: 9999,
                minWidth: '60px',
                minHeight: '60px',
                backgroundColor: 'rgba(0, 0, 255, 0.1)',
                border: '2px solid blue',
                borderRadius: '12px',
                padding: '5px'
            }}
            title="Basic Widget"
        >
            <div style={{ fontSize: '10px', color: 'blue' }}>BASIC</div>
        </div>
    );
};

export default BasicWidget;
