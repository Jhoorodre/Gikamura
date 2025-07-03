/**
 * App Configuration Constants
 * AIDEV-NOTE: Centralizes all app-wide config and UI constants
 */
export const APP_CONFIG = {
  // URLs e proxies - CORS proxy removido para requests diretos
  // AIDEV-TODO: If CORS issues arise, consider re-adding a proxy URL
  // CORS_PROXY_URL: 'https://api.allorigins.win/get?url=',
  DEFAULT_HUB_URL: 'https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/refs/heads/main/hub_tog.json',
  
  // Timeouts e delays
  SAVE_PROGRESS_DELAY: 1000,
  CONTROLS_TIMEOUT: 3000,
  CONFLICT_MESSAGE_TIMEOUT: 8000,
  
  // Limits
  MAX_HISTORY_ITEMS: 20,
  CHUNK_SIZE_WARNING_LIMIT: 1000,
  
  // Remote Storage
  RS_PATH: 'gikamoe',
  
  // Mensagens de erro
  ERROR_MESSAGES: {
    HUB_LOAD_FAILED: 'Erro ao carregar o hub', // AIDEV-NOTE: Used for hub fetch failures
    ITEM_LOAD_FAILED: 'Erro ao carregar item',
    NO_PAGES: 'Capítulo sem páginas ou com dados inválidos',
    NETWORK_ERROR: 'Erro de rede. Verifique sua conexão',
    INVALID_DATA: 'Dados inválidos recebidos'
  },
  
  // UI Constants
  SKELETON_COUNT: 8,
  INTERSECTION_ROOT_MARGIN: '100px 0px',
  
  // Reading modes
  READING_MODES: {
    PAGINATED: 'paginated',
    SCROLLING: 'scrolling'
  }
}

// Constantes de otimização de performance
// AIDEV-NOTE: Used for debounce/throttle and virtualization tuning
export const PERFORMANCE = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  IMAGE_LAZY_LOAD: true,
  VIRTUALIZATION_THRESHOLD: 100
}

// Breakpoints para design responsivo
// AIDEV-NOTE: Used for responsive UI breakpoints
export const BREAKPOINTS = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1280px'
}
