// AIDEV-NOTE: Example page demonstrating design system components
import Layout from './Layout';
import Card from './Card';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import ThemeToggle from './ThemeToggle';

const ExamplePage = () => {
  return (
    <Layout maxWidth="4xl" padding="lg">
      {/* AIDEV-NOTE: Page header with design system */}
      <div className="mb-xl">
        <h1 className="text-xxl font-bold text-primary mb-sm">
          Sistema de Design - Gikamoe
        </h1>
        <p className="text-lg text-secondary leading-relaxed">
          Exemplo de como usar os componentes base reutilizáveis com proporções harmoniosas.
        </p>
      </div>

      {/* AIDEV-NOTE: Component showcase grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        
        {/* AIDEV-NOTE: Card component examples */}
        <Card variant="default" size="lg" className="space-y-md">
          <h3 className="text-lg font-bold text-primary">Card Padrão</h3>
          <p className="text-secondary leading-normal">
            Card com design system integrado, usando proporções fluidas e espaçamentos consistentes.
          </p>
          <Button variant="primary" size="md">
            Ação Primária
          </Button>
        </Card>

        <Card variant="elevated" size="lg" className="space-y-md">
          <h3 className="text-lg font-bold text-primary">Card Elevado</h3>
          <p className="text-secondary leading-normal">
            Card com sombra para destacar conteúdo importante.
          </p>
          <Button variant="secondary" size="md">
            Ação Secundária
          </Button>
        </Card>

        <Card variant="outlined" size="lg" className="space-y-md">
          <h3 className="text-lg font-bold text-primary">Card Contornado</h3>
          <p className="text-secondary leading-normal">
            Card com borda sutil para conteúdo complementar.
          </p>
          <Button variant="ghost" size="md">
            Ação Fantasma
          </Button>
        </Card>

        {/* AIDEV-NOTE: Button variants showcase */}
        <Card size="lg" className="space-y-md">
          <h3 className="text-lg font-bold text-primary">Variantes de Botão</h3>
          <div className="flex flex-wrap gap-sm">
            <Button variant="primary" size="sm">Primário</Button>
            <Button variant="secondary" size="sm">Secundário</Button>
            <Button variant="ghost" size="sm">Fantasma</Button>
            <Button variant="danger" size="sm">Perigo</Button>
            <Button variant="success" size="sm">Sucesso</Button>
          </div>
        </Card>

        {/* AIDEV-NOTE: Loading states */}
        <Card size="lg" className="space-y-md">
          <h3 className="text-lg font-bold text-primary">Estados de Loading</h3>
          <div className="flex flex-wrap gap-sm items-center">
            <LoadingSpinner size="sm" variant="primary" />
            <LoadingSpinner size="md" variant="secondary" />
            <LoadingSpinner size="lg" variant="accent" text="Carregando..." />
          </div>
        </Card>

        {/* AIDEV-NOTE: Theme toggle showcase */}
        <Card size="lg" className="space-y-md">
          <h3 className="text-lg font-bold text-primary">Toggle de Tema</h3>
          <p className="text-secondary text-sm">
            Mude entre tema claro e escuro com transições suaves.
          </p>
          <div className="flex gap-sm">
            <ThemeToggle size="sm" />
            <ThemeToggle size="md" />
            <ThemeToggle size="lg" />
          </div>
        </Card>

        {/* AIDEV-NOTE: Typography showcase */}
        <Card size="lg" className="space-y-md">
          <h3 className="text-lg font-bold text-primary">Tipografia</h3>
          <div className="space-y-xs">
            <p className="text-xxl font-bold text-primary">Título XXL</p>
            <p className="text-xl font-bold text-primary">Título XL</p>
            <p className="text-lg font-bold text-primary">Título LG</p>
            <p className="text-md font-medium text-primary">Título MD</p>
            <p className="text-base text-secondary">Texto Base</p>
            <p className="text-sm text-tertiary">Texto Pequeno</p>
          </div>
        </Card>

        {/* AIDEV-NOTE: Spacing showcase */}
        <Card size="lg" className="space-y-md">
          <h3 className="text-lg font-bold text-primary">Espaçamentos</h3>
          <div className="space-y-sm">
            <div className="bg-primary p-xxs rounded-sm">
              <span className="text-inverse text-xs">XXS</span>
            </div>
            <div className="bg-primary p-xs rounded-sm">
              <span className="text-inverse text-xs">XS</span>
            </div>
            <div className="bg-primary p-sm rounded-sm">
              <span className="text-inverse text-xs">SM</span>
            </div>
            <div className="bg-primary p-md rounded-sm">
              <span className="text-inverse text-xs">MD</span>
            </div>
            <div className="bg-primary p-lg rounded-sm">
              <span className="text-inverse text-xs">LG</span>
            </div>
          </div>
        </Card>

        {/* AIDEV-NOTE: Interactive card */}
        <Card 
          variant="default" 
          size="lg" 
          interactive 
          className="space-y-md cursor-pointer"
          onClick={() => alert('Card clicável!')}
        >
          <h3 className="text-lg font-bold text-primary">Card Interativo</h3>
          <p className="text-secondary leading-normal">
            Este card é clicável e tem estados de hover e focus para melhor acessibilidade.
          </p>
          <div className="text-sm text-tertiary">
            Clique para testar a interação
          </div>
        </Card>

      </div>

      {/* AIDEV-NOTE: Footer with design system info */}
      <div className="mt-xxl pt-lg border-t border-border">
        <p className="text-sm text-tertiary text-center">
          Sistema de Design Gikamoe - Proporções Harmoniosas e Consistência Visual
        </p>
      </div>
    </Layout>
  );
};

export default ExamplePage; 