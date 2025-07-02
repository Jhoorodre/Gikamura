import { forwardRef } from 'react';

const Button = forwardRef(({ children, onClick, className = '', ...props }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={`btn inline-flex items-center justify-center ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
