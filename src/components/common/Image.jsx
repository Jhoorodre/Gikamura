import { useState, useCallback, memo } from 'react';
import { useIntersectionObserver } from '../../hooks/useUtils';

const Image = memo(({ src, alt, className, errorSrc, loading = 'lazy', ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const { elementRef, isIntersecting } = useIntersectionObserver({
        rootMargin: '100px 0px',
        threshold: 0.1
    });

    const handleLoad = useCallback(() => {
        setIsLoaded(true);
    }, []);

    const handleError = useCallback(() => {
        setHasError(true);
        setIsLoaded(true);
    }, []);

    // Determina qual fonte usar
    const finalSrc = hasError && errorSrc ? errorSrc : src;

    // Só mostra a imagem se estiver na viewport ou se o lazy loading estiver desabilitado
    const shouldShowImage = loading === 'eager' || isIntersecting;

    // Se não houver src, renderiza um placeholder
    if (!src) {
        return <div ref={elementRef} className={`relative overflow-hidden bg-slate-800/50 ${className}`} />;
    }

    return (
        <div 
            ref={elementRef}
            className={`relative overflow-hidden ${className}`}
        >
            {/* Skeleton/placeholder enquanto não carregou */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-slate-800/50 animate-pulse" />
            )}
            
            {/* Só renderiza a tag <img> quando necessário */}
            {shouldShowImage && finalSrc && (
                <img
                    src={finalSrc}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    loading={loading}
                    decoding="async"
                    {...props}
                />
            )}
        </div>
    );
});

Image.displayName = 'Image';

export default Image;
