import { Component } from 'react';
import ErrorMessage from './ErrorMessage';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    // Atualiza o state para mostrar a UI de erro
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log do erro para monitoramento
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Em produção, enviaria para um serviço de monitoramento
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // sendErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset do estado de erro
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Se existe uma função de retry personalizada, chama ela
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI customizado ou padrão
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorMessage
              message={
                this.props.errorMessage || 
                'Algo deu errado. Tente recarregar a página.'
              }
              onRetry={this.handleRetry}
            />
            
            {/* Mostra detalhes do erro apenas em desenvolvimento */}
            {!isProduction && this.state.error && (
              <details className="mt-4 p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                <summary className="cursor-pointer text-red-400 hover:text-red-300">
                  Detalhes do erro (desenvolvimento)
                </summary>
                <div className="mt-2 text-sm text-red-300 font-mono">
                  <p><strong>Erro:</strong> {this.state.error.toString()}</p>
                  <p><strong>Stack:</strong></p>
                  <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
