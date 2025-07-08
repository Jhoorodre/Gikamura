# Roadmap Detalhado e Estruturado: Leitor de Mídias Gikamoe

Este documento apresenta a estruturação completa do roadmap de evolução para o leitor de mídias Gikamoe. Cada seção foi detalhada e contextualizada com base nos requisitos do roadmap.md e nos exemplos de arquivos hub.json e reader.json, servindo como um guia definitivo para o desenvolvimento da aplicação.

## 1. Visão Geral e Arquitetura Fundamental

O Gikamoe é concebido como uma aplicação de leitura de conteúdo digital, operando exclusivamente no front-end. Sua arquitetura é desenhada para ser altamente escalável e anônima, colocando o poder e a privacidade nas mãos do usuário.

### Arquitetura Serverless

A aplicação não depende de um back-end. Todo o conteúdo e metadados são carregados dinamicamente a partir de arquivos JSON hospedados externamente (ex: via links "raw" do GitHub). 

Essa abordagem oferece vantagens significativas para um projeto comunitário:
- Reduz a complexidade de manutenção a zero
- Minimiza custos operacionais (sem taxas de servidor ou banco de dados)
- Torna a aplicação inerentemente resistente a picos de tráfego e tentativas de censura, pois não há um ponto central de falha
- A escalabilidade é praticamente infinita, pois adicionar novas fontes (scans) ou obras não exige alterações na infraestrutura, apenas a criação de novos arquivos JSON
- Empodera criadores e grupos pequenos, permitindo que publiquem conteúdo sem barreiras financeiras ou técnicas
- A natureza descentralizada significa que, se um host de um hub.json ficar offline, isso não afeta em nada o acesso a outros hubs, garantindo a resiliência geral do ecossistema

### Fonte de Dados

A aplicação opera com dois tipos de arquivos JSON, cada um com um papel distinto e crucial:

#### hub.json
Funciona como um "índice" ou "catálogo" de uma fonte de conteúdo, listando múltiplas obras (séries) e fornecendo metadados sobre a fonte em si (título, ícone, descrição). Este arquivo é intencionalmente flexível, permitindo que as fontes inovem na apresentação de seu conteúdo. 

Por exemplo, um grupo poderia adicionar campos personalizados como:
- `"staff": {"translator": "Nome", "editor": "Nome"}`
- `"related_series": ["id_da_outra_serie"]`
- `"reading_order": ["id_serie_1", "id_serie_2"]`

Isso enriquece a experiência do usuário com informações contextuais valiosas diretamente na página da fonte.

#### reader.json
Define a estrutura de uma obra específica, contendo seus detalhes e os links para as páginas de cada capítulo. Este formato é rígido e não deve ser alterado. 

A rigidez é a chave para a universalidade do Gikamoe; assim como um leitor de PDF pode abrir qualquer arquivo .pdf, o Gikamoe pode ler qualquer reader.json que siga o padrão. Essa padronização é uma funcionalidade, não uma limitação. Ela garante:
- Compatibilidade universal
- Longevidade do ecossistema
- Permite que ferramentas de terceiros (como geradores de reader.json ou validadores) sejam construídas em torno de um padrão estável e confiável

### Anonimização e Segurança

A privacidade é um pilar central, protegendo tanto os usuários quanto as fontes de conteúdo através de uma abordagem de duas camadas:

#### Codificação de Rotas
Todas as URLs de navegação interna que apontam para recursos (hubs ou obras) serão codificadas em Base64. É importante notar que isso é ofuscação, não criptografia. 

O objetivo é:
- Impedir a identificação direta do host por observadores casuais
- Dificultar a ação de bots automatizados que rastreiam links diretos
- Adicionar uma camada essencial de discrição

Para o usuário, a URL na barra de endereço será ilegível, mas para a aplicação, ela contém todas as informações necessárias para buscar o recurso correto.

**Exemplo:** `dominio.com/series/aHR0cHM6Ly9yYXcuZXhhbXBsZS5jb20vdXNlci9yZXBvL21haW4vcmVhZGVyLmpzb24=`

