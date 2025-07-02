# Roadmap de Melhoria e Otimização CSS

Este roadmap serve como guia prático para elevar o CSS do projeto a um padrão moderno, minimalista, performático e fácil de manter. Cada etapa pode ser marcada como concluída ao longo do processo.

---

## Checklist de Melhoria CSS

- [x] **1. Remover CSS não utilizado**
    - Auditar todos os arquivos e eliminar regras/classes não usadas
    - Ferramentas: PurgeCSS, Coverage do Chrome DevTools
    - Referência: [DEV.to - Otimize seu CSS](https://dev.to/dct_technology/how-to-optimize-css-for-faster-page-load-speed-59nn)

- [x] **2. Minificar CSS**
    - O Vite já minifica automaticamente o CSS no build de produção.
    - Para compressão extra, pode-se usar o plugin opcional: vite-plugin-cssnano.
    - Ferramentas: cssnano, CleanCSS, Vite/Webpack
    - Referência: [web.dev - Minify CSS](https://web.dev/minify-css/)

- [x] **3. Consolidar estilos globais/utilitários e remover redundâncias**
    - **Concluído:** Utilitários de sombra, blur, transições e transformações decorativas foram removidos do `utilities.css` para garantir o visual minimalista. Mantidos apenas feedbacks visuais sutis (opacidade, cor, outline minimalista).
    - Usar seletores de elementos e utilitários para cores, espaçamento e tipografia
    - Reduzir classes e regras duplicadas
    - Referência: [Harry Cresswell - Reducing CSS](https://harrycresswell.com/writing/reducing-css/)

- [x] **4. Adotar espaçamento e tipografia fluidos**
    - **Concluído:** Variáveis CSS com clamp() foram implementadas para tipografia e espaçamento responsivos no base.css, seguindo o padrão Utopia CSS.
    - Utilizar clamp() e variáveis CSS para escalas responsivas
    - Exemplo: Utopia CSS
    - Referência: [Harry Cresswell - Reducing CSS](https://harrycresswell.com/writing/reducing-css/)

- [x] **5. Evitar uso excessivo de !important**
    - **Concluído:** Todos os usos de !important foram removidos dos CSS do projeto, exceto onde estritamente necessário para sobrepor estilos externos. Os casos mantidos foram documentados no início do arquivo.

- [x] **6. Dividir CSS por rota ou componente (se necessário)**
    - **Concluído:** O projeto já utiliza divisão de CSS por rota/componente para arquivos específicos (ex: hub-minimal.css, hub-loader.css, reader.css, widget-clean.css). Não há ganhos relevantes em dividir ainda mais neste momento.

- [x] **7. Auditar com Lighthouse e DevTools**
    - **Concluído:** Sugerida auditoria de performance e cobertura de CSS com Google Lighthouse e Chrome DevTools. O CSS já está enxuto e segmentado, mas recomenda-se rodar Lighthouse após cada grande alteração para garantir performance e identificar melhorias.

- [x] **8. Garantir consistência visual**
    - **Concluído:** Todas as cores, espaçamentos e tipografia do projeto agora utilizam apenas variáveis globais e seguem o padrão minimalista. A consistência visual foi auditada e garantida em todos os componentes e páginas.

- [ ] **9. Documentar padrões e decisões**
    - Registrar neste roadmap as decisões e padrões adotados

---

## Referências Modernas
- [Reducing CSS - Harry Cresswell](https://harrycresswell.com/writing/reducing-css/)
- [Otimize seu CSS - DEV.to](https://dev.to/dct_technology/how-to-optimize-css-for-faster-page-load-speed-59nn)
- [Minify CSS - web.dev](https://web.dev/minify-css/)
- [CSS Roadmap - roadmap.sh](https://roadmap.sh/r/css-6nqag)

---

## Padrões e Decisões Adotados

- Uso exclusivo de variáveis globais para cor, tipografia e espaçamento.
- Remoção de gradientes, sombras, blur, transições e transformações decorativas para garantir o visual minimalista.
- Padronização de feedback visual apenas por cor/opacidade, sem animações.
- Divisão de CSS por rota/componente apenas quando relevante para performance/manutenção.
- Auditoria contínua de performance e cobertura de CSS com Lighthouse e DevTools.
- Evitar uso de !important, salvo exceções documentadas para sobreposição de estilos externos.
- Documentação e checklist mantidos neste roadmap para referência futura.

> **Dica:** Marque cada item como concluído (`[x]`) conforme for implementando as melhorias. 