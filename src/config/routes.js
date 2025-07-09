/**
 * Configuração centralizada de rotas
 * AIDEV-NOTE: Previne problemas de rotas duplicadas e facilita manutenção
 */

export const ROUTES = {
  HOME: '/',
  COLLECTION: '/collection',
  WORKS: '/works',
  UPLOAD: '/upload',
  HUB: '/hub/:encodedUrl',
  MANGA: '/manga/:encodedUrl',
  READER: '/reader/:encodedUrl/:encodedChapterId',
  
  // Rotas antigas para compatibilidade
  READER_OLD: '/reader/:encodedUrl',
  LEITOR_OLD: '/leitor/:encodedUrl',
  LEITOR_CHAPTER_OLD: '/leitor/:encodedUrl/:encodedChapterId',
};

/**
 * Gera URL para hub
 */
export const getHubUrl = (encodedUrl) => {
  return `/hub/${encodedUrl}`;
};

/**
 * Gera URL para manga
 */
export const getMangaUrl = (encodedUrl) => {
  return `/manga/${encodedUrl}`;
};

/**
 * Gera URL para reader
 */
export const getReaderUrl = (encodedUrl, encodedChapterId) => {
  return `/reader/${encodedUrl}/${encodedChapterId}`;
};

/**
 * Extrai parâmetros da URL atual
 */
export const extractRouteParams = (pathname) => {
  const patterns = {
    hub: /^\/hub\/(.+)$/,
    manga: /^\/manga\/(.+)$/,
    reader: /^\/reader\/([^/]+)\/(.+)$/,
  };
  
  for (const [type, pattern] of Object.entries(patterns)) {
    const match = pathname.match(pattern);
    if (match) {
      if (type === 'reader') {
        return { type, encodedUrl: match[1], encodedChapterId: match[2] };
      }
      return { type, encodedUrl: match[1] };
    }
  }
  
  return null;
};
