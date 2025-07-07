import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import PageTransition from './PageTransition';

// AIDEV-NOTE: Simplified layout without complex transition logic to prevent flickering

const MainLayout = () => {
  const location = useLocation();

  // O header não deve aparecer nas páginas de leitura para uma experiência imersiva.
  const isReadingPage = location.pathname.startsWith('/read') || location.pathname.startsWith('/reader');

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