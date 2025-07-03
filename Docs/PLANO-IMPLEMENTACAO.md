# 🚀 Plano de Implementação - Gikamoe App


## Anchor comments  

Add specially formatted comments throughout the codebase, where appropriate, for yourself as inline knowledge that can be easily `grep`ped for.  

### Guidelines:  

- Use `AIDEV-NOTE:`, `AIDEV-TODO:`, or `AIDEV-QUESTION:` (all-caps prefix) for comments aimed at AI and developers.  
- Keep them concise (≤ 120 chars).  
- **Important:** Before scanning files, always first try to **locate existing anchors** `AIDEV-*` in relevant subdirectories.  
- **Update relevant anchors** when modifying associated code.  
- **Do not remove `AIDEV-NOTE`s** without explicit human instruction.  

Example:  
# AIDEV-NOTE: perf-hot-path; avoid extra allocations (see ADR-24)  
async def render_feed(...):  
    ...


## 📊 Status Atual
- ✅ RemoteStorage configurado e funcionando
- ✅ Contextos (AppContext, RemoteStorageContext) implementados
- ✅ Estrutura FSD (Feature-Sliced Design) configurada
- ✅ Roteamento básico configurado
- ✅ Diagnóstico de rede funcionando
- ⚠️ **Pendente**: Interface visual e funcionalidades

## 🎯 Objetivos Principais

### 1. Interface de Usuário (UI/UX)
- Implementar design system moderno e responsivo
- Criar componentes visuais funcionais
- Aplicar tema dark/light
- Implementar animações e transições

### 2. Funcionalidades Core
- Sistema de navegação entre páginas
- Leitor de mangás/capítulos
- Sistema de upload
- Gerenciamento de coleções
- Hub de conteúdo

### 3. Integração de Dados
- Conectar RemoteStorage às funcionalidades
- Implementar persistência local
- Sistema de sincronização

---

## 📋 Fases de Implementação

### 🎨 **FASE 1: Design System & Layout Base** (Prioridade Alta)

#### 1.1 Design Tokens & Tema
- [ ] Configurar design tokens (cores, tipografia, espaçamentos)
- [ ] Implementar tema dark/light switch
- [ ] Criar variáveis CSS customizadas
- [ ] Definir breakpoints responsivos

**Arquivos:**
- `src-new/shared/styles/tokens.css`
- `src-new/shared/styles/themes.css`
- `src-new/shared/ui/ThemeProvider/`

#### 1.2 Componentes Base UI
- [ ] Button (variantes: primary, secondary, ghost)
- [ ] Input/Form components
- [ ] Modal/Dialog
- [ ] Loading/Spinner
- [ ] Toast/Notification system
- [ ] Icon system

**Arquivos:**
- `src-new/shared/ui/Button/`
- `src-new/shared/ui/Input/`
- `src-new/shared/ui/Modal/`
- `src-new/shared/ui/Loading/`
- `src-new/shared/ui/Toast/`

#### 1.3 Layout Principal
- [ ] Header/Navigation responsiva
- [ ] Sidebar (para desktop)
- [ ] Footer
- [ ] Container principal
- [ ] Grid system

**Arquivos:**
- `src-new/widgets/navigation/ui/Navigation.jsx`
- `src-new/widgets/layout/ui/Header.jsx`
- `src-new/widgets/layout/ui/Sidebar.jsx`

---

### 🏠 **FASE 2: Páginas Principais** (Prioridade Alta)

#### 2.1 Home/Dashboard
- [ ] Layout da página inicial
- [ ] Cards de resumo (estatísticas)
- [ ] Lista de itens recentes
- [ ] Ações rápidas

**Arquivos:**
- `src-new/pages/dashboard/ui/DashboardPage.jsx`
- `src-new/widgets/dashboard/ui/StatsCards.jsx`
- `src-new/widgets/dashboard/ui/RecentItems.jsx`

#### 2.2 Hub View
- [ ] Grid de itens/séries
- [ ] Filtros e busca
- [ ] Paginação
- [ ] Cards de preview

**Arquivos:**
- `src-new/pages/hub/ui/HubPage.jsx`
- `src-new/features/hub/ui/ItemGrid.jsx`
- `src-new/features/hub/ui/FilterBar.jsx`

#### 2.3 Reader View
- [ ] Interface de leitura
- [ ] Controles de navegação
- [ ] Settings do leitor
- [ ] Fullscreen mode

