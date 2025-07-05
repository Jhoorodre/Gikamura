import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props 
}, ref) => {
  // AIDEV-NOTE: Button variants with semantic styling
  const variants = {
    primary: 'bg-primary text-inverse hover:bg-accent hover:text-inverse',
    secondary: 'bg-surface text-accent border border-border hover:bg-primary hover:text-inverse',
    ghost: 'bg-transparent text-accent hover:bg-surface',
    danger: 'bg-error text-inverse hover:bg-red-600',
    success: 'bg-success text-inverse hover:bg-green-600'
  };

  // AIDEV-NOTE: Size variants for consistent proportions
  const sizes = {
    sm: 'px-sm py-xs text-sm rounded-md',
    md: 'px-md py-sm text-base rounded-lg',
    lg: 'px-lg py-md text-lg rounded-xl'
  };

  // AIDEV-NOTE: Loading state styling
  const loadingClasses = loading ? 'opacity-75 cursor-not-allowed' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        button
        ${variants[variant]}
        ${sizes[size]}
        ${loadingClasses}
        ${disabledClasses}
        ${className}
        inline-flex items-center justify-center
        font-medium
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:pointer-events-none
        shadow-sm
      `}
      {...props}
    >
      {/* AIDEV-NOTE: Loading spinner */}
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}

      {/* AIDEV-NOTE: Icon positioning */}
      {icon && iconPosition === 'left' && !loading && (
        <span className="mr-xs">{icon}</span>
      )}

      {children}

      {/* AIDEV-NOTE: Icon positioning */}
      {icon && iconPosition === 'right' && !loading && (
        <span className="ml-xs">{icon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
