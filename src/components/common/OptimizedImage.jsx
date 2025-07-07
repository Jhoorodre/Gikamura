// AIDEV-NOTE: Optimized Image component to prevent flickering during navigation
import { useState, useCallback } from 'react';

const OptimizedImage = ({ 
    src, 
    alt, 
    className = '', 
    loading = 'lazy',
    onLoad,
    onError,
    ...props 
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = useCallback((e) => {
        setIsLoaded(true);
        onLoad?.(e);
    }, [onLoad]);

    const handleError = useCallback((e) => {
        setHasError(true);
        onError?.(e);
    }, [onError]);

    if (hasError) {
        return (
            <div 
                className={`${className} bg-gray-800 flex items-center justify-center`}
                {...props}
            >
                <span className="text-gray-500 text-sm">Erro ao carregar imagem</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={`${className} transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading={loading}
            onLoad={handleLoad}
            onError={handleError}
            style={{
                willChange: 'opacity',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
            }}
            {...props}
        />
    );
};

export default OptimizedImage;
