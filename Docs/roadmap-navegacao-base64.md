# Roadmap: Reestruturação da Navegação com Base64

Este documento detalha a implementação da navegação baseada em Base64 para as rotas da aplicação Gikamoe, visando aumentar a privacidade e a robustez do sistema.

## 1. Visão Geral

A principal motivação é ofuscar as URLs diretas de recursos (`hub.json`, `reader.json`) na barra de endereço do navegador. Isso dificulta o rastreamento automatizado e a identificação da origem do conteúdo por observadores casuais.

## 2. Estrutura de Rotas

As rotas que lidam com conteúdo externo agora utilizam parâmetros codificados em Base64.

| Rota Antiga (Exemplo)                | Rota Nova (Exemplo)                                     | Componente Responsável |
| ------------------------------------ | ------------------------------------------------------- | ---------------------- |
| `/hub?url=https://.../hub.json`      | `/hub/aHR0cHM6...`                                      | `HubRouteHandler`      |
| `/reader?url=https://.../reader.json`| `/reader/aHR0cHM6...`                                   | `ReaderView`           |
| `/series?url=https://.../reader.json`| `/series/aHR0cHM6...`                                   | `SeriesDetailPage`     |
| `/read/.../:chapterId`               | `/read/.../:encodedChapterId`                           | `ChapterReaderView`    |

## 3. Fluxo de Navegação

1.  **Carregar um Hub**:
    * O usuário insere uma URL de `hub.json` na página inicial.
    * A aplicação codifica a URL em Base64.
    * O usuário é redirecionado para `/hub/{base64_encoded_url}`.
    * O `HubRouteHandler` decodifica a URL e carrega os dados do hub.

2.  **Acessar uma Obra**:
    * Dentro da página do hub, o usuário clica em uma obra.
    * A URL do `reader.json` da obra é extraída e codificada.
    * O usuário é redirecionado para `/reader/{base64_encoded_url_do_reader}`.

3.  **Ler um Capítulo**:
    * Na página da obra, o usuário clica em um capítulo.
    * O ID do capítulo é codificado.
    * O usuário é redirecionado para `/read/{base64_url_da_obra}/{base64_id_do_capitulo}`.

## 4. Benefícios

* **Privacidade**: A origem dos arquivos JSON não é diretamente visível na URL.
* **Segurança**: Dificulta a ação de bots que rastreiam links diretos.
* **Robustez**: Evita problemas com caracteres especiais em URLs.
* **Consistência**: Padroniza a forma como os recursos externos são carregados. 