import React from 'react';

const ErrorMessage = ({ message, onRetry }) => (
    <div className="min-h-screen flex items-center justify-center p-4">
        <div className="panel-dark border border-red-500/30 text-red-300 px-6 py-4 rounded-2xl relative fade-in text-center" role="alert">
            <div className="flex items-center justify-center mb-4">
                <svg className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <strong className="font-bold">Erro: </strong>
            </div>
            <span>{message}</span>
            {onRetry && <button onClick={onRetry} className="mt-4 bg-red-800/50 text-white px-6 py-2 rounded-xl">Tentar Novamente</button>}
        </div>
    </div>
);

export default ErrorMessage;
