import React, { useState, useEffect } from 'react';
import { CORS_PROXY_URL } from '../../constants';

const Image = ({ src, alt, className, errorSrc, ...props }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // Reinicia o estado se o src da imagem mudar
    useEffect(() => {
        setIsLoading(true);
        setHasError(false);
    }, [src]);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    const finalSrc = hasError && errorSrc ? errorSrc : src;

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Mostra um placeholder a piscar enquanto a imagem carrega */}
            {isLoading && (
                <div className="absolute inset-0 bg-slate-800/50 animate-pulse"></div>
            )}
            <img
                src={`${CORS_PROXY_URL}${encodeURIComponent(finalSrc)}`}
                alt={alt}
                onLoad={handleLoad}
                onError={handleError}
                // Esconde a imagem até estar carregada para uma transição suave
                className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                {...props}
            />
        </div>
    );
};

export default Image;
