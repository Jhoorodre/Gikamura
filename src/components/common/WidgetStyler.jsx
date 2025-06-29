// src/components/common/WidgetStyler.jsx
import React, { useEffect } from 'react';

// Este componente injeta os estilos do widget diretamente no <head> do documento.
const WidgetStyler = () => {
    useEffect(() => {
        const styleId = 'remotestorage-widget-styles-override';

        // Evita adicionar a tag de estilo múltiplas vezes
        if (document.getElementById(styleId)) {
            return;
        }

        const styleElement = document.createElement('style');
        styleElement.id = styleId;

        // Aqui colocamos o CSS que força o widget a se comportar como um modal.
        // As cores foram extraídas do seu arquivo tokens.css para simplificar.
        styleElement.innerHTML = `
            #remotestorage-widget {
              /* Força o widget a se tornar um modal fixo no centro da tela */
              position: fixed !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              z-index: 1050 !important;

              /* Estilos visuais do modal */
              width: 90vw !important;
              max-width: 420px !important;
              background: #1f1f1f !important; /* Cor de --color-surface */
              border: 1px solid #4a4a4a !important; /* Cor de --color-border */
              border-radius: 0.75rem !important; /* Medida de --radius-xl */
              padding: 2rem !important; /* Medida de --space-8 */
              box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.4) !important;
              animation: modalFadeIn 0.3s ease-out forwards !important;
              
              /* Garante que o conteúdo interno não seja o pop-up pequeno */
              height: auto !important;
              margin: 0 !important;
            }

            /* Cria o fundo escuro (backdrop) */
            #remotestorage-widget::before {
              content: '' !important;
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              width: 100vw !important;
              height: 100vh !important;
              background: rgba(0, 0, 0, 0.7) !important;
              z-index: -1 !important;
            }
            
            /* Esconde elementos padrão e indesejados do widget */
            #remotestorage-widget .rs-bubble,
            #remotestorage-widget .rs-cube,
            #remotestorage-widget .rs-logo,
            #remotestorage-widget .rs-powered-by {
              display: none !important;
            }

            @keyframes modalFadeIn {
              from { opacity: 0; transform: translate(-50%, -48%) scale(0.98); }
              to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;

        document.head.appendChild(styleElement);

        // Função de limpeza para remover os estilos quando o componente for desmontado
        return () => {
            const style = document.getElementById(styleId);
            if (style) {
                style.remove();
            }
        };
    }, []);

    return null; // O componente em si não renderiza nada na tela
};

export default WidgetStyler;
