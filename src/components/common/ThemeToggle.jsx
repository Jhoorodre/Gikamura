// AIDEV-NOTE: Theme toggle component with design system integration
import { useState, useEffect } from 'react';

const ThemeToggle = ({ className = '', size = 'md' }) => {
  const [theme, setTheme] = useState('dark');

  // AIDEV-NOTE: Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('gikamura-theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  // AIDEV-NOTE: Toggle theme function with smooth transition
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('gikamura-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // AIDEV-NOTE: Size variants for different use cases
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        theme-toggle
        ${sizeClasses[size]}
        ${className}
        flex items-center justify-center
        rounded-full
        bg-surface
        text-accent
        border border-border
        transition-all duration-300
        hover:bg-primary hover:text-inverse
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        shadow-sm
      `}
      aria-label={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
      title={`Mudar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
    >
      {theme === 'dark' ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;