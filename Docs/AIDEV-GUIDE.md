# GIKAMOE\_AGENTS.md

*Última atualização: 2025-07-03*

> **Propósito** – Este arquivo é o manual de integração para cada assistente de IA e cada humano que edita este repositório. Ele codifica nossos padrões de codificação, regras e truques de fluxo de trabalho para que o trabalho humano (arquitetura, testes, julgamento de domínio) permaneça em mãos humanas.

-----

## 0\. Visão geral do projeto

O Gikamoe é uma aplicação de leitura de conteúdo digital que opera exclusivamente no front-end. Sua arquitetura é projetada para ser altamente escalável e anônima, colocando o poder e a privacidade nas mãos do usuário. A aplicação não depende de um back-end; todo o conteúdo e metadados são carregados dinamicamente a partir de arquivos JSON hospedados externamente.

**Componentes Chave:**

  * **Arquitetura Serverless:** Reduz a complexidade e os custos, tornando a aplicação resiliente e escalável.
  * **Fontes de Dados:** Opera com dois tipos de arquivos JSON:
      * `hub.json`: Funciona como um catálogo de uma fonte de conteúdo, listando múltiplas "obras".
      * `reader.json`: Define a estrutura de uma obra específica, com um formato rígido para garantir compatibilidade universal.
  * **Privacidade e Segurança:** Utiliza codificação de rotas (Base64) para ofuscar URLs e terminologia neutra ("obras", "fontes") para reduzir a exposição do projeto.
  * **RemoteStorage:** Permite a personalização e persistência de dados do usuário, como bibliotecas, favoritos e progresso de leitura, de forma descentralizada.

**Regra de Ouro**: Em caso de dúvida sobre detalhes de implementação ou requisitos, SEMPRE consulte o desenvolvedor em vez de fazer suposições.

-----

## 1\. Regras de Ouro Inegociáveis

| Nº: | O que a IA *pode* fazer | O que a IA *NÃO PODE* fazer |
|---|---|---|
| G-0 | Sempre que não tiver certeza sobre algo relacionado ao projeto, peça esclarecimentos ao desenvolvedor antes de fazer alterações. | ❌ Escrever alterações ou usar ferramentas quando não tiver certeza sobre algo específico do projeto, ou se não tiver contexto para uma funcionalidade/decisão específica. |
| G-1 | Gerar código **apenas dentro** dos diretórios de origem relevantes (ex: `src/components/`, `src/hooks/`, `src/services/`) ou em arquivos explicitamente apontados. | ❌ Tocar em `Docs/`, `README.md`, ou qualquer arquivo de configuração principal sem instrução direta. |
| G-2 | Adicionar/atualizar comentários âncora **`AIDEV-NOTE:`** perto de código editado não trivial. | ❌ Excluir ou alterar os comentários `AIDEV-` existentes. |
| G-3 | Seguir as configurações de lint/estilo (`eslint.config.js`, `.gitignore`). Usar o linter configurado do projeto em vez de reformatar o código manualmente. | ❌ Reformatar o código para qualquer outro estilo. |
| G-4 | Para alterações \>300 LOC ou \>3 arquivos, **peça confirmação**. | ❌ Refatorar grandes módulos sem orientação humana. |
| G-5 | Manter-se dentro do contexto da tarefa atual. Informar o desenvolvedor se for melhor começar de novo. | ❌ Continuar o trabalho de um prompt anterior após "nova tarefa" – inicie uma nova sessão. |

-----

## 2\. Comandos de Build, Teste e Utilitários

Use os scripts do `package.json` para consistência.

```bash
# Iniciar o servidor de desenvolvimento
npm run dev

# Compilar a aplicação para produção
npm run build

# Executar o linter para verificar a qualidade do código
npm run lint

# Visualizar a build de produção localmente
npm run preview
```

-----

## 3\. Padrões de Codificação

  * **JavaScript/React**: React 19, com uso preferencial de hooks e contexto (`useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`).
  * **Formatação**: `ESLint` é utilizado para garantir a qualidade e o padrão do código. Permite o uso de prefixo de sublinhado para variáveis não utilizadas (`_`).
  * **Estilo**: Utiliza CSS Modules com tokens de design para componentização e consistência visual, seguindo a paleta de cores definida no roadmap.
  * **Nomenclatura**: `camelCase` para arquivos e funções, `PascalCase` para componentes React e `kebab-case` para arquivos CSS.
  * **Tratamento de Erros**: Componente `ErrorBoundary` para capturar e exibir erros na árvore de componentes de forma controlada.
  * **Comentários**: O código utiliza extensivamente comentários `AIDEV-NOTE`, `AIDEV-TODO` e `AIDEV-QUESTION` para fornecer contexto e guiar o desenvolvimento.

