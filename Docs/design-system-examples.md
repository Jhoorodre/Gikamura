# Exemplos de Uso - Sistema de Design Refatorado

## 🎨 Exemplos Práticos do Sistema de Design

### 1. Card Básico

```jsx
function BasicCard({ title, content }) {
  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-primary mb-3">{title}</h3>
      <p className="text-secondary leading-relaxed">{content}</p>
    </div>
  );
}
```

### 2. Card com Glass Effect

```jsx
function GlassCard({ children }) {
  return (
    <div className="glass-card interactive">
      {children}
    </div>
  );
}
```

### 3. Botões Modernos

```jsx
function ModernButtons() {
  return (
    <div className="flex gap-4">
      <button className="btn btn-primary">
        Ação Principal
      </button>
      <button className="btn btn-secondary">
        Ação Secundária
      </button>
      <button className="btn btn-outline">
        Ação Terciária
      </button>
    </div>
  );
}
```

### 4. Layout Responsivo com Grid

```jsx
function ResponsiveGrid({ items }) {
  return (
    <div className="container">
      <div className="grid-auto-fill">
        {items.map(item => (
          <div key={item.id} className="card interactive">
            <h3 className="text-lg font-semibold mb-3">{item.title}</h3>
            <p className="text-secondary">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Modal com Backdrop Blur

```jsx
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  
  return (
    <div className={`modal-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Título do Modal</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
```

### 6. Navegação com Estados

```jsx
function Navigation({ items, activeItem }) {
  return (
    <nav className="nav-horizontal">
      {items.map(item => (
        <a 
          key={item.id}
          href={item.href}
          className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
```

### 7. Formulário com Estados

```jsx
function ModernForm() {
  return (
    <form className="stack">
      <div className="form-group">
        <label className="form-label">Email</label>
        <input 
          type="email" 
          className="form-input" 
          placeholder="seu@email.com"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Senha</label>
        <input 
          type="password" 
          className="form-input"
          placeholder="••••••••"
        />
        <small className="form-help">Mínimo 8 caracteres</small>
      </div>
      
      <button type="submit" className="btn btn-primary">
        Entrar
      </button>
    </form>
  );
}
```

### 8. Loading States

```jsx
function LoadingCard() {
  return (
    <div className="card">
      <div className="skeleton skeleton-text large mb-3"></div>
      <div className="skeleton skeleton-text mb-2"></div>
      <div className="skeleton skeleton-text mb-4"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="center-flex p-8">
      <div className="loading-spinner"></div>
    </div>
  );
}
```

### 9. Badges e Tags

```jsx
function StatusBadges({ status }) {
  const badgeClass = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-accent'
  }[status] || 'badge';
  
  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
}
```

### 10. Tooltip

```jsx
function TooltipExample() {
  return (
    <div className="tooltip">
      <button className="btn btn-primary">
        Hover me
      </button>
      <div className="tooltip-content">
        Esta é uma dica útil!
      </div>
    </div>
  );
}
```

### 11. Breadcrumbs

```jsx
function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumb">
      {items.map((item, index) => (
        <span key={item.id}>
          <a 
            href={item.href}
            className={`breadcrumb-item ${index === items.length - 1 ? 'active' : ''}`}
          >
            {item.label}
          </a>
          {index < items.length - 1 && (
            <span className="breadcrumb-separator">•</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

### 12. Cards de Estado

```jsx
function StateCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="success-card">
        <h4 className="font-semibold mb-2">Sucesso!</h4>
        <p>Operação realizada com sucesso.</p>
      </div>
      
      <div className="warning-card">
        <h4 className="font-semibold mb-2">Atenção</h4>
        <p>Verifique os dados antes de continuar.</p>
      </div>
      
      <div className="error-card">
        <h4 className="font-semibold mb-2">Erro</h4>
        <p>Algo deu errado. Tente novamente.</p>
      </div>
      
      <div className="info-card">
        <h4 className="font-semibold mb-2">Informação</h4>
        <p>Dados foram atualizados.</p>
      </div>
    </div>
  );
}
```

### 13. Layout de Cluster (Flexbox)

```jsx
function ClusterLayout({ items }) {
  return (
    <div className="cluster">
      {items.map(item => (
        <button key={item.id} className="btn btn-secondary">
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

### 14. Layout de Stack (Vertical)

```jsx
function StackLayout({ children }) {
  return (
    <div className="stack-lg">
      {children}
    </div>
  );
}
```

### 15. Efeito Ripple

```jsx
function RippleButton({ children, ...props }) {
  return (
    <button className="btn btn-primary ripple" {...props}>
      {children}
    </button>
  );
}
```

## 🎯 Padrões de Composição

### Layout Principal da Aplicação

```jsx
function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-primary">
      <header className="bg-surface border-b border-primary p-4">
        <div className="container flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">Gikamoe</h1>
          <nav className="nav-horizontal">
            {/* navegação */}
          </nav>
        </div>
      </header>
      
      <main className="container py-8">
        {children}
      </main>
      
      <footer className="bg-surface border-t border-primary p-6 mt-auto">
        <div className="container text-center text-secondary">
          © 2025 Gikamoe. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
```

### Página com Sidebar

```jsx
function SidebarLayout({ children }) {
  return (
    <div className="container">
      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="card sticky top-4">
            {/* conteúdo da sidebar */}
          </div>
        </aside>
        
        <main className="lg:col-span-3">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Grid de Cards Responsivo

```jsx
function ResponsiveCardGrid({ items }) {
  return (
    <div className="card-grid">
      {items.map(item => (
        <article key={item.id} className="card interactive">
          <img 
            src={item.image} 
            alt={item.title}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
          <p className="text-secondary text-sm mb-4">{item.description}</p>
          <div className="flex items-center justify-between">
            <span className="badge badge-accent">{item.category}</span>
            <button className="btn btn-primary">Ver mais</button>
          </div>
        </article>
      ))}
    </div>
  );
}
```

## 🚀 Vantagens das Classes Utilitárias

1. **Rapidez**: Desenvolvimento mais rápido sem escrever CSS customizado
2. **Consistência**: Todas as classes seguem o sistema de tokens
3. **Responsividade**: Prefixos responsivos (`sm:`, `md:`, `lg:`, `xl:`)
4. **Estados**: Classes para hover, focus, active (`hover:`, `focus:`)
5. **Combinação**: Fácil combinação para criar layouts complexos
6. **Manutenibilidade**: Mudanças nos tokens afetam todas as classes

## 📱 Exemplo de Responsividade

```jsx
function ResponsiveComponent() {
  return (
    <div className="
      p-4 sm:p-6 lg:p-8
      text-sm sm:text-base lg:text-lg
      grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
      gap-4 sm:gap-6 lg:gap-8
    ">
      {/* conteúdo responsivo */}
    </div>
  );
}
```

Este sistema fornece todas as ferramentas necessárias para criar interfaces modernas, consistentes e responsivas, mantendo a identidade visual do projeto alinhada com a paleta obrigatória do roadmap. Projeto utilizando Feature-Sliced Design.
