import React from 'react';

const Spinner = () => (
    <div className="flex flex-col justify-center items-center p-12 min-h-screen">
        <div className="loading-orb mb-4"></div>
        <p className="text-white/70 text-lg">A carregar conteúdo...</p>
    </div>
);

export default Spinner;
