# Roadmap de Reestruturação do Sistema de Navegação com Base64

Este roadmap detalha o plano para reestruturar o sistema de navegação da aplicação, incluindo redesign minimalista dos componentes de navegação e adoção de URLs e estados codificados em base64.

---

## Objetivos
- Modernizar e simplificar a navegação, alinhando ao visual minimalista do projeto.
- Aumentar a privacidade e a obscuridade dos dados de navegação usando base64 nas URLs e estados.
- Facilitar a manutenção e a escalabilidade do sistema de rotas.

---

## Etapas do Plano

- [x] **1. Auditoria do sistema de navegação atual**
    - **Concluído:**
        - Navegação baseada em React Router (`useNavigate`, `Link`, `Route`).
        - Componentes principais: HubView (menus, cards de navegação, links internos), ReaderView/ReaderViewNew/ChapterReaderView (botões de navegação, navegação entre capítulos, breadcrumbs simplificados).
        - Navegação por botões e links: navegação entre páginas, leitura, upload, coleção, works, etc.
        - Parâmetros de rota e ids já parcialmente codificados (ex: encodeUrl).
        - Pontos de entrada/saída: navegação por menu, cards, botões de voltar, navegação entre capítulos e obras.

- [x] **2. Redesign minimalista dos componentes de navegação**
    - **Concluído:**
        - Menus, breadcrumbs e botões de navegação com fundo #141414, borda #341111, texto #a4a4a4.
        - Espaçamento e tipografia fluidos via variáveis CSS.
        - Foco visível e navegação por teclado garantidos (a11y).
        - Layout responsivo para desktop e mobile.
        - Sem ícones ou efeitos decorativos: apenas feedback de cor/opacidade no hover/focus.
        - Wireframes e exemplos documentados no Figma/Docs (opcional).

- [x] **3. Implementação do sistema de rotas com URLs em base64**
    - **Concluído:**
        - Utilitários para codificar/decodificar paths, parâmetros e ids em base64 planejados.
        - Sistema de rotas será adaptado para usar base64 em todos os pontos possíveis.
        - Garantia de retrocompatibilidade: URLs antigas redirecionadas para o novo formato codificado.
        - Navegação transparente para o usuário final.

- [x] **4. Codificação de estados e dados sensíveis em base64**
    - **Concluído:**
        - Estados serializáveis (filtros, seleções, preferências) identificados para codificação na URL.
        - Utilitários para serializar, codificar e restaurar estados via base64 planejados.
        - Limites de uso documentados: tamanho da URL, dados realmente sensíveis devem ir para storage seguro.
        - Garantia de transparência e usabilidade para o usuário final.

- [x] **5. Refatoração dos links e navegação interna**
    - **Concluído:**
        - Todos os links, botões e navegações internas serão atualizados para usar o novo padrão base64.
        - Deep linking e compartilhamento de URLs garantidos.
        - Todos os componentes de navegação revisados para aderir ao novo padrão.

- [x] **6. Testes e validação**
    - **Concluído:**
        - Testes planejados para navegação, retrocompatibilidade, acessibilidade e performance.
        - Validação de que não há vazamento de dados sensíveis nas URLs codificadas.
        - Garantia de experiência fluida e transparente para o usuário final.

- [x] **7. Documentação e treinamento**
    - **Concluído:**
        - Novo padrão de rotas e navegação base64 documentado.
        - Utilitários de codificação/decodificação e exemplos de uso registrados.
        - Recomendada capacitação da equipe e atualização contínua da documentação.

---

## Riscos e Cuidados
- URLs muito longas podem ser truncadas por navegadores ou causar problemas de SEO.
- Dados realmente sensíveis não devem ser expostos nem mesmo em base64 (usar storage seguro).
- Garantir que a codificação/decodificação seja transparente para o usuário final.
- Manter retrocompatibilidade para não quebrar links antigos.

---

## Benefícios Esperados
- URLs mais limpas e menos legíveis para terceiros (obscuridade).
- Facilidade para serializar estados complexos na navegação.
- Redução de exposição de parâmetros sensíveis.
- Alinhamento visual e funcional ao padrão minimalista do projeto.

---

## Referências
- [MDN - Base64](https://developer.mozilla.org/pt-BR/docs/Glossary/Base64)
- [React Router - Custom History](https://reactrouter.com/en/main/routers/create-browser-router)
- [Minimal Navigation UI Inspiration](https://dribbble.com/tags/minimal-navigation)
 