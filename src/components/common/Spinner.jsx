import React from 'react';

const Spinner = ({ size = 'md', text = 'Carregando...' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10', 
        lg: 'w-16 h-16'
    };

    // Garante que, se um tamanho inválido for passado, ele use 'md' como padrão.
    const finalSizeClass = sizeClasses[size] || sizeClasses.md;

    return (
        <div role="status" className="flex flex-col items-center justify-center space-y-4">
            <div className={`loading-spinner ${finalSizeClass}`}></div>
            {text && (
                <p className="text-sm text-slate-400 font-medium">{text}</p>
            )}
            {/* Texto para leitores de tela, visualmente escondido */}
            <span className="sr-only">{text}</span>
        </div>
    );
};

export default Spinner;
