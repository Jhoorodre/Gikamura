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
    default: 'card',
    elevated: 'card card--elevated',
    outlined: 'card card--outlined',
    ghost: 'card card--ghost'
  };

  // AIDEV-NOTE: Size variants for consistent spacing
  const sizes = {
    sm: 'card--sm',
    md: 'card--md', 
    lg: 'card--lg',
    xl: 'card--xl'
  };

  // AIDEV-NOTE: Interactive states for clickable cards
  const interactiveClasses = interactive ? 'card--interactive' : '';

  return (
    <div
      ref={ref}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${interactiveClasses}
        ${className}
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