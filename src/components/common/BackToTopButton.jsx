// AIDEV-NOTE: Back to top button component for reading interfaces
import { useState, useEffect } from 'react';

const BackToTopButton = ({ threshold = 300, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);

    // AIDEV-NOTE: Show/hide button based on scroll position
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > threshold) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [threshold]);

    // AIDEV-NOTE: Smooth scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    if (!isVisible) {
        return null;
    }

    return (
        <button
            onClick={scrollToTop}
            className={`back-to-top-btn ${className}`}
            aria-label="Voltar ao topo"
            title="Voltar ao topo"
        >
            <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                <path 
                    d="M12 19V5M5 12L12 5L19 12" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    );
};

export default BackToTopButton;
