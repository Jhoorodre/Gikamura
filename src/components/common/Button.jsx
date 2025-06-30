import React from 'react';

const Button = ({ children, onClick, className = '', ...props }) => (
  <button onClick={onClick} className={`btn ${className}`} {...props}>
    {children}
  </button>
);

export default Button;
