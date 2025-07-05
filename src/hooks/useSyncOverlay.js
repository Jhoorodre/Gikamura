// AIDEV-NOTE: Custom hook to manage sync overlay with robust auto-hide and manual controls
import { useState, useEffect, useRef, useCallback } from 'react';

export const useSyncOverlay = (isSyncing) => {
    const [showOverlay, setShowOverlay] = useState(false);
    const timeoutRef = useRef(null);
    const maxDisplayTimeRef = useRef(null);

    // AIDEV-NOTE: Auto-hide overlay after max time regardless of sync state
    const MAX_DISPLAY_TIME = 30000; // 30 segundos máximo
    const AUTO_HIDE_TIME = 10000;   // 10 segundos normal

    const hideOverlay = useCallback(() => {
        console.log('🔴 [useSyncOverlay] Ocultando overlay');
        setShowOverlay(false);
        
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        
        if (maxDisplayTimeRef.current) {
            clearTimeout(maxDisplayTimeRef.current);
            maxDisplayTimeRef.current = null;
        }
    }, []);

    const forceHide = useCallback(() => {
        console.log('🔴 [useSyncOverlay] Forçando ocultação da overlay');
        hideOverlay();
    }, [hideOverlay]);

    useEffect(() => {
        if (isSyncing) {
            console.log('🔄 [useSyncOverlay] Sync iniciado - mostrando overlay');
            setShowOverlay(true);
            
            // AIDEV-NOTE: Auto-hide after normal time
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                console.log('⏰ [useSyncOverlay] Auto-hide após tempo normal');
                hideOverlay();
            }, AUTO_HIDE_TIME);
            
            // AIDEV-NOTE: Force hide after maximum time (safety net)
            if (maxDisplayTimeRef.current) {
                clearTimeout(maxDisplayTimeRef.current);
            }
            maxDisplayTimeRef.current = setTimeout(() => {
                console.log('🚨 [useSyncOverlay] Forçando ocultação após tempo máximo');
                hideOverlay();
            }, MAX_DISPLAY_TIME);
        } else {
            console.log('✅ [useSyncOverlay] Sync finalizado - ocultando overlay');
            hideOverlay();
        }
        
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (maxDisplayTimeRef.current) {
                clearTimeout(maxDisplayTimeRef.current);
            }
        };
    }, [isSyncing, hideOverlay]);

    return {
        showOverlay,
        forceHide
    };
};
