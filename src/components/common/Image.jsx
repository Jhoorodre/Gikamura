import React, { useState, useEffect, useRef } from 'react';
import { CORS_PROXY_URL } from '../../constants';

const Image = ({ src, alt, className, errorSrc, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const containerRef = useRef(null);

    // Efeito para IntersectionObserver (lazy loading)
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // Quando o componente entra na viewport, atualiza o estado
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect(); // Para de observar após ser visível uma vez
                }
            },
            { rootMargin: '100px 0px' } // Começa a carregar 100px antes de entrar na tela
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            if (containerRef.current) {
                observer.unobserve(containerRef.current);
            }
        };
    }, []); // Executa apenas uma vez

    // Reinicia o estado se o src da imagem mudar, mas mantém o isInView
    useEffect(() => {
        setIsLoaded(false);
        setHasError(false);
    }, [src]);

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setHasError(true);

    // Decide qual URL usar e se deve aplicar o proxy
    const sourceToRender = hasError && errorSrc ? errorSrc : src;
    const finalSrc = !hasError && src ? `${CORS_PROXY_URL}${encodeURIComponent(src)}` : sourceToRender;

    // Se não houver src, renderiza um placeholder
    if (!src) {
        return <div ref={containerRef} className={`relative overflow-hidden bg-slate-800/50 ${className}`} />;
    }

    return (
        <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
            {/* Mostra um placeholder até a imagem estar carregada */}
            {!isLoaded && <div className="absolute inset-0 bg-slate-800/50 animate-pulse" />}
            
            {/* Só renderiza a tag <img> quando o componente está visível */}
            {isInView && (
                <img
                    src={finalSrc}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    {...props}
                />
            )}
        </div>
    );
};

export default Image;
