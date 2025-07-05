# Mapa da Estrutura do Repositório Gikamoe

> **Última atualização:** 2024-06-27

---

## Sumário
- [Raiz do Projeto](#raiz-do-projeto)
- [Pasta Docs](#pasta-docs)
- [Pasta public](#pasta-public)
- [Pasta raw](#pasta-raw)
- [Pasta scripts](#pasta-scripts)
- [Pasta .vscode](#pasta-vscode)
- [Pasta src (Código-fonte)](#pasta-src-código-fonte)
  - [Componentes](#srccomponents)
  - [Views](#srcviews)
  - [Pages](#srcpages)
  - [Contextos](#srccontext)
  - [Hooks](#srchooks)
  - [Serviços](#srcservices)
  - [Utils](#srcutils)
  - [Constantes](#srcconstants)
  - [Pastas Vazias](#pastas-vazias)
- [Pasta src/styles](#pasta-srcstyles)
- [Observações Finais](#observações-finais)
- [Padronização de Nomes](#padronização-de-nomes)
- [Dicas para Contribuidores](#dicas-para-contribuidores)

---

## Raiz do Projeto

- **README.md**: Introdução e instruções básicas do projeto.
- **package.json / package-lock.json**: Gerenciamento de dependências e scripts npm.
- **eslint.config.js**: Configuração do ESLint para padronização de código.
- **vite.config.js**: Configuração do bundler Vite.
- **index.html**: HTML principal da aplicação React.
- **gikamoe.code-workspace**: Configuração de workspace do VSCode.
- **.gitignore**: Arquivos e pastas ignorados pelo Git.

### Pastas principais:
- **[Docs/](#pasta-docs)**: Documentação técnica, roadmaps e guias de integração.
- **[public/](#pasta-public)**: Arquivos públicos e estáticos (ex: service worker, ícones).
- **[raw/](#pasta-raw)**: Exemplos de arquivos de dados (hub.json, reader.json).
- **[scripts/](#pasta-scripts)**: Scripts utilitários para manutenção do projeto.
- **[src/](#pasta-src-código-fonte)**: Código-fonte principal da aplicação.

---

## Pasta Docs
- **roadmap.md**: Roadmap detalhado de evolução do projeto.
- **roadmap-css.md**: Checklist e padrões de otimização CSS.
- **roadmap-navegacao-base64.md**: Plano de reestruturação da navegação usando base64.
- **remotestorage.txt**: Código e explicação detalhada do uso do RemoteStorage.
- **remotestorage_guide.md**: Guia prático de integração e uso do RemoteStorage.
- **widget_remotestorage_code.md**: Explicação do código do widget de conexão RemoteStorage.

---

## Pasta public
- **sw.js**: Service Worker para cache e funcionamento offline.
- **vite.svg**: Ícone SVG utilizado como favicon.

---

## Pasta raw
- **hub.json**: Exemplo de arquivo de catálogo de obras (hub).
- **reader.json**: Exemplo de arquivo de dados de uma obra específica.

---

## Pasta scripts
- **fix-lint-issues.js**: Script para corrigir automaticamente problemas de lint no código.

---

## Pasta .vscode
- **settings.json**: Configurações específicas do VSCode para o projeto.

---

## Pasta src (Código-fonte)

### Arquivos principais
- **App.jsx**: Componente raiz da aplicação React.
- **main.jsx**: Ponto de entrada da aplicação React.

### Subpastas

#### <a id="srccomponents"></a>src/components/
Componentes reutilizáveis da interface.
- **common/**: Componentes genéricos (botões, navegação, modais, ícones, etc).
- **hub/**: Componentes relacionados à exibição e carregamento de hubs.
- **item/**: Componentes para exibição de obras, capítulos e leitores.
- **lazy/**: (Vazia) Reservada para componentes carregados sob demanda.

##### src/components/common/
- **SimpleRemoteStorageWidgetNew.jsx**: Widget de conexão com RemoteStorage.
- **ArrowNavigation.jsx**: Navegação por setas (ex: capítulos/páginas).
- **Navigation.jsx**: Menu de navegação principal.
- **Button.jsx**: Botão customizado.
- **Icones.jsx**: Coleção de ícones SVG como componentes React.
- **MainContent.jsx**: Wrapper para conteúdo principal.
- **RemoteStorageDebug.jsx**: Ferramentas de debug para RemoteStorage.
- **ProtectedRoute.jsx**: Rota protegida por autenticação/conexão.
- **ErrorBoundary.jsx**: Componente para captura de erros em árvore React.
- **Image.jsx**: Componente de imagem otimizada.
- **Spinner.jsx**: Indicador de carregamento.
- **ErrorMessage.jsx**: Exibição de mensagens de erro.
- **ConfirmModal.jsx**: Modal de confirmação.

##### src/components/hub/
- **HubLoaderComponent.jsx**: Componente principal de carregamento de hubs.
- **HubHeader.jsx**: Cabeçalho de exibição de informações do hub.
- **HubLoader.jsx**: Formulário para inserir/carregar URL de hub.
- **HubHistory.jsx**: Histórico de hubs visitados.

##### src/components/item/
- **ItemGrid.jsx**: Grade de exibição de obras/séries.
- **ItemGridSkeleton.jsx**: Skeleton loading para grid de obras.
- **ItemViewer.jsx**: Leitor de capítulos (versão principal).
- **ItemViewerOld.jsx**: Leitor de capítulos (versão antiga).
- **ItemViewerNew.jsx**: Leitor de capítulos (versão nova).
- **ItemInfo.jsx**: Exibe informações detalhadas de uma obra/capítulo.
- **EntryList.jsx**: Lista de capítulos/entradas de uma obra.

#### <a id="srcviews"></a>src/views/
Views de páginas principais da aplicação.
- **HubView.jsx**: Página de exibição de um hub carregado.
- **ItemDetailView.jsx**: Detalhes de uma obra/capítulo.
- **ReaderView.jsx**: Leitor de capítulos (principal).
- **ReaderViewNew.jsx**: Leitor de capítulos (versão nova).
- **ChapterReaderView.jsx**: Leitor de capítulos individual.
- **ChapterReaderViewNew.jsx**: Leitor de capítulos individual (nova versão).
- **HubRouteHandler.jsx**: Handler de rotas para hubs.

#### <a id="srcpages"></a>src/pages/
Páginas de alto nível (rotas principais).
- **SeriesDetailPage.jsx**: Página de detalhes de uma série.
- **UploadPage.jsx**: Página para upload/criação de arquivos JSON.
- **CollectionPage.jsx**: Página da biblioteca de hubs salvos.
- **WorksPage.jsx**: Página de obras/séries favoritas.
- **RedirectPage.jsx**: Página de redirecionamento de rotas.

#### <a id="srccontext"></a>src/context/
Contextos React para estado global.
- **AppContext.jsx**: Contexto global da aplicação.
- **RemoteStorageContext.jsx**: Contexto para conexão e estado do RemoteStorage.

#### <a id="srchooks"></a>src/hooks/
Hooks customizados para lógica reutilizável.
- **useReader.js**: Lógica do leitor de capítulos.
  - _Exemplo de uso:_
    ```js
    const { currentPage, goToNextPage } = useReader();
    ```
- **useItem.js**: Lógica para manipulação de obras/capítulos.
- **useOptimization.js**: Hooks para otimização de listas, filtros, etc.
- **useHistory.js**: Hooks para histórico de navegação e hubs.
- **useReaderSettings.js**: Hooks para configurações do leitor.
- **useHubLoader.js**: Lógica para carregamento de hubs.
- **useServiceWorker.js**: Hooks para manipulação do service worker.
- **useNetworkMonitor.js**: Monitoramento de status de rede.
- **useUtils.js**: Hooks utilitários diversos (debounce, throttle, etc).
  - _Exemplo de uso:_
    ```js
    const debouncedValue = useDebounce(value, 300);
    ```

#### <a id="srcservices"></a>src/services/
Serviços de integração, validação e manipulação de dados.
- **api.js**: API interna para manipulação de dados e histórico.
- **networkService.js**: Funções para fetch robusto e manipulação de rede.
- **remotestorage.js**: Integração e lógica do RemoteStorage.
- **jsonValidator.js**: Validação de arquivos hub.json e reader.json.
  - _Exemplo de uso:_
    ```js
    import { validateHubJSON } from './jsonValidator';
    const resultado = validateHubJSON(dados);
    ```
- **jsonReader.js**: Leitura e manipulação de arquivos JSON.
- **rs/**: Configurações e schemas do RemoteStorage.
  - **rs-schemas.js**: Schemas de dados para RemoteStorage.
  - **rs-config.js**: Configuração do módulo RemoteStorage.

#### <a id="srcutils"></a>src/utils/
Funções utilitárias gerais.
- **networkDebug.js**: Ferramentas de debug de rede e cache.
- **encoding.js**: Funções para codificação/decodificação de URLs e base64.
  - _Exemplo de uso:_
    ```js
    const encoded = encodeUrl('https://meusite.com');
    ```
- **particles.js**: Efeitos visuais de partículas.

#### <a id="srcconstants"></a>src/constants/
Constantes globais do projeto.
- **app.js**: Constantes da aplicação.
- **index.js**: Exportação central de constantes.

#### <a id="pastas-vazias"></a>Pastas Vazias
- **src/assets/**: Reservada para assets estáticos (imagens, fontes, etc).
- **src/api/**: Reservada para integrações futuras com APIs.
- **src/components/lazy/**: Reservada para componentes carregados sob demanda.

---

## Pasta src/styles
Arquivos de estilos CSS organizados por escopo e função.
- **base.css**: Estilos globais básicos.
- **components.css**: Estilos de componentes reutilizáveis.
- **hub-loader.css**: Estilos específicos do carregador de hubs.
- **hub-minimal.css**: Estilos minimalistas para páginas de hub.
- **hub-fixed.css**: Estilos fixos/avançados para páginas de hub.
- **index.css**: Importa e organiza os estilos principais.
- **layout.css**: Utilitários de layout e grid.
- **pages.css**: Estilos para páginas principais.
- **reader.css**: Estilos do leitor de capítulos.
- **reader-consolidated.css**: Estilos consolidados do leitor.
- **reader-view.css**: Estilos para visualização de capítulos.
- **tokens.css**: Variáveis CSS (cores, espaçamento, etc).
- **utilities.css**: Utilitários CSS gerais.
- **widget.css**: Estilos do widget RemoteStorage.
- **widget-clean.css**: Versão minimalista do widget RemoteStorage.

---

## Observações Finais

### Modularidade
O projeto é modular, com separação clara entre lógica, componentes, estilos e dados.

### Expansão Futura
As pastas `src/assets/`, `src/api/` e `src/components/lazy/` estão vazias, mas reservadas para expansão futura.

### Documentação Viva
Consulte sempre os arquivos da pasta `Docs/` para entender decisões de arquitetura e padrões adotados.

### Atualização Automática
Sugere-se criar um script para atualizar este mapa automaticamente sempre que a estrutura do projeto mudar.

---

## Padronização de Nomes
- Prefira **camelCase** para arquivos JS/JSX e funções.
- Use **kebab-case** para arquivos CSS.
- Pastas devem ser nomeadas em **minúsculas** e, se necessário, com hífen.
- Componentes React devem ser nomeados em **PascalCase**.

---

## Dicas para Contribuidores
- Sempre atualize este mapa ao adicionar, remover ou renomear arquivos/pastas.
- Documente novas funcionalidades na pasta `Docs/`.
- Siga os padrões de nomenclatura e organização descritos acima.
- Para dúvidas, consulte os roadmaps e guias na pasta `Docs/`.

---

**Este mapa deve ser atualizado sempre que a estrutura do projeto for alterada!** 