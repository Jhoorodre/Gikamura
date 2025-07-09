/**
 * Mapeamento de erros técnicos para mensagens amigáveis
 */
export const USER_FRIENDLY_ERRORS = {
  // Erros de rede
  'Network Error': 'Sem conexão com a internet. Verifique sua rede.',
  'Failed to fetch': 'Não foi possível conectar ao servidor. Tente novamente.',
  'ERR_NETWORK': 'Problemas de conexão. Verifique sua internet.',
  'ERR_INTERNET_DISCONNECTED': 'Você está offline. Conecte-se à internet.',
  
  // Erros HTTP
  '404': 'O conteúdo que você procura não foi encontrado.',
  '403': 'Você não tem permissão para acessar este conteúdo.',
  '500': 'Erro no servidor. Tente novamente mais tarde.',
  '503': 'Serviço temporariamente indisponível.',
  
  // Erros de dados
  'Invalid data': 'Os dados estão corrompidos. Tente recarregar.',
  'Missing required fields': 'Informações incompletas. Verifique os dados.',
  'Validation failed': 'Dados inválidos. Verifique as informações.',
  
  // Erros de storage
  'QuotaExceededError': 'Espaço de armazenamento cheio. Libere espaço.',
  'NotAllowedError': 'Permissão negada para salvar dados.',
  
  // Erros genéricos
  'Unknown error': 'Algo deu errado. Tente novamente.',
  'timeout': 'A operação demorou muito. Tente novamente.',
};

/**
 * Converte erro técnico em mensagem amigável
 */
export const getFriendlyError = (error) => {
  if (!error) return 'Ocorreu um erro inesperado.';
  
  const errorString = error.toString();
  const errorMessage = error.message || errorString;
  
  // Procura por padrões conhecidos
  for (const [key, friendly] of Object.entries(USER_FRIENDLY_ERRORS)) {
    if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
      return friendly;
    }
  }
  
  // Se não encontrar, retorna mensagem genérica
  return 'Algo deu errado. Tente novamente ou contate o suporte.';
};

/**
 * Componente de erro amigável
 */
import React from 'react';

export const FriendlyError = ({ error, onRetry, className = '' }) => {
  const message = getFriendlyError(error);
  
  return (
    <div className={`friendly-error ${className}`}>
      <div className="friendly-error-icon">⚠️</div>
      <p className="friendly-error-message">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary">
          Tentar novamente
        </button>
      )}
    </div>
  );
};
