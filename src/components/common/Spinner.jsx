import React from 'react';

const Spinner = ({ size = 'md', text = 'Carregando...' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10', 
        lg: 'w-16 h-16'
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`loading-spinner ${sizeClasses[size]}`}></div>
            {text && (
                <p className="text-sm text-slate-400 font-medium">{text}</p>
            )}
        </div>
    );
};

export default Spinner;
