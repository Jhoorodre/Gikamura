// AIDEV-NOTE: Loading spinner component with design system integration
import { forwardRef } from 'react';

const LoadingSpinner = forwardRef(({ 
  size = 'md',
  variant = 'primary',
  className = '',
  text = '',
  ...props 
}, ref) => {
  // AIDEV-NOTE: Size variants for consistent proportions
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // AIDEV-NOTE: Color variants
  const variants = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error'
  };

  return (
    <div
      ref={ref}
      className={`
        loading-spinner
        flex flex-col items-center justify-center
        ${className}
      `}
      {...props}
    >
      {/* AIDEV-NOTE: Spinner animation */}
      <svg
        className={`
          animate-spin
          ${sizes[size]}
          ${variants[variant]}
        `}
        fill="none"
        viewBox="0 0 24 24"
        aria-label="Carregando..."
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>

      {/* AIDEV-NOTE: Optional loading text */}
      {text && (
        <p className="mt-sm text-sm text-secondary text-center">
          {text}
        </p>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner; 