#### Terminologia Neutra
A interface e o código-fonte devem evitar sistematicamente referências diretas a "mangá", "scan", etc., utilizando termos genéricos como "obras", "séries", "fontes", "capítulos" e "páginas". 

Essa prática tem implicação de segurança direta:
- Torna o propósito da aplicação menos óbvio para sistemas automatizados de marcação de conteúdo
- Reduz a exposição legal do projeto
- Permite que ele opere em um espaço mais seguro
- Cria uma "negação plausível", onde a ferramenta é, em sua essência, um agregador de conteúdo genérico baseado em JSON

## 2. Estrutura de Navegação e Fluxo de Dados

O percurso do usuário é projetado para ser simples, intuitivo e direto, desde a descoberta de uma fonte até a imersão total na leitura do conteúdo.

### 2.1. Página Inicial (Ponto de Entrada)

**Função:** É a porta de entrada da aplicação. A interface inicial deve ser intencionalmente minimalista e focada, contendo apenas um campo de entrada (placeholder). Este design comunica imediatamente a filosofia da ferramenta: o usuário está no controle total, e o Gikamoe atua como um navegador ou um leitor, não como um guardião de conteúdo.

**Ação do Usuário:** O usuário cola a URL "raw" de um arquivo hub.json no campo de texto.

**Lógica do Sistema:**
- A aplicação faz o fetch do JSON a partir da URL fornecida, com tratamento de erros robusto para links inválidos, inacessíveis (erro 404) ou arquivos malformados
- O feedback ao usuário deve ser claro, como "Não foi possível carregar a fonte. Verifique o link e tente novamente."
- A URL do hub é validada e, se bem-sucedida, codificada em Base64 para ser usada na rota de navegação
- O sistema renderiza a Página da Fonte (Scan), populando-a dinamicamente com os dados extraídos do hub.json
- Se o usuário estiver conectado ao Remote Storage, as informações do hub (hub.title, hub.icon.url, e o link original) são automaticamente salvas como um card na Biblioteca para acesso futuro

### 2.2. Página da Fonte (Scan)

**Função:** Exibe o catálogo de todas as obras disponíveis no hub carregado, apresentadas em formato de cards. Esta página funciona como a vitrine da fonte, e sua qualidade visual e funcional é um diferencial competitivo para os grupos.

**Fonte de Dados:** O array series dentro do hub.json. Cada objeto neste array se torna um card.

**Contexto (hub.json):** Um card deve ser rico em informações para atrair o usuário. Elementos como a capa (cover.url), título (title), gêneros (genres), status da tradução (status.translation), e a avaliação da comunidade (rating.community) devem ser exibidos. 

A interface deve traduzir esses dados em elementos de UX poderosos:
- Barra de ferramentas que permite ao usuário filtrar por múltiplos gêneros simultaneamente (usando checkboxes)
- Ordenar por popularidade (rating) ou data de atualização (lastUpdated)
- Visualizar badges de status (ex: "Em Andamento", "Completo", "Novo Capítulo!") derivados dos campos status e tags
- Seção no topo para obras marcadas com "featured": true no hub.json, dando destaque ao conteúdo principal da fonte

**Ação do Usuário:** Clicar em um card de uma obra.

**Lógica do Sistema:**
- O sistema extrai a URL do arquivo de dados da obra, que está no campo data.url do objeto da série clicada
- Essa URL (que aponta para um reader.json) é codificada em Base64
- O usuário é redirecionado para a Página da Obra, seguindo o formato de rota: `.../series/{base64_encoded_url_do_reader}`

### 2.3. Página da Obra (Leitor de Conteúdo)

**Função:** Apresenta os detalhes da obra e a lista de capítulos disponíveis para leitura. A experiência de leitura deve ser imersiva e livre de distrações, colocando o conteúdo em primeiro plano.

**Fonte de Dados:** Um arquivo reader.json. A estrutura deste arquivo é fixa e imutável.

