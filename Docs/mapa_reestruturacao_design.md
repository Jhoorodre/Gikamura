# Mapa de Reestruturação Completa do Design – Gikamoe

> **Paleta obrigatória:**
> - 70%: `#141414` (fundo principal)
> - 20%: `#341111` (destaques, bordas, botões principais)
> - 10%: `#a4a4a4` (texto, ícones, detalhes)

---

## 1. Objetivo
Reformular completamente o design da aplicação, mantendo apenas a paleta de cores acima. O foco é criar uma identidade visual minimalista, moderna, acessível e responsiva, alinhada à proposta do projeto.

---

## 2. Estrutura do Repositório Relacionada ao Design

### a) **Componentes de UI**
- `src/components/common/` – Botões, navegação, modais, ícones, spinner, etc.
- `src/components/hub/` – Cards, cabeçalhos, histórico de hubs.
- `src/components/item/` – Grids, leitores, listas de capítulos.

### b) **Views e Páginas**
- `src/views/` – Estruturas de página (HubView, ReaderView, ItemDetailView, etc).
- `src/pages/` – Rotas principais (CollectionPage, WorksPage, UploadPage, etc).

### c) **Estilos CSS**
- `src/styles/` – Todos os arquivos de estilos globais, utilitários, layouts e específicos de componentes/páginas.
  - `base.css`, `components.css`, `layout.css`, `pages.css`, `reader.css`, `hub-loader.css`, `hub-minimal.css`, `utilities.css`, etc.
  - `tokens.css` – Variáveis de cor, tipografia e espaçamento.

### d) **Assets**
- `src/assets/` – Reservado para imagens, ícones customizados, fontes.
- `public/vite.svg` – Favicon.

---

## 3. Diretrizes Gerais para o Novo Design

### **Paleta de Cores**
- Fundo predominante: `#141414` (70%)
- Elementos de destaque/borda/botão: `#341111` (20%)
- Texto, ícones, detalhes: `#a4a4a4` (10%)
- **Proibido** usar outras cores, gradientes, sombras coloridas ou efeitos decorativos fora da paleta.

### **Tipografia**
- Fonte principal: Inter, fallback sans-serif.
- Títulos: Peso 700+, tamanho fluido com `clamp()`.
- Texto: Peso 400-500, cor sempre `#a4a4a4`.
- Sem itálico, sublinhado ou serifas.

### **Espaçamento e Layout**
- Usar variáveis CSS para espaçamento (`tokens.css`).
- Grid responsivo, com máximo de 1200px para conteúdo principal.
- Margens e paddings generosos para garantir respiro visual.

### **Componentização**
- Todos os elementos visuais devem ser componentes reutilizáveis.
- Botões, cards, modais, inputs, etc, devem seguir o mesmo padrão visual.

### **Acessibilidade**
- Contraste mínimo AA garantido entre texto e fundo.
- Foco visível em todos os elementos interativos.
- Navegação por teclado em todos os menus e formulários.

### **Responsividade**
- Layouts adaptáveis para mobile, tablet e desktop.
- Fontes e espaçamentos fluidos.
- Menus colapsáveis e navegação simplificada em telas pequenas.

---

## 4. Recomendações por Arquivo/Pasta

### **src/components/common/**
- **Button.jsx**: Redesenhar para fundo `#341111`, texto `#a4a4a4`, borda arredondada, sem sombra.
- **Navigation.jsx**: Menu lateral ou topo, fundo `#141414`, item ativo com borda ou fundo `#341111`.
- **Modais (ConfirmModal, ErrorBoundary, etc)**: Fundo `#141414`, borda `#341111`, texto centralizado `#a4a4a4`.
- **Ícones (Icones.jsx)**: Todos em `#a4a4a4`, tamanho adaptável.
- **Spinner.jsx**: Minimalista, apenas traço em `#a4a4a4`.

### **src/components/hub/**
- **Cards**: Fundo `#141414`, borda ou sombra sutil `#341111`, títulos e descrições em `#a4a4a4`.
- **Histórico**: Listagem compacta, hover com leve destaque `#341111`.

### **src/components/item/**
- **Grids**: Espaçamento generoso, fundo dos cards `#141414`, borda `#341111`.
- **Leitor**: Barra de navegação fixa, fundo `#141414`, botões de navegação em `#341111`.

### **src/views/**
- **HubView, ReaderView, ItemDetailView**: Layout centralizado, máximo 1200px, fundo sempre `#141414`.
- **Capítulos**: Lista com destaque para capítulo atual em `#341111`.

### **src/pages/**
- **CollectionPage, WorksPage, UploadPage**: Seguir padrão de layout, cards e botões conforme acima.

### **src/styles/**
- **base.css**: Reset, variáveis de cor, tipografia, espaçamento.
- **components.css**: Estilos globais para botões, cards, inputs, badges.
- **layout.css**: Grid, containers, responsividade.
- **pages.css**: Estilos específicos de cada página.
- **tokens.css**: Definir as três cores principais e variáveis para espaçamento/tipografia.
- **utilities.css**: Utilitários de cor, espaçamento, visibilidade, etc.
- **Remover** gradientes, sombras coloridas, bordas multicoloridas, etc.

---

## 5. Exemplos de Aplicação da Paleta

```css
:root {
  --color-background: #141414;
  --color-accent: #341111;
  --color-text-primary: #a4a4a4;
  --color-border: #341111;
}

body {
  background: var(--color-background);
  color: var(--color-text-primary);
  font-family: 'Inter', sans-serif;
}

.button {
  background: var(--color-accent);
  color: var(--color-text-primary);
  border-radius: 0.5rem;
  border: none;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
}

.card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  border-radius: 1rem;
  padding: 1.5rem;
}
```

---

## 6. Passos para a Reestruturação
1. **Auditar todos os componentes e páginas** para remover estilos antigos e garantir uso exclusivo da paleta.
2. **Atualizar tokens e variáveis CSS** em `tokens.css`.
3. **Refatorar componentes** para seguir o novo padrão visual.
4. **Testar responsividade e acessibilidade** em todas as telas.
5. **Documentar exemplos de uso e padrões visuais** neste arquivo e em comentários nos CSS/JSX.

---

## 7. Referências e Inspiração
- [Minimal UI Design](https://dribbble.com/tags/minimal-ui)
- [Acessibilidade Web (W3C)](https://www.w3.org/WAI/test-evaluate/)
- [Design Tokens](https://design-tokens.github.io/community-group/format/)

---

**Este documento deve ser seguido por todos os desenvolvedores e atualizado a cada evolução do design!** 