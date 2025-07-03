/**
 * Utilitários para codificação/decodificação segura de URLs
 * AIDEV-NOTE: Robust implementation for safe Base64 URL handling
 */

/**
 * Codifica uma URL em Base64 de forma segura
 * AIDEV-NOTE: Throws if input is not a valid string
 */
export const encodeUrl = (str) => {
  try {
    if (!str || typeof str !== 'string') {
      throw new Error('URL deve ser uma string válida');
    }
    
    // Codifica a string em Base64 e torna URL-safe
    return btoa(encodeURIComponent(str))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, ''); // Remove padding
  } catch (error) {
    console.error('Erro ao codificar URL:', error); // AIDEV-NOTE: Encoding error is non-blocking
    throw new Error('Falha na codificação da URL');
  }
};

/**
 * Decodifica uma URL Base64 de forma segura
 * AIDEV-NOTE: Throws if input is not a valid string
 */
export const decodeUrl = (encodedStr) => {
  try {
    if (!encodedStr || typeof encodedStr !== 'string') {
      throw new Error('String codificada deve ser válida');
    }
    
    // Restaura o formato Base64 padrão
    let base64 = encodedStr
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Adiciona padding se necessário
    while (base64.length % 4) {
      base64 += '=';
    }
    
    // Decodifica e desescapa caracteres URI
    return decodeURIComponent(atob(base64));
  } catch (error) {
    console.error('Erro ao decodificar URL:', error); // AIDEV-NOTE: Decoding error is non-blocking
    throw new Error('Falha na decodificação da URL');
  }
};

/**
 * Valida se uma string é uma URL válida
 * AIDEV-TODO: Consider using a stricter URL validation regex
 * @param {string} str - String a ser validada
 * @returns {boolean} - Se é uma URL válida
 */
export const isValidUrl = (str) => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Valida se uma string é Base64 válida
 * @param {string} str - String a ser validada
 * @returns {boolean} - Se é Base64 válida
 */
export const isValidBase64 = (str) => {
  try {
    // Tenta decodificar para verificar se é válida
    decodeUrl(str);
    return true;
  } catch {
    return false;
  }
};
