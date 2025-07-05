// AIDEV-NOTE: Base layout component with design system integration
import { forwardRef } from 'react';
import Header from './Header';

const Layout = forwardRef(({ 
  children, 
  className = '',
  showHeader = true,
  container = true,
  maxWidth = 'lg',
  padding = 'md',
  ...props 
}, ref) => {
  // AIDEV-NOTE: Container max-width variants
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  };

  // AIDEV-NOTE: Padding variants
  const paddingClasses = {
    none: '',
    sm: 'px-sm py-sm',
    md: 'px-md py-md',
    lg: 'px-lg py-lg',
    xl: 'px-xl py-xl'
  };

  return (
    <div
      ref={ref}
      className={`
        layout
        min-h-screen
        bg-background
        text-primary
        transition-all
        duration-300
        ${className}
      `}
      {...props}
    >
      {/* AIDEV-NOTE: Header with theme support */}
      {showHeader && <Header />}

      {/* AIDEV-NOTE: Main content area */}
      <main className="flex-1">
        {container ? (
          <div className={`
            container
            mx-auto
            ${maxWidthClasses[maxWidth]}
            ${paddingClasses[padding]}
          `}>
            {children}
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout; 