**Arquivos:**
- `src-new/pages/reader/ui/ReaderPage.jsx`
- `src-new/features/reader/ui/ReaderControls.jsx`
- `src-new/features/reader/ui/ReaderSettings.jsx`

---

### 📚 **FASE 3: Features Avançadas** (Prioridade Média)

#### 3.1 Sistema de Upload
- [ ] Drag & drop interface
- [ ] Progress indicator
- [ ] File validation
- [ ] Batch upload

**Arquivos:**
- `src-new/pages/upload/ui/UploadPage.jsx`
- `src-new/features/upload/ui/DropZone.jsx`
- `src-new/features/upload/ui/UploadProgress.jsx`

#### 3.2 Collections Management
- [ ] Lista de coleções
- [ ] CRUD de coleções
- [ ] Organização por tags
- [ ] Favoritos

**Arquivos:**
- `src-new/pages/collection/ui/CollectionPage.jsx`
- `src-new/features/collection/ui/CollectionList.jsx`
- `src-new/features/collection/ui/CollectionForm.jsx`

#### 3.3 Series Detail
- [ ] Página de detalhes da série
- [ ] Lista de capítulos
- [ ] Metadados e informações
- [ ] Ações (bookmark, favoritar)

**Arquivos:**
- `src-new/pages/series-detail/ui/SeriesDetailPage.jsx`
- `src-new/features/series/ui/ChapterList.jsx`
- `src-new/features/series/ui/SeriesInfo.jsx`

---

### 🔌 **FASE 4: Integração de Dados** (Prioridade Média)

#### 4.1 API Integration
- [ ] Conectar endpoints existentes
- [ ] Error handling
- [ ] Loading states
- [ ] Cache management

**Arquivos:**
- `src-new/shared/api/hooks/`
- `src-new/shared/api/queries/`

#### 4.2 RemoteStorage Integration
- [ ] Sync automático
- [ ] Conflict resolution
- [ ] Offline support
- [ ] Progress tracking

**Arquivos:**
- `src-new/features/remote-storage/`

---

### ⚡ **FASE 5: Performance & UX** (Prioridade Baixa)

#### 5.1 Otimizações
- [ ] Lazy loading
- [ ] Virtual scrolling
- [ ] Image optimization
- [ ] Bundle splitting

#### 5.2 PWA Features
- [ ] Service Worker
- [ ] Offline caching
- [ ] Install prompt
- [ ] Background sync

---

## 🛠️ Implementação Recomendada

### Semana 1: Design System Base
1. Setup de design tokens
2. Componentes UI básicos
3. Layout principal

### Semana 2: Páginas Core
1. Dashboard/Home
2. Hub View básico
3. Reader View básico

### Semana 3: Features
1. Upload system
2. Collections
3. Series detail

### Semana 4: Integração & Polish
1. Conectar dados
2. Testes
3. Otimizações

---

## 📁 Estrutura de Arquivos Sugerida

```
src-new/
├── shared/
│   ├── ui/           # Componentes base reutilizáveis
│   ├── styles/       # Tokens, temas, utilitários CSS
│   ├── lib/          # Utilities, helpers
│   └── config/       # Configurações globais
├── entities/
│   ├── item/         # Entidade Item (modelo, hooks)
│   └── series/       # Entidade Series
├── features/
│   ├── hub/          # Feature Hub
│   ├── reader/       # Feature Reader
│   ├── upload/       # Feature Upload
│   └── collection/   # Feature Collections
├── widgets/
│   ├── navigation/   # Widget de navegação
│   ├── dashboard/    # Widgets do dashboard
│   └── layout/       # Widgets de layout
└── pages/
    ├── dashboard/    # Página inicial
    ├── hub/          # Página do hub
    ├── reader/       # Página do leitor
    └── upload/       # Página de upload
```

---

## 🚀 Próximos Passos Imediatos

1. **Começar com Design Tokens** - Criar sistema de cores e tipografia
2. **Implementar Navigation Widget** - Fazer o menu funcionar
3. **Criar Dashboard básico** - Primeira página funcional
4. **Setup de roteamento** - Conectar as páginas

---

## 📝 Notas Importantes

- Manter compatibilidade com estrutura existente em `src/`
- Usar React Query para gerenciamento de estado
- Implementar TypeScript gradualmente se necessário
- Focar em mobile-first design
- Usar CSS Modules ou Styled Components conforme preferência
- Implementar testes unitários conforme desenvolvimento

---

*Documento criado em: 03/07/2025*
*Status: Em planejamento*
