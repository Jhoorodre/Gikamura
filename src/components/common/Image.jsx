import { useState, useCallback, memo } from 'react';
import { useIntersectionObserver } from '../../hooks/useUtils';

// AIDEV-NOTE: ANTI-FLICKERING IMPROVEMENTS SUMMARY:
// ✅ 1. Removed route-based loading state in App.jsx that caused flickering on navigation
// ✅ 2. Optimized Suspense fallbacks to use transparent backgrounds instead of visible spinners
// ✅ 3. Created PageTransition component for smooth route changes
// ✅ 4. Memoized AppContext value to prevent unnecessary re-renders
// ✅ 5. Added anti-flicker.css with hardware acceleration and smooth transitions
// ✅ 6. Simplified MainLayout removing complex transition logic
// ✅ 7. Improved Image component with hardware acceleration and proper opacity handling
// ✅ 8. Enhanced error handling in HubRouteHandler to prevent crashes
// ✅ 9. Fixed particles initialization timing to prevent console warnings
// The navigation should now be significantly smoother with minimal to no flickering

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
            style={{
                contain: 'layout style',
                transform: 'translateZ(0)',
                willChange: 'auto'
            }}
        >
            {/* Skeleton/placeholder enquanto não carregou - Anti-flickering */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-slate-800/50 animate-pulse" style={{ willChange: 'opacity' }} />
            )}
            
            {/* Só renderiza a tag <img> quando necessário */}
            {shouldShowImage && finalSrc && (
                <img
                    src={finalSrc}
                    alt={alt}
                    onLoad={handleLoad}
                    onError={handleError}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isLoaded ? 'opacity-100 loaded' : 'opacity-0'
                    }`}
                    loading={loading}
                    decoding="async"
                    style={{
                        willChange: 'opacity',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                    }}
                    {...props}
                />
            )}
        </div>
    );
});

Image.displayName = 'Image';

export default Image;