-----

## 4\. Layout do Projeto e Componentes Principais

A estrutura do projeto segue uma abordagem modular e organizada, focada na separação de responsabilidades, conforme detalhado no `mapa_estrutura_repositorio.md`.

| Diretório | Descrição |
|---|---|
| `src/` | Código-fonte principal da aplicação, incluindo componentes, hooks, contextos, páginas e serviços. |
| `src/components/` | Componentes reutilizáveis da interface, divididos em `common/`, `hub/` e `item/`. |
| `src/hooks/` | Hooks customizados para lógica de negócios reutilizável (ex: `useReader`, `useHubLoader`). |
| `src/context/` | Provedores de contexto para gerenciamento de estado global (`AppContext`, `RemoteStorageContext`). |
| `src/services/` | Módulos para interagir com APIs externas, validação de dados e `RemoteStorage`. |
| `src/pages/` | Componentes que representam as páginas principais da aplicação (ex: `CollectionPage`, `WorksPage`). |
| `src/views/` | Componentes que compõem as páginas, atuando como templates de layout. |
| `src/styles/` | Folhas de estilo CSS, organizadas por função (tokens, base, componentes, layout, etc.). |
| `Docs/` | Documentação técnica, roadmaps e guias do projeto. |

**Modelos de Domínio Principais**:

  * **Hub**: Catálogo de obras de uma fonte específica, definido em `hub.json`.
  * **Obra/Série**: Um item de conteúdo individual, como um mangá ou webtoon.
  * **Capítulo/Entrada**: Uma parte de uma obra, contendo as páginas para leitura.
  * **RemoteStorage**: Tecnologia para armazenamento de dados do usuário (favoritos, histórico, progresso) de forma descentralizada.

-----

## 5\. Anchor comments  

Add specially formatted comments throughout the codebase, where appropriate, for yourself as inline knowledge that can be easily `grep`ped for.  

### Guidelines:  

- Use `AIDEV-NOTE:`, `AIDEV-TODO:`, or `AIDEV-QUESTION:` (all-caps prefix) for comments aimed at AI and developers.  
- Keep them concise (≤ 120 chars).  
- **Important:** Before scanning files, always first try to **locate existing anchors** `AIDEV-*` in relevant subdirectories.  
- **Update relevant anchors** when modifying associated code.  
- **Do not remove `AIDEV-NOTE`s** without explicit human instruction.  

Example:

```javascript
// AIDEV-NOTE: perf-hot-path; avoid extra allocations (see ADR-24)  
async def render_feed(...):  
    ...  
```
### Search for anchors:
```bash

# Encontrar todos os anchor comments
grep -r "AIDEV-" src/

# Comando correto:
Get-ChildItem

# Filtrar por tipo específico
grep -r "AIDEV-NOTE" src/
grep -r "AIDEV-TODO" src/
grep -r "AIDEV-QUESTION" src/
``` 

-----

## 6\. Modelos de Dados (JSON)

  * Para modificar a forma como os dados são consumidos, entenda os dois arquivos principais: `hub.json` e `reader.json`.
  * **`hub.json`**: Flexível. O desenvolvedor tem liberdade para usar todos os campos disponíveis para criar uma interface rica, com filtros, badges e destaques.
  * **`reader.json`**: Estrutura fixa e imutável. A lógica de renderização da "Página da Obra" deve ser construída para consumir este formato específico para garantir compatibilidade universal.
  * **Validação**: O serviço `src/services/jsonValidator.js` contém as regras e schemas para validar a estrutura desses arquivos.

-----

## 7\. Terminologia Específica do Domínio

  * **Hub**: Um arquivo `hub.json` que funciona como um catálogo ou índice de uma fonte de conteúdo.
  * **Fonte**: A origem do conteúdo, representada por um `hub.json`.
  * **Obra/Série**: Um item de conteúdo individual, como um mangá ou webtoon, cujos dados são definidos em um `reader.json`.
  * **RemoteStorage**: Serviço de armazenamento descentralizado para dados do usuário.
  * **AIDEV-NOTE/TODO/QUESTION**: Comentários formatados para fornecer contexto ou tarefas para IAs e desenvolvedores.
  * **FSD (Feature-Sliced Design)**: Arquitetura de design de software mencionada nos arquivos de configuração, que organiza o código por funcionalidade.