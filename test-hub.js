// Teste rápido do validador com o hub real do TOG Brasil
import { validateJSON } from './src/services/jsonValidator.js';

// Simular o JSON do TOG Brasil (versão simplificada para teste)
const testHubData = {
  "schema": {
    "version": "2.0",
    "format": "application/json",
    "encoding": "utf-8"
  },
  "meta": {
    "version": "1.0.0",
    "lastUpdated": "2025-06-25T10:00:00-03:00",
    "language": "pt-BR",
    "region": "BR"
  },
  "hub": {
    "id": "tog-brasil-hub",
    "title": "Tower of God Brasil",
    "subtitle": "Scanlation Oficial Brasileira",
    "slug": "tower-of-god-brasil"
  },
  "series": [
    {
      "id": "tog-part1",
      "title": "Tower of God: Parte 1 – O Irregular",
      "slug": "tower-of-god-parte-1-o-irregular",
      "status": {
        "translation": "completed",
        "original": "completed"
      }
    }
  ]
};

console.log('Testando validação do hub.json...');
const result = validateJSON(testHubData);
console.log('Resultado:', result);

if (!result.valid) {
  console.log('Erros encontrados:');
  result.errors.forEach(error => console.log('  -', error));
}
