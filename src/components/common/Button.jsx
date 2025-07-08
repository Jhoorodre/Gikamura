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
    primary: 'btn--primary',
    secondary: 'btn--secondary', 
    ghost: 'btn--ghost',
    danger: 'btn--destructive',
    success: 'btn--success'
  };

  // AIDEV-NOTE: Size variants for consistent proportions
  const sizes = {
    sm: 'btn--sm',
    md: '', // Default size
    lg: 'btn--lg'
  };

  // AIDEV-NOTE: Loading state styling
  const loadingClasses = loading ? 'opacity-75 cursor-not-allowed' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        btn
        ${variants[variant]}
        ${sizes[size]}
        ${loadingClasses}
        ${disabledClasses}
        ${className}
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
        <span className="btn__icon btn__icon--start">{icon}</span>
      )}

      {children}

      {/* AIDEV-NOTE: Icon positioning */}
      {icon && iconPosition === 'right' && !loading && (
        <span className="btn__icon btn__icon--end">{icon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
