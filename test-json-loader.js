// Teste direto do loadHubJSON
import { loadHubJSON } from './src/services/jsonReader.js';

const url = "https://raw.githubusercontent.com/Jhoorodre/TOG-Brasil/refs/heads/main/hub_tog.json";

console.log('Testando carregamento direto do hub...');

loadHubJSON(url)
    .then(data => {
        console.log('✅ Hub carregado com sucesso!');
        console.log('Título:', data.hub?.title);
        console.log('Número de séries:', data.series?.length);
        console.log('Válido:', data._metadata?.valid);
    })
    .catch(error => {
        console.error('❌ Erro ao carregar hub:', error.message);
        console.error('Stack:', error.stack);
    });
