// src/components/common/CachedImage.jsx - Componente de Imagem com Cache
import React, { useState, useEffect, useRef } from 'react';
import useImageCache from '../../hooks/useImageCache';

const CachedImage = ({ 
    src, 
    alt, 
    className = '', 
    loading = 'lazy',
    onLoad = () => {},
    onError = () => {},
    placeholder = null,
    ...props 
}) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [isVisible, setIsVisible] = useState(loading === 'eager');
    
    const { getImage, isImageCached } = useImageCache();
    const imgRef = useRef(null);
    const observerRef = useRef(null);

    // Intersection Observer para lazy loading
    useEffect(() => {
        if (loading === 'lazy' && imgRef.current && !isVisible) {
            observerRef.current = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observerRef.current?.disconnect();
                    }
                },
                { rootMargin: '50px' } // Carregar 50px antes de aparecer
            );
            
            observerRef.current.observe(imgRef.current);
        }

        return () => observerRef.current?.disconnect();
    }, [loading, isVisible]);

    // Carregar imagem quando visível
    useEffect(() => {
        if (!src || !isVisible) return;

        const loadImage = async () => {
            try {
                setIsLoading(true);
                setHasError(false);
                
                // Verificar se já está em cache
                if (isImageCached(src)) {
                    const cachedImage = await getImage(src);
                    setImageSrc(cachedImage.src);
                    setIsLoading(false);
                    onLoad();
                    return;
                }

                // Carregar imagem através do cache
                const image = await getImage(src);
                setImageSrc(image.src);
                setIsLoading(false);
                onLoad();
                
            } catch (error) {
                console.error('Erro ao carregar imagem:', error);
                setHasError(true);
                setIsLoading(false);
                onError(error);
            }
        };

        loadImage();
    }, [src, isVisible]); // Removido getImage, isImageCached, onLoad, onError

    // Placeholder enquanto carrega
    if (isLoading && placeholder) {
        return (
            <div ref={imgRef} className={`image-placeholder ${className}`}>
                {placeholder}
            </div>
        );
    }

    // Placeholder padrão
    if (isLoading) {
        return (
            <div 
                ref={imgRef} 
                className={`image-placeholder loading ${className}`}
                style={{
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px'
                }}
            >
                <div className="loading-spinner">
                    <div style={{
                        width: '24px',
                        height: '24px',
                        border: '2px solid #e5e7eb',
                        borderTop: '2px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                </div>
            </div>
        );
    }

    // Erro ao carregar
    if (hasError) {
        return (
            <div 
                ref={imgRef}
                className={`image-error ${className}`}
                style={{
                    backgroundColor: '#fef2f2',
                    border: '1px dashed #fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '200px',
                    color: '#dc2626'
                }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
                    <div style={{ fontSize: '14px' }}>Erro ao carregar imagem</div>
                </div>
            </div>
        );
    }

    // Imagem carregada
    return (
        <img
            ref={imgRef}
            src={imageSrc}
            alt={alt}
            className={className}
            onLoad={onLoad}
            onError={(e) => {
                setHasError(true);
                onError(e);
            }}
            {...props}
            style={{
                ...props.style,
                opacity: imageSrc ? 1 : 0,
                transition: 'opacity 0.2s ease'
            }}
        />
    );
};

export default CachedImage;