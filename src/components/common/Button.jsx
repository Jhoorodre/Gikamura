import { forwardRef } from 'react';

const Button = forwardRef(({ children, onClick, className = '', variant = 'primary', size = 'normal', 'aria-label': ariaLabel, ...props }, ref) => {
  let variantClass = '';
  if (variant === 'secondary') variantClass = 'btn-secondary';
  else if (variant === 'ghost') variantClass = 'btn-ghost';
  else variantClass = 'btn-primary';

  let sizeClass = '';
  if (size === 'sm') sizeClass = 'btn-sm';
  else sizeClass = '';

  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
