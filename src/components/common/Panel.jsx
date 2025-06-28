import React from 'react';

const Panel = ({ children, className = '', solid = true }) => {
    const panelClass = solid ? 'panel-solid' : 'panel-dark';
    return (
        <div className={`${panelClass} rounded-3xl p-8 ${className}`}>
            {children}
        </div>
    );
};

export default Panel;
