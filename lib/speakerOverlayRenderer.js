/**
 * Speaker Overlay Renderer
 *
 * Creates a 2D canvas overlay on top of a WebGL canvas to render speaker icons
 * and other UI elements. Provides visual feedback for dual-tone audio sources.
 *
 * Usage:
 *   const overlay = new SpeakerOverlayRenderer(webglCanvas);
 *   overlay.render(tone1State, tone2State);
 *   overlay.resize(800, 600);
 *   overlay.destroy();
 */

class SpeakerOverlayRenderer {
    constructor(parentCanvas) {
        this.parentCanvas = parentCanvas;
        this.overlayCanvas = null;
        this.ctx = null;

        // Speaker images
        this.speakerImage = new Image();
        this.speakerImageTransparent = new Image();
        this.speakerImageLoaded = false;
        this.speakerImageTransparentLoaded = false;

        this.createOverlay();
        this.loadImages();
    }

    createOverlay() {
        // Create a 2D overlay canvas for speakers and other 2D elements
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.left = '0';
        this.overlayCanvas.style.top = '0';
        this.overlayCanvas.style.width = '100%';
        this.overlayCanvas.style.height = '100%';
        this.overlayCanvas.style.pointerEvents = 'none';
        this.overlayCanvas.style.zIndex = '10'; // Ensure overlay is on top
        this.overlayCanvas.width = this.parentCanvas.width;
        this.overlayCanvas.height = this.parentCanvas.height;

        // Check if parent exists
        if (!this.parentCanvas.parentElement) {
            console.error('Canvas parent element not found for overlay');
            return;
        }

        this.parentCanvas.parentElement.appendChild(this.overlayCanvas);
        this.ctx = this.overlayCanvas.getContext('2d');
        console.log('Overlay canvas created:', this.overlayCanvas.width, 'x', this.overlayCanvas.height);
    }

    loadImages() {
        // Load speaker images - one with white background, one transparent
        this.speakerImage.src = './images/roundspeaker.png';
        this.speakerImageTransparent.src = './images/roundspeaker-transparent.png';

        this.speakerImage.onload = () => {
            this.speakerImageLoaded = true;
            console.log('Speaker image loaded');
        };
        this.speakerImageTransparent.onload = () => {
            this.speakerImageTransparentLoaded = true;
            console.log('Speaker transparent image loaded');
        };
        this.speakerImage.onerror = () => {
            console.error('Failed to load speaker image');
        };
        this.speakerImageTransparent.onerror = () => {
            console.error('Failed to load transparent speaker image');
        };
    }

    /**
     * Render speaker icons on the overlay
     * @param {Object} tone1State - { x, y, color, label, isActive }
     * @param {Object} tone2State - { x, y, color, label, isActive }
     */
    render(tone1State, tone2State) {
        if (!this.ctx || !this.overlayCanvas) return;

        const width = this.overlayCanvas.width;
        const height = this.overlayCanvas.height;

        // Clear overlay
        this.ctx.clearRect(0, 0, width, height);

        // Draw speakers
        this.drawToneSource(this.ctx,
            tone1State.x, tone1State.y,
            tone1State.color, tone1State.label,
            tone1State.isActive);
        this.drawToneSource(this.ctx,
            tone2State.x, tone2State.y,
            tone2State.color, tone2State.label,
            tone2State.isActive);
    }

    /**
     * Draw a single tone source (speaker icon)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} color - Hex color string
     * @param {string} label - Label for the speaker
     * @param {boolean} isActive - Whether the tone is currently playing
     */
    drawToneSource(ctx, x, y, color, label, isActive = false) {
        if (!this.speakerImageLoaded) return;

        // Draw speaker icon - size responsive to canvas dimensions
        // Use percentage of canvas width, clamped between min and max
        const baseSize = Math.min(this.overlayCanvas.width, this.overlayCanvas.height) * 0.08; // 8% of smallest dimension
        const speakerSize = Math.max(40, Math.min(80, baseSize)); // Clamp between 40-80px
        const bgRadius = speakerSize / 2;

        ctx.save();

        let speakerOpacity = 0.5;
        if (isActive) {
            const pulseSpeed = 3;
            const time = performance.now() / 1000;
            const pulse = (Math.sin(time * pulseSpeed * Math.PI * 2) + 1) / 2;
            speakerOpacity = 0.5 + (pulse * 0.5);
        }

        if (isActive) {
            // When playing: draw pulsing speaker with background
            // Draw background circle with glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = color;
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(x, y, bgRadius * 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Draw speaker image
            ctx.shadowBlur = 0;
            ctx.globalAlpha = speakerOpacity;

            // Use transparent image if loaded, otherwise regular image
            const imgToUse = this.speakerImageTransparentLoaded ? this.speakerImageTransparent : this.speakerImage;

            ctx.drawImage(
                imgToUse,
                x - speakerSize / 2,
                y - speakerSize / 2,
                speakerSize,
                speakerSize
            );
        } else {
            // When not playing: draw inactive speaker with dark background
            ctx.fillStyle = '#000000';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(x, y, bgRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4;
            ctx.stroke();

            ctx.globalAlpha = 0.9;
            ctx.save();
            ctx.filter = 'invert(1) contrast(1.5) brightness(1.2)';
            ctx.drawImage(
                this.speakerImage,
                x - speakerSize / 2,
                y - speakerSize / 2,
                speakerSize,
                speakerSize
            );
            ctx.restore();
        }

        ctx.restore();
    }

    /**
     * Resize the overlay canvas to match parent canvas
     * @param {number} width - New width
     * @param {number} height - New height
     */
    resize(width, height) {
        if (!this.overlayCanvas) return;
        this.overlayCanvas.width = width;
        this.overlayCanvas.height = height;
    }

    /**
     * Clean up and remove the overlay canvas
     */
    destroy() {
        if (this.overlayCanvas && this.overlayCanvas.parentElement) {
            this.overlayCanvas.parentElement.removeChild(this.overlayCanvas);
        }
        this.overlayCanvas = null;
        this.ctx = null;
    }
}
