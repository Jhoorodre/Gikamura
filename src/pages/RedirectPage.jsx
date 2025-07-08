import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decodeAndValidateExternalUrl } from '../utils/urlDecoder';

/**
 * Esta página recebe uma URL codificada em Base64 como parâmetro,
 * a descodifica e redireciona o utilizador para o destino final.
 */
function RedirectPage() {
  // Pega o parâmetro :base64Url da rota (ex: /redirect/aHR0cHM6Ly9nb29nbGUuY29t)
  const { base64Url } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (base64Url) {
      try {
        // AIDEV-NOTE: Use centralized decoding and validation logic
        const decodedUrl = decodeAndValidateExternalUrl(base64Url);

        // Redireciona para a URL externa. `replace: true` impede que esta
        // página de redirecionamento fique no histórico do navegador.
        window.location.replace(decodedUrl);
      } catch (error) {
        console.error('Falha ao processar a URL Base64:', error);
        // Em caso de erro, volta para a página inicial
        navigate('/');
      }
    }
  }, [base64Url, navigate]);

  // Exibe uma mensagem enquanto o redirecionamento ocorre
  return <div>Redirecionando...</div>;
}

export default RedirectPage;