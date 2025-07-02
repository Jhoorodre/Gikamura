# RemoteStorage no Projeto Gikamoe

> **Guia funcional e estrutural**

---

## 1. O que é RemoteStorage?
RemoteStorage é uma tecnologia de armazenamento descentralizado, permitindo ao usuário salvar dados pessoais (histórico, favoritos, progresso, etc) sem backend próprio. No Gikamoe, ele é usado para:
- Salvar hubs visitados (biblioteca)
- Salvar obras favoritas (pinadas)
- Sincronizar progresso de leitura e preferências
- Permitir upload/criação de arquivos JSON personalizados

---

## 2. Onde está implementado?

### a) Integração e Configuração
- **src/services/remotestorage.js**: Integração principal, schemas, métodos CRUD, exporta `remoteStorage` e `globalHistoryHandler`.
- **src/services/rs/rs-schemas.js**: Schemas de dados (estrutura dos objetos salvos).
- **src/services/rs/rs-config.js**: Configuração extra do módulo.

### b) Contextos React
- **src/context/RemoteStorageContext.jsx**: Contexto React para conexão, estado e eventos do RemoteStorage.
- **src/context/AppContext.jsx**: Pode interagir para estado global.

### c) Hooks
- **src/hooks/useHistory.js**: Manipulação de histórico de hubs/obras.
- **src/hooks/useReader.js**: Progresso de leitura.
- **src/hooks/useServiceWorker.js**: Limpeza de cache/localStorage relacionado.

### d) Componentes
- **src/components/common/SimpleRemoteStorageWidgetNew.jsx**: Widget visual de conexão/desconexão.
- **src/components/common/RemoteStorageDebug.jsx**: Ferramentas de debug.

### e) Views e Páginas
- **src/pages/CollectionPage.jsx**: Biblioteca de hubs salvos.
- **src/pages/WorksPage.jsx**: Obras favoritas.
- **src/pages/UploadPage.jsx**: Upload/criação de arquivos JSON.

---

## 3. Fluxo de Funcionamento
1. **Conexão:** Usuário conecta via widget; estado gerenciado pelo contexto.
2. **Salvamento automático:** Hubs visitados e obras favoritas são salvos automaticamente.
3. **Sincronização:** Dados sincronizados entre dispositivos conectados ao mesmo RemoteStorage.
4. **Listagem:** Hubs e obras salvos são listados nas páginas correspondentes.
5. **Desconexão:** Usuário pode desconectar pelo widget, limpando o estado local.

---

## 4. Documentação e Exemplos
- **Docs/roadmap.md**: Papel do RemoteStorage na arquitetura.
- **Docs/remotestorage.txt**: Código e explicação detalhada.
- **Docs/remotestorage_guide.md**: Guia prático de uso.
- **Docs/widget_remotestorage_code.md**: Funcionamento do widget visual.

---

## 5. Pontos Importantes
- **Privacidade:** Dados sob controle do usuário.
- **Sincronização:** Acesso aos dados em qualquer dispositivo.
- **Descentralização:** Sem backend centralizado.
- **Melhoria Progressiva:** App funciona sem RemoteStorage, mas ganha recursos extras quando conectado.

---

## 6. Exemplos de Uso
```js
// Salvar hub visitado
await globalHistoryHandler.addHub(url, title, iconUrl);

// Listar hubs salvos
const hubs = await globalHistoryHandler.getAllHubs();

// Salvar obra favorita
await globalHistoryHandler.pinSeries(slug, coverUrl, source, url, title);

// Salvar progresso de leitura
await globalHistoryHandler.addChapter(slug, source, chapterId);
```

---

## 7. Onde consultar/alterar
- Toda a lógica central está em:
  - `src/services/remotestorage.js`
  - `src/services/rs/rs-schemas.js`
  - `src/context/RemoteStorageContext.jsx`
  - `src/hooks/useHistory.js`
  - Widget: `src/components/common/SimpleRemoteStorageWidgetNew.jsx`

---

## 8. Referência ao Mapa de Estrutura
Consulte o arquivo [`Docs/mapa_estrutura_repositorio.md`](./mapa_estrutura_repositorio.md) para localização rápida de todos os arquivos citados e para entender a organização geral do projeto.

---

Se precisar de um diagrama, exemplos de código mais detalhados, ou explicação de algum fluxo específico, consulte também os arquivos da pasta `Docs/` ou peça diretamente! 