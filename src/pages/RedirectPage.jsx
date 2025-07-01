import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { decodeUrl } from '../utils/encoding';

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
        // Decodifica a string Base64 para a URL original
        const decodedUrl = decodeUrl(base64Url);

        // Validação básica para garantir que é uma URL segura antes de redirecionar
        if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
          // Redireciona para a URL externa. `replace: true` impede que esta
          // página de redirecionamento fique no histórico do navegador.
          window.location.replace(decodedUrl);
        } else {
          throw new Error('URL decodificada não é válida.');
        }
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