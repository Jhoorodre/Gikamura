// AIDEV-NOTE: Base Card component with design system integration
import { forwardRef } from 'react';

const Card = forwardRef(({ 
  children, 
  className = '', 
  variant = 'default',
  size = 'md',
  interactive = false,
  onClick,
  ...props 
}, ref) => {
  // AIDEV-NOTE: Card variants for different use cases
  const variants = {
    default: 'bg-surface border-border',
    elevated: 'bg-surface border-border shadow-md',
    outlined: 'bg-transparent border-border',
    ghost: 'bg-transparent border-transparent'
  };

  // AIDEV-NOTE: Size variants for consistent spacing
  const sizes = {
    sm: 'p-sm',
    md: 'p-md',
    lg: 'p-lg',
    xl: 'p-xl'
  };

  // AIDEV-NOTE: Interactive states for clickable cards
  const interactiveClasses = interactive ? `
    cursor-pointer
    transition-all duration-300
    hover:shadow-md hover:border-primary
    active:scale-[0.98]
    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
  ` : '';

  return (
    <div
      ref={ref}
      className={`
        card
        ${variants[variant]}
        ${sizes[size]}
        ${interactiveClasses}
        ${className}
        rounded-lg
        border
        transition-all
        duration-300
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card; 