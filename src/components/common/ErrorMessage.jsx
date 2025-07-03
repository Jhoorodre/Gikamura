// AIDEV-NOTE: Reusable error display component with retry functionality and proper UX

import Button from './Button';

const ErrorMessage = ({ message, onRetry, title = 'Ops! Algo deu errado' }) => {
    return (
        <div className="w-full max-w-md mx-auto">
            <div className="error-card space-y-4">
                {/* AIDEV-NOTE: Error icon with semantic styling */}
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-500/20 rounded-full">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                
                {/* AIDEV-NOTE: Error content with fallback for non-string messages */}
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{typeof message === 'string' ? message : 'Ocorreu um erro inesperado.'}</p>
                </div>
                
                {/* AIDEV-NOTE: Optional retry button with loading state support */}
                {onRetry && (
                    <div className="flex justify-center pt-2">
                        <Button
                            onClick={onRetry}
                            className="btn-primary inline-flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Tentar novamente</span>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ErrorMessage;
