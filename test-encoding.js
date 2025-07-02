// Teste de codificação/decodificação
import { encodeUrl, decodeUrl } from './src/utils/encoding.js';

const url = "https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/refs/heads/main/hub_tog.json";

console.log('URL original:', url);

try {
    const encoded = encodeUrl(url);
    console.log('URL codificada:', encoded);
    
    const decoded = decodeUrl(encoded);
    console.log('URL decodificada:', decoded);
    
    console.log('URLs são iguais?', url === decoded);
} catch (error) {
    console.error('Erro:', error);
}
