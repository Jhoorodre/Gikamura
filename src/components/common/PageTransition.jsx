// AIDEV-NOTE: Component for smooth page transitions to prevent flickering
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
    const [isVisible, setIsVisible] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // AIDEV-NOTE: Very quick transition to prevent flickering
        setIsVisible(false);
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 10); // Minimal delay just to trigger transition

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <div 
            className={`page-transition-container ${isVisible ? 'visible' : 'hidden'}`}
            style={{
                opacity: isVisible ? 1 : 0,
                transition: 'opacity 0.15s ease-in-out',
                willChange: 'opacity'
            }}
        >
            {children}
        </div>
    );
};

export default PageTransition;