**Contexto (reader.json):** A página deve exibir o título (title), a capa (cover), uma descrição detalhada (description) e uma lista de capítulos. Cada capítulo na lista é uma chave dentro do objeto chapters (ex: "001", "002"), contendo seu próprio título (title) e data de atualização (last_updated), que deve ser exibida de forma amigável (ex: "Atualizado há 2 dias").

**Lógica de Leitura:** 
- Ao selecionar um capítulo, a interface de leitura deve tomar conta da tela
- Elementos de UI, como barras de navegação, devem se ocultar automaticamente durante a rolagem
- O sistema deve oferecer configurações de leitura, como direção (esquerda para direita, direita para esquerda)
- Deve pré-carregar as próximas 3-5 imagens em segundo plano para garantir uma experiência de leitura perfeitamente fluida
- O leitor também deve salvar o progresso do usuário (última página lida de cada capítulo), permitindo continuar de onde parou (se conectado ao Remote Storage)

## 3. Funcionalidades Dependentes do Remote Storage

As funcionalidades a seguir compõem a camada de personalização da aplicação, transformando-a de um simples leitor para um hub de conteúdo pessoal. Elas enriquecem a experiência do usuário, mas só devem ser visíveis e acessíveis quando o usuário estiver conectado ao Remote Storage.

### 3.1. Biblioteca

**Função:** Agrega todos os "hubs" (fontes) que o usuário já carregou, funcionando como um histórico de fontes visitadas e oferecendo acesso rápido sem a necessidade de guardar as URLs. Isso transforma a ferramenta de um simples "abridor de arquivos" para um portal de conteúdo personalizado.

**Armazenamento:** O Remote Storage persiste os cards dos hubs (nome, ícone, link).

**Gatilho:** Um card é adicionado automaticamente à biblioteca sempre que um novo link de hub.json é carregado com sucesso na página inicial. A interface da biblioteca deve ser uma grade ou lista limpa de cards, cada um servindo como um portal de um clique para o catálogo daquela fonte. Idealmente, a biblioteca poderia verificar periodicamente os hubs salvos e exibir um indicador visual (um "badge") em um hub se alguma de suas obras foi atualizada recentemente.

### 3.2. Página "Obras"

**Função:** Atua como uma lista de favoritos pessoal e granular do usuário, exibindo todas as obras específicas que ele favoritou ("pinou"), independentemente do hub de origem. Sua principal vantagem é criar uma "playlist" de leitura que transcende as fontes individuais.

**Armazenamento:** O Remote Storage salva a referência (link para o reader.json) de cada obra favoritada.

**Gatilho:** Na "Página da Obra", haverá um botão (ex: um ícone de pino ou estrela) que, ao ser clicado, adiciona a obra a esta lista de favoritos. Esta página também deve oferecer opções de filtragem e ordenação, permitindo que o usuário veja, por exemplo, apenas seus favoritos "Em Andamento" que foram atualizados na última semana.

### 3.3. Página "Upload"

**Função:** Uma ferramenta assistida (wizard) para que usuários possam criar seus próprios arquivos hub.json ou reader.json de forma estruturada, sem precisar escrever o JSON manualmente. Isso democratiza a criação de conteúdo.

**Lógica:** O usuário será guiado por um formulário passo a passo:
- **Passo 1:** Detalhes do Hub (título, descrição)
- **Passo 2:** Adicionar Obras (título da obra, link da capa, link para o reader.json)

O wizard montará o JSON em tempo real no plano de fundo. Para o reader.json, o formulário permitiria adicionar capítulos um a um, e para cada capítulo, colar uma lista de links de imagens, que a ferramenta formataria corretamente no array groups.

**Validação Crítica:** Antes de salvar o arquivo no Remote Storage, o sistema deve validar rigorosamente a estrutura do JSON gerado. A validação deve ser específica, verificando campos obrigatórios, tipos de dados (ex: rating deve ser um número) e formatos de URL. O feedback ao usuário deve ser específico (ex: "O link da capa na Obra X parece ser inválido") em vez de um genérico "Erro de validação".

