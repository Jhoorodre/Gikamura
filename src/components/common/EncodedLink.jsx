import React from 'react';
import { encodeUrl } from '../../utils/encoding';

/**
 * Um componente de link que abre uma nova aba usando uma URL de destino
 * codificada em Base64, passando por uma rota de redirecionamento interna.
 *
 * @param {object} props
 * @param {string} props.href - A URL de destino final (ex: https://google.com).
 * @param {string} [props.className] - Classes CSS para estilizar o link.
 * @param {React.ReactNode} props.children - O conteúdo a ser exibido no link (texto, ícone, etc).
 */
function EncodedLink({ href, className, children }) {
  // Codifica a URL de destino para Base64
  const encodedUrl = encodeUrl(href);

  return (
    <a href={encodedUrl} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export default EncodedLink;