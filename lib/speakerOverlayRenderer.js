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

const OVERLAY_DEBUG_FLAG = '__INTERFERENCE_DEBUG';
function overlayDebugEnabled() {
    try {
        return typeof window !== 'undefined' && Boolean(window[OVERLAY_DEBUG_FLAG]);
    } catch (err) {
        return false;
    }
}

function overlayDebugLog(...args) {
    if (overlayDebugEnabled()) {
        console.log(...args);
    }
}

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

        this.pixelRatio = window.devicePixelRatio || 1;
        this.cssWidth = this.parentCanvas.clientWidth || this.parentCanvas.width || 0;
        this.cssHeight = this.parentCanvas.clientHeight || this.parentCanvas.height || 0;

        this.createOverlay();
        this.loadImages();
    }

    createOverlay() {
        // Create a 2D overlay canvas for speakers and other 2D elements
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.style.position = 'absolute';
        this.overlayCanvas.style.left = '0';
        this.overlayCanvas.style.top = '0';
        this.overlayCanvas.style.pointerEvents = 'none';
        this.overlayCanvas.style.zIndex = '10'; // Ensure overlay is on top

        // Check if parent exists
        if (!this.parentCanvas.parentElement) {
            console.error('Canvas parent element not found for overlay');
            return;
        }

        this.parentCanvas.parentElement.appendChild(this.overlayCanvas);
        this.ctx = this.overlayCanvas.getContext('2d');
        overlayDebugLog('Overlay canvas created:', this.overlayCanvas.width, 'x', this.overlayCanvas.height);

        let cssWidth = this.parentCanvas.clientWidth || parseFloat(this.parentCanvas.style.width) || this.parentCanvas.width || 0;
        let cssHeight = this.parentCanvas.clientHeight || parseFloat(this.parentCanvas.style.height) || this.parentCanvas.height || cssWidth;
        if (!cssWidth) cssWidth = this.parentCanvas.width || 300;
        if (!cssHeight) cssHeight = cssWidth;
        const ratio = this.pixelRatio;
        const pixelWidth = this.parentCanvas.width || Math.max(1, Math.round(cssWidth * ratio));
        const pixelHeight = this.parentCanvas.height || Math.max(1, Math.round(cssHeight * ratio));

        this.cssWidth = cssWidth;
        this.cssHeight = cssHeight;

        this.resize(cssWidth, cssHeight, pixelWidth, pixelHeight, ratio);
    }

    loadImages() {
        // Load speaker images - one with white background, one transparent
        this.speakerImage.src = './images/roundspeaker.png';
        this.speakerImageTransparent.src = './images/roundspeaker-transparent.png';

        this.speakerImage.onload = () => {
            this.speakerImageLoaded = true;
            overlayDebugLog('Speaker image loaded');
        };
        this.speakerImageTransparent.onload = () => {
            this.speakerImageTransparentLoaded = true;
            overlayDebugLog('Speaker transparent image loaded');
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

        const ratio = this.pixelRatio || 1;
        const width = this.cssWidth || (this.overlayCanvas.width / ratio);
        const height = this.cssHeight || (this.overlayCanvas.height / ratio);

        this.ctx.save();
        this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.ctx.clearRect(0, 0, width, height);

        this.drawToneSource(this.ctx,
            tone1State.x, tone1State.y,
            tone1State.color, tone1State.label,
            tone1State.isActive,
            width,
            height);
        this.drawToneSource(this.ctx,
            tone2State.x, tone2State.y,
            tone2State.color, tone2State.label,
            tone2State.isActive,
            width,
            height);

        this.ctx.restore();
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
    drawToneSource(ctx, x, y, color, label, isActive = false, width, height) {
        if (!this.speakerImageLoaded) return;

        const ratio = this.pixelRatio || 1;
        const fallbackWidth = this.overlayCanvas.width / ratio;
        const fallbackHeight = this.overlayCanvas.height / ratio;
        width = width || fallbackWidth;
        height = height || fallbackHeight;

        const pixelMin = Math.min(this.overlayCanvas.width, this.overlayCanvas.height);
        const baseSize = (pixelMin * 0.08) / ratio; // Scale with backing pixels, convert to CSS units
        const speakerSize = Math.max(40, Math.min(80, baseSize)); // Clamp between 40-80px
        const bgRadius = speakerSize / 2;
        const shadowBlur = 15 / ratio;
        const inactiveLineWidth = 2 / ratio;

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
            ctx.shadowBlur = shadowBlur;
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
            ctx.lineWidth = inactiveLineWidth;
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
     * @param {number} cssWidth - Display width in CSS pixels
     * @param {number} cssHeight - Display height in CSS pixels
     * @param {number} pixelWidth - Backing width in device pixels
     * @param {number} pixelHeight - Backing height in device pixels
     * @param {number} ratio - Device pixel ratio used for rendering
     */
    resize(cssWidth, cssHeight, pixelWidth, pixelHeight, ratio = window.devicePixelRatio || 1) {
        if (!this.overlayCanvas) return;

        this.pixelRatio = ratio;
        this.cssWidth = cssWidth || Math.round(pixelWidth / ratio);
        this.cssHeight = cssHeight || Math.round(pixelHeight / ratio);

        this.overlayCanvas.style.left = '0';
        this.overlayCanvas.style.top = '0';
        this.overlayCanvas.style.width = `${this.cssWidth}px`;
        this.overlayCanvas.style.height = `${this.cssHeight}px`;
        const safePixelWidth = Math.max(1, Math.round(pixelWidth));
        const safePixelHeight = Math.max(1, Math.round(pixelHeight));
        this.overlayCanvas.width = safePixelWidth;
        this.overlayCanvas.height = safePixelHeight;

        if (this.ctx) {
            this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
        }

        requestAnimationFrame(() => this.positionOverlay());
    }

    positionOverlay() {
        if (!this.overlayCanvas || !this.parentCanvas || !this.parentCanvas.parentElement) return;

        const canvasRect = this.parentCanvas.getBoundingClientRect();
        const parentRect = this.parentCanvas.parentElement.getBoundingClientRect();

        const offsetLeft = canvasRect.left - parentRect.left;
        const offsetTop = canvasRect.top - parentRect.top;

        this.overlayCanvas.style.left = `${offsetLeft}px`;
        this.overlayCanvas.style.top = `${offsetTop}px`;
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