## 4. Regras Técnicas e de Design

### 4.1. Remote Storage

**Portão de Acesso:** É o componente que habilita a personalização e persistência de dados. A interface deve ser projetada com o princípio de "melhoria progressiva". A aplicação principal funciona perfeitamente sem ele.

**Controle de Visibilidade:** A conexão com o Remote Storage controla a renderização das páginas "Biblioteca", "Obras", "Upload" e das funcionalidades de favoritar e salvar hubs. A interface deve se adaptar de forma fluida: em vez de mostrar um erro de "desconectado", os elementos que dependem do armazenamento simplesmente não são renderizados.

### 4.2. Identidade Visual (CSS)

A consistência visual é fundamental e deve seguir a paleta de cores definida para criar uma identidade forte e coesa:

- **70% - Fundo Principal:** `#141414` (cor de base para o corpo da aplicação, fundos de página, áreas de conteúdo principal). Esta cor escura é ideal para reduzir a fadiga ocular durante longas sessões de leitura.

- **20% - Destaque:** `#341111` (usado para elementos que exigem atenção: a barra de navegação principal, botões primários, o estado :hover de cards e links, e bordas ativas). Este tom de vermelho escuro é enérgico, mas sóbrio, evitando ser distrativo.

- **10% - Suporte/Texto:** `#a4a4a4` (usado para todo o texto de parágrafo padrão, descrições, metadados como datas de capítulo e contagem de votos, e ícones não interativos). Este cinza claro oferece excelente legibilidade contra o fundo escuro sem o contraste forte do branco puro.

### 4.3. Permissões e Restrições de Desenvolvimento

#### PERMITIDO:

**Ler e Adaptar hub.json:** É obrigatório explorar a riqueza do hub.json para criar uma interface visualmente atraente. O desenvolvedor tem liberdade para usar todos os campos disponíveis (tags, status, featured, latest) para criar filtros, badges, seções de destaque e outros elementos de UX.

**Customizar CSS e Páginas:** Total liberdade para estilizar os componentes e páginas, desde que as regras de negócio, a paleta de cores e os princípios de usabilidade sejam respeitados.

#### NÃO PERMITIDO:

**Alterar reader.json:** A estrutura deste arquivo é um padrão fixo. A lógica de renderização da "Página da Obra" e do leitor deve ser construída para consumir este formato específico. Alterá-lo resultaria na fragmentação do ecossistema, tornando a aplicação incompatível com arquivos existentes e quebrando a promessa de um leitor universal.

A imutabilidade garante a compatibilidade retroativa e futura. Pense nisso como um navegador web: ele pode renderizar qualquer página porque o HTML é um padrão. O Gikamoe pode ler qualquer obra porque o reader.json é o seu padrão.

## 5. Observações Finais e Contexto

### Contexto dos Arquivos de Exemplo:

- **Utoon:** Mencionado no reader.json como a plataforma de publicação original, é uma plataforma de webtoons.
- **Ssireum:** Aparece como título de um capítulo ("Cap 006 - Ssireum") e se refere a um esporte de luta coreano.

Entender esses contextos, mesmo que a aplicação seja neutra, ajuda a criar uma experiência mais respeitosa e bem informada, mostrando que a plataforma é robusta o suficiente para lidar com uma gama diversificada de conteúdos.

### Documentação e Qualidade de Código

Todas as decisões de arquitetura e mudanças futuras devem ser documentadas em formato Markdown. Dado que o projeto é 100% front-end e de natureza comunitária, um código limpo, bem comentado e modular não é apenas uma boa prática, mas um requisito essencial.

Uma boa documentação (explicando a arquitetura, o fluxo de dados e como adicionar novas funcionalidades) e um código legível são fundamentais para atrair outros desenvolvedores para contribuir, garantindo a saúde e a evolução do projeto a longo prazo. Um projeto bem documentado é um projeto vivo.