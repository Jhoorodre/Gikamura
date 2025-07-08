import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import PageTransition from './PageTransition';

// AIDEV-NOTE: Simplified layout without complex transition logic to prevent flickering

const MainLayout = () => {
  const location = useLocation();

  // AIDEV-NOTE: O header não deve aparecer nas páginas de leitura para uma experiência imersiva.
  // Corrigido para detectar corretamente as páginas de leitura baseado nas rotas definidas
  const isReadingPage = location.pathname.startsWith('/reader/') || 
                       location.pathname.startsWith('/leitor/') ||
                       location.pathname.includes('/reader/') ||
                       location.pathname.includes('/leitor/');

  return (
    <div className="app-layout">
      {!isReadingPage && <Header />}
      <main className="main-content content-container">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
};

export default MainLayout; 