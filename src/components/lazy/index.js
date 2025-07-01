import { lazy } from 'react';

// Lazy loading dos componentes de páginas
export const LazyHubView = lazy(() => import('../views/HubView'));
export const LazyItemDetailView = lazy(() => import('../views/ItemDetailView'));
export const LazyReaderView = lazy(() => import('../views/ReaderView'));
export const LazyLibraryPage = lazy(() => import('../pages/LibraryPage'));
export const LazyRedirectPage = lazy(() => import('../pages/RedirectPage'));
export const LazyHubLoaderPage = lazy(() => import('../pages/HubLoaderPage'));

// Lazy loading dos componentes grandes
export const LazyItemViewer = lazy(() => import('../components/item/ItemViewer'));
export const LazyHubLoader = lazy(() => import('../components/hub/HubLoaderComponent'));

// Função para preload de componentes importantes
export const preloadComponents = () => {
  // Preload dos componentes mais usados
  import('../views/HubView');
  import('../components/item/ItemViewer');
  import('../pages/LibraryPage');
};

// HOC para adicionar loading boundaries
export const withLoadingBoundary = (Component, fallback = null) => {
  return function WithLoadingBoundaryComponent(props) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
};
