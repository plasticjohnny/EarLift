/**
 * FTUE Animations
 *
 * Handles unlock animation sequences:
 * 1. Lock breaking animation
 * 2. Card glow/pulse effect
 * 3. Confetti celebration
 */

class FTUEAnimations {
    constructor() {
        this.sounds = new FTUESounds();
    }

    /**
     * Play full unlock sequence for a tutorial card
     * @param {HTMLElement} cardElement - The tutorial card element
     * @param {string} tutorialName - Name of the unlocked tutorial
     * @param {Function} onComplete - Callback when animation completes
     */
    async playUnlockSequence(cardElement, tutorialName, onComplete) {
        // Play unlock sound
        this.sounds.playUnlockSound();

        // Step 1: Lock breaking animation (0.5s)
        await this.playLockBreak(cardElement);

        // Step 2: Card glow/pulse (0.8s)
        await this.playCardGlow(cardElement);

        // Step 3: Confetti celebration (1.5s)
        await this.playConfetti(cardElement);

        // Callback
        if (onComplete) {
            onComplete();
        }
    }

    /**
     * Lock breaking animation
     */
    playLockBreak(cardElement) {
        return new Promise(resolve => {
            const lockOverlay = cardElement.querySelector('.tutorial-lock-overlay');
            if (!lockOverlay) {
                resolve();
                return;
            }

            // Add breaking animation class
            lockOverlay.classList.add('lock-breaking');

            // Remove after animation
            setTimeout(() => {
                lockOverlay.remove();
                resolve();
            }, 500);
        });
    }

    /**
     * Card glow/pulse animation
     */
    playCardGlow(cardElement) {
        return new Promise(resolve => {
            // Remove locked state
            cardElement.classList.remove('tutorial-card-locked');

            // Add glow animation
            cardElement.classList.add('card-glow-unlock');

            // Remove glow class after animation
            setTimeout(() => {
                cardElement.classList.remove('card-glow-unlock');
                resolve();
            }, 800);
        });
    }

    /**
     * Confetti particle celebration
     */
    playConfetti(cardElement) {
        return new Promise(resolve => {
            const rect = cardElement.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Create confetti container
            const confettiContainer = document.createElement('div');
            confettiContainer.className = 'confetti-container';
            confettiContainer.style.position = 'fixed';
            confettiContainer.style.top = '0';
            confettiContainer.style.left = '0';
            confettiContainer.style.width = '100vw';
            confettiContainer.style.height = '100vh';
            confettiContainer.style.pointerEvents = 'none';
            confettiContainer.style.zIndex = '10000';
            document.body.appendChild(confettiContainer);

            // Generate confetti particles
            const particleCount = 30;
            const colors = ['#00ff88', '#00ddff', '#ff00ff', '#ffff00', '#ff6600'];

            for (let i = 0; i < particleCount; i++) {
                this.createConfettiParticle(confettiContainer, centerX, centerY, colors);
            }

            // Remove container after animation
            setTimeout(() => {
                confettiContainer.remove();
                resolve();
            }, 1500);
        });
    }

    /**
     * Create a single confetti particle
     */
    createConfettiParticle(container, originX, originY, colors) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';

        // Random properties
        const color = colors[Math.floor(Math.random() * colors.length)];
        const angle = Math.random() * Math.PI * 2;
        const velocity = 100 + Math.random() * 150;
        const size = 4 + Math.random() * 6;
        const rotation = Math.random() * 360;
        const rotationSpeed = (Math.random() - 0.5) * 720;

        // Initial position
        particle.style.position = 'absolute';
        particle.style.left = `${originX}px`;
        particle.style.top = `${originY}px`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.backgroundColor = color;
        particle.style.borderRadius = '50%';
        particle.style.transform = `rotate(${rotation}deg)`;

        container.appendChild(particle);

        // Animate particle
        const startTime = Date.now();
        const duration = 1500;
        const gravity = 200; // pixels per second squared

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress >= 1) {
                return;
            }

            // Calculate position
            const t = elapsed / 1000; // time in seconds
            const x = originX + Math.cos(angle) * velocity * t;
            const y = originY + Math.sin(angle) * velocity * t + 0.5 * gravity * t * t;

            // Calculate rotation
            const currentRotation = rotation + rotationSpeed * t;

            // Calculate opacity (fade out)
            const opacity = 1 - progress;

            // Update particle
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.transform = `rotate(${currentRotation}deg)`;
            particle.style.opacity = opacity;

            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Play big celebration for Training Mode unlock or Unlock All
     */
    async playBigCelebration(options = {}) {
        const {
            title = '🎉 Unlocked!',
            message = 'Great job!',
            onComplete = null
        } = options;

        // Play celebration sound
        this.sounds.playCelebrationSound();

        // Create modal
        const modal = this.createCelebrationModal(title, message);
        document.body.appendChild(modal);

        // Full-screen confetti
        await this.playFullScreenConfetti();

        // Wait for user to dismiss modal
        return new Promise(resolve => {
            const closeBtn = modal.querySelector('.celebration-close-btn');
            closeBtn.addEventListener('click', () => {
                modal.remove();
                if (onComplete) onComplete();
                resolve();
            });

            // Auto-close after 5 seconds
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    modal.remove();
                    if (onComplete) onComplete();
                    resolve();
                }
            }, 5000);
        });
    }

    /**
     * Create celebration modal
     */
    createCelebrationModal(title, message) {
        const modal = document.createElement('div');
        modal.className = 'ftue-celebration-modal';
        modal.innerHTML = `
            <div class="celebration-content">
                <h2 class="celebration-title">${title}</h2>
                <p class="celebration-message">${message}</p>
                <button class="celebration-close-btn btn-primary">Let's Go!</button>
            </div>
        `;
        return modal;
    }

    /**
     * Full-screen confetti celebration
     */
    playFullScreenConfetti() {
        return new Promise(resolve => {
            const container = document.createElement('div');
            container.className = 'confetti-container';
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100vw';
            container.style.height = '100vh';
            container.style.pointerEvents = 'none';
            container.style.zIndex = '9999';
            document.body.appendChild(container);

            const colors = ['#00ff88', '#00ddff', '#ff00ff', '#ffff00', '#ff6600', '#ff0088'];
            const particleCount = 100;

            // Launch from multiple points across the bottom
            const launchPoints = 5;
            for (let point = 0; point < launchPoints; point++) {
                const x = (window.innerWidth / (launchPoints + 1)) * (point + 1);
                const y = window.innerHeight;

                for (let i = 0; i < particleCount / launchPoints; i++) {
                    setTimeout(() => {
                        this.createConfettiParticle(container, x, y, colors);
                    }, i * 20);
                }
            }

            setTimeout(() => {
                container.remove();
                resolve();
            }, 2500);
        });
    }

    /**
     * Scroll to element with smooth animation
     */
    scrollToElement(element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }
}

// Export for use in other files
window.FTUEAnimations = FTUEAnimations;
