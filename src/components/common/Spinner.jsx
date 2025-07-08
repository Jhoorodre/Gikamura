// AIDEV-NOTE: Reusable loading spinner with size variants and accessibility features

const Spinner = ({ size = 'md', text = 'Carregando...' }) => {
    // AIDEV-NOTE: Size variants for different use cases
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10', 
        lg: 'w-16 h-16'
    };

    // AIDEV-NOTE: Fallback to 'md' for invalid size values
    const finalSizeClass = sizeClasses[size] || sizeClasses.md;

    return (
        <div role="status" className="flex flex-col items-center justify-center space-y-4">
            <div className={`loading-spinner ${finalSizeClass}`}></div>
            {text && (
                <p className="text-sm text-slate-400 font-medium">{text}</p>
            )}
            {/* AIDEV-NOTE: Screen reader text, visually hidden */}
            <span className="sr-only">{text}</span>
        </div>
    );
};

export default Spinner;
