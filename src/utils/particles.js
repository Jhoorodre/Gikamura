/**
 * Cria partículas animadas de fundo para polimento visual
 * AIDEV-NOTE: Creates animated background particles for UI polish with robust error handling
 */
export const createParticles = () => {
    // AIDEV-NOTE: Wait for DOM to be ready and check if container exists
    const container = document.getElementById('particles-container');
    if (!container) {
        console.warn('particles-container não encontrado, ignorando criação de partículas');
        return;
    }
    
    // AIDEV-NOTE: Check if particles are disabled by CSS
    const containerStyle = window.getComputedStyle(container);
    if (containerStyle.display === 'none') {
        console.log('Partículas desabilitadas por CSS, ignorando criação');
        return;
    }
    
    // AIDEV-NOTE: Prevents duplicate particles if already present
    if (container.childElementCount > 0) {
        return;
    }

    try {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            if (!particle) {
                console.warn('Falha ao criar elemento div para partícula');
                continue;
            }
            
            particle.className = 'particle';
            
            // AIDEV-NOTE: Defensive style setting with null checks
            if (particle.style) {
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.width = `${Math.random() * 3 + 1}px`;
                particle.style.height = particle.style.width;
                particle.style.animationDelay = `${Math.random() * 25}s`;
                particle.style.animationDuration = `${Math.random() * 15 + 10}s`;
            }
            
            container.appendChild(particle);
        }
    } catch (error) {
        console.warn('Erro ao criar partículas:', error);
    }
};