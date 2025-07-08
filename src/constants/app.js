/**
 * App Configuration Constants
 * AIDEV-NOTE: Centralizes all app-wide config and UI constants for maintainability
 */
export const APP_CONFIG = {
  // AIDEV-NOTE: URLs and proxies - CORS proxy removed for direct requests
  // AIDEV-TODO: If CORS issues arise, consider re-adding a proxy URL
  // AIDEV-NOTE: Empty default to prevent auto-loading any hub on startup
  DEFAULT_HUB_URL: '', // AIDEV-NOTE: Removed default URL to keep Hub Loader clean
  
  // AIDEV-NOTE: Timeouts and delays for UX optimization
  SAVE_PROGRESS_DELAY: 1000,
  CONTROLS_TIMEOUT: 3000,
  CONFLICT_MESSAGE_TIMEOUT: 8000,
  
  // AIDEV-NOTE: Data and performance limits
  MAX_HISTORY_ITEMS: 20,
  CHUNK_SIZE_WARNING_LIMIT: 1000,
  
  // AIDEV-NOTE: Remote Storage configuration
  RS_PATH: 'gikamoe',
  
  // AIDEV-NOTE: Centralized error messages for consistency
  ERROR_MESSAGES: {
    HUB_LOAD_FAILED: 'Erro ao carregar o hub', // AIDEV-NOTE: Used for hub fetch failures
    ITEM_LOAD_FAILED: 'Erro ao carregar item',
    NO_PAGES: 'Capítulo sem páginas ou com dados inválidos',
    NETWORK_ERROR: 'Erro de rede. Verifique sua conexão',
    INVALID_DATA: 'Dados inválidos recebidos'
  },
  
  // AIDEV-NOTE: UI constants for skeleton loaders and intersection observer
  SKELETON_COUNT: 8,
  INTERSECTION_ROOT_MARGIN: '100px 0px',
  
  // AIDEV-NOTE: Reading experience modes
  READING_MODES: {
    PAGINATED: 'paginated',
    SCROLLING: 'scrolling'
  }
}

// AIDEV-NOTE: Performance optimization constants for debounce/throttle and virtualization
export const PERFORMANCE = {
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 100,
  IMAGE_LAZY_LOAD: true,
  VIRTUALIZATION_THRESHOLD: 100
}

// AIDEV-NOTE: Responsive design breakpoints for consistent UI across devices
export const BREAKPOINTS = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1280px'
}
