import { useEffect, useRef } from 'react';
import Widget from 'remotestorage-widget';
import { remoteStorage } from '../../services/remotestorage';

const TestWidget = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        console.log('TestWidget montado');
        
        if (containerRef.current) {
            console.log('Container encontrado:', containerRef.current);
            
            try {
                const widget = new Widget(remoteStorage);
                console.log('Widget criado:', widget);
                
                widget.attach(containerRef.current);
                console.log('Widget anexado');
                
                setTimeout(() => {
                    console.log('Container HTML:', containerRef.current.innerHTML);
                    const widgetEl = containerRef.current.querySelector('.rs-widget');
                    console.log('Widget element:', widgetEl);
                }, 1000);
                
            } catch (error) {
                console.error('Erro no TestWidget:', error);
            }
        }
    }, []);

    return (
        <div 
            ref={containerRef}
            style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                zIndex: 10000,
                background: 'rgba(0, 255, 0, 0.3)',
                minWidth: '100px',
                minHeight: '100px',
                border: '2px solid green'
            }}
        >
            <div>TEST WIDGET</div>
        </div>
    );
};

export default TestWidget;
