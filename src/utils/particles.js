/**
 * Cria partículas animadas de fundo para polimento visual
 * AIDEV-NOTE: Creates animated background particles for UI polish
 */
export const createParticles = () => {
    const container = document.getElementById('particles-container');
    // AIDEV-NOTE: Prevents duplicate particles if already present
    if (!container || container.childElementCount > 0) return;

    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.width = `${Math.random() * 3 + 1}px`;
        particle.style.height = particle.style.width;
        particle.style.animationDelay = `${Math.random() * 25}s`;
        particle.style.animationDuration = `${Math.random() * 15 + 10}s`;
        container.appendChild(particle);
    }
};