// AIDEV-NOTE: Specialized error boundary for route-level error handling
import { Component } from 'react';
import { createErrorBoundaryInfo } from '../../utils/errorHandler';

class RouteErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error with context
        const boundaryErrorInfo = createErrorBoundaryInfo(error, errorInfo);
        
        console.group('🔴 [RouteErrorBoundary] Route Error Caught');
        console.error('Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        console.error('Route:', window.location.pathname);
        console.groupEnd();
        
        this.setState({ errorInfo: boundaryErrorInfo });
        
        // Report to error tracking service if available
        if (typeof this.props.onError === 'function') {
            this.props.onError(boundaryErrorInfo);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, errorInfo: null });
        
        // If retry callback is provided, use it
        if (typeof this.props.onRetry === 'function') {
            this.props.onRetry();
        } else {
            // Default retry: reload the page
            window.location.reload();
        }
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback(this.state.errorInfo, this.handleRetry, this.handleGoHome);
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="max-w-md w-full mx-auto p-6 text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Ops! Algo deu errado
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {this.props.title || 'Esta página encontrou um erro inesperado.'}
                        </p>
                        
                        <div className="space-y-3">
                            <button
                                onClick={this.handleRetry}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                🔄 Tentar Novamente
                            </button>
                            
                            <button
                                onClick={this.handleGoHome}
                                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                                🏠 Voltar ao Início
                            </button>
                        </div>
                        
                        {import.meta.env?.DEV && this.state.errorInfo && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                    Detalhes do Erro (Dev)
                                </summary>
                                <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-40">
                                    {JSON.stringify(this.state.errorInfo, null, 2)}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default RouteErrorBoundary;