import React, { forwardRef } from 'react';

// O componente principal agora é renomeado para Panel e usa forwardRef para flexibilidade.
const Panel = forwardRef(({ children, className = '', solid = true, ...props }, ref) => {
    const panelClass = solid ? 'panel-solid' : 'panel-dark';
    return (
        <div ref={ref} className={`${panelClass} rounded-2xl p-6 ${className}`} {...props}>
            {children}
        </div>
    );
});

// Sub-componente para o cabeçalho do painel.
const Header = ({ children, className = '', ...props }) => (
    <div className={`flex justify-between items-center mb-4 ${className}`} {...props}>
        {children}
    </div>
);

// Sub-componente para o corpo do painel.
const Body = ({ children, className = '', ...props }) => (
    <div className={`${className}`} {...props}>
        {children}
    </div>
);

// Anexa os sub-componentes como propriedades do componente principal.
Panel.Header = Header;
Panel.Body = Body;

export default Panel;
