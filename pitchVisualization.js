// Pitch Visualization Exercise - Show how intervals look/feel different
// Helps users understand visual and acoustic relationships between pitches
class PitchVisualization {
    constructor() {
        this.exerciseId = 'pitchVisualization';
        this.containerId = 'pitchVisualizationExercise';
        this.rootToneGenerator = new ToneGenerator();
        this.targetToneGenerator = new ToneGenerator();
        this.rootFrequency = 440; // Default A4
        this.targetFrequency = 440 * Math.pow(2, 7/12); // Default perfect fifth
        this.currentInterval = 'perfectFifth';
        this.isPlayingRoot = false;
        this.isPlayingTarget = false;
        this.sliderActive = false;
        this.animationFrame = null;

        this.canvases = {};
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.container = document.getElementById(this.containerId);
        this.exitBtn = document.getElementById(`${this.exerciseId}ExitBtn`);
        this.playRootBtn = document.getElementById(`${this.exerciseId}PlayRootBtn`);
        this.playTargetBtn = document.getElementById(`${this.exerciseId}PlayTargetBtn`);
        this.playBothBtn = document.getElementById(`${this.exerciseId}PlayBothBtn`);
        this.intervalSelect = document.getElementById(`${this.exerciseId}IntervalSelect`);
        this.targetSlider = document.getElementById(`${this.exerciseId}TargetSlider`);
        this.rootFreqDisplay = document.getElementById(`${this.exerciseId}RootFreq`);
        this.targetFreqDisplay = document.getElementById(`${this.exerciseId}TargetFreq`);
        this.intervalNameDisplay = document.getElementById(`${this.exerciseId}IntervalName`);

        // Canvas elements
        this.canvases.wave = document.getElementById('vizWaveInterference');
        this.canvases.beats = document.getElementById('vizBeats');
        this.canvases.ratio = document.getElementById('vizRatio');
        this.canvases.cents = document.getElementById('vizCents');
        this.canvases.harmonics = document.getElementById('vizHarmonics');
        this.canvases.wavelength = document.getElementById('vizWavelength');
        this.canvases.density = document.getElementById('vizDensity');
        this.canvases.colorCoded = document.getElementById('vizColorCoded');
        this.canvases.waveCounter = document.getElementById('vizWaveCounter');
        this.canvases.gridSpeed = document.getElementById('vizGridSpeed');

        // Wave counter state
        this.rootWaveCount = 0;
        this.targetWaveCount = 0;
        this.lastRootPhase = 0;
        this.lastTargetPhase = 0;
    }

    attachEventListeners() {
        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', () => this.exit());
        }
        if (this.playRootBtn) {
            this.playRootBtn.addEventListener('click', () => this.toggleRoot());
        }
        if (this.playTargetBtn) {
            this.playTargetBtn.addEventListener('click', () => this.toggleTarget());
        }
        if (this.playBothBtn) {
            this.playBothBtn.addEventListener('click', () => this.toggleBoth());
        }
        if (this.intervalSelect) {
            this.intervalSelect.addEventListener('change', (e) => {
                this.currentInterval = e.target.value;
                this.updateInterval();
            });
        }
        if (this.targetSlider) {
            this.targetSlider.addEventListener('input', (e) => {
                this.updateTargetFromSlider(parseFloat(e.target.value));
            });

            // Start playing when slider is grabbed
            this.targetSlider.addEventListener('mousedown', () => {
                this.sliderActive = true;
                if (!this.isPlayingTarget) {
                    this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
                    this.isPlayingTarget = true;
                }
            });

            this.targetSlider.addEventListener('touchstart', () => {
                this.sliderActive = true;
                if (!this.isPlayingTarget) {
                    this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
                    this.isPlayingTarget = true;
                }
            });

            // Stop playing when slider is released
            this.targetSlider.addEventListener('mouseup', () => {
                this.sliderActive = false;
                if (this.isPlayingTarget) {
                    this.targetToneGenerator.stopTone();
                    this.isPlayingTarget = false;
                    if (this.playTargetBtn) {
                        this.playTargetBtn.textContent = 'Play Target';
                    }
                }
            });

            this.targetSlider.addEventListener('touchend', () => {
                this.sliderActive = false;
                if (this.isPlayingTarget) {
                    this.targetToneGenerator.stopTone();
                    this.isPlayingTarget = false;
                    if (this.playTargetBtn) {
                        this.playTargetBtn.textContent = 'Play Target';
                    }
                }
            });

            // Handle case where mouse leaves window while dragging
            document.addEventListener('mouseup', () => {
                if (this.sliderActive) {
                    this.sliderActive = false;
                    if (this.isPlayingTarget) {
                        this.targetToneGenerator.stopTone();
                        this.isPlayingTarget = false;
                        if (this.playTargetBtn) {
                            this.playTargetBtn.textContent = 'Play Target';
                        }
                    }
                }
            });
        }
    }

    async start() {
        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';
        this.initializeCanvases();
        this.updateDisplay();
        this.animate();
    }

    initializeCanvases() {
        Object.values(this.canvases).forEach(canvas => {
            if (canvas) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
            }
        });
    }

    updateInterval() {
        const intervalRatios = {
            'unison': 1.0,
            'halfStep': Math.pow(2, 1/12),
            'wholeStep': Math.pow(2, 2/12),
            'minorThird': Math.pow(2, 3/12),
            'majorThird': Math.pow(2, 4/12),
            'perfectFourth': Math.pow(2, 5/12),
            'perfectFifth': Math.pow(2, 7/12),
            'octave': 2.0
        };

        this.targetFrequency = this.rootFrequency * intervalRatios[this.currentInterval];

        // Update slider to match the interval
        if (this.targetSlider) {
            const cents = 1200 * Math.log2(this.targetFrequency / this.rootFrequency);
            this.targetSlider.value = cents;
        }

        // Update playing tones if they're active
        if (this.isPlayingTarget) {
            this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
        }

        this.updateDisplay();
    }

    updateTargetFromSlider(cents) {
        // Convert cents to frequency ratio
        const ratio = Math.pow(2, cents / 1200);
        this.targetFrequency = this.rootFrequency * ratio;

        // Find closest interval for display purposes
        this.updateClosestInterval(cents);

        // Update playing tones if they're active (including during slider drag)
        if (this.isPlayingTarget || this.sliderActive) {
            this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
        }

        this.updateDisplay();
    }

    updateClosestInterval(cents) {
        const intervalCents = {
            'unison': 0,
            'halfStep': 100,
            'wholeStep': 200,
            'minorThird': 300,
            'majorThird': 400,
            'perfectFourth': 500,
            'perfectFifth': 700,
            'octave': 1200
        };

        let closestInterval = 'unison';
        let minDiff = Math.abs(cents);

        for (const [interval, intervalCent] of Object.entries(intervalCents)) {
            const diff = Math.abs(cents - intervalCent);
            if (diff < minDiff) {
                minDiff = diff;
                closestInterval = interval;
            }
        }

        // Only update dropdown if difference is within 10 cents (close to a named interval)
        if (minDiff < 10 && this.intervalSelect) {
            this.currentInterval = closestInterval;
            this.intervalSelect.value = closestInterval;
        } else {
            this.currentInterval = 'custom';
        }
    }

    toggleRoot() {
        if (this.isPlayingRoot) {
            this.rootToneGenerator.stopTone();
            this.isPlayingRoot = false;
            if (this.playRootBtn) {
                this.playRootBtn.textContent = 'Play Root';
            }
        } else {
            this.rootToneGenerator.playTone(this.rootFrequency, 0.3);
            this.isPlayingRoot = true;
            if (this.playRootBtn) {
                this.playRootBtn.textContent = 'Stop Root';
            }
        }
    }

    toggleTarget() {
        if (this.isPlayingTarget) {
            this.targetToneGenerator.stopTone();
            this.isPlayingTarget = false;
            if (this.playTargetBtn) {
                this.playTargetBtn.textContent = 'Play Target';
            }
        } else {
            this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
            this.isPlayingTarget = true;
            if (this.playTargetBtn) {
                this.playTargetBtn.textContent = 'Stop Target';
            }
        }
    }

    toggleBoth() {
        const anyPlaying = this.isPlayingRoot || this.isPlayingTarget;

        if (anyPlaying) {
            // Stop both
            this.rootToneGenerator.stopTone();
            this.targetToneGenerator.stopTone();
            this.isPlayingRoot = false;
            this.isPlayingTarget = false;
            if (this.playBothBtn) {
                this.playBothBtn.textContent = 'Play Both';
            }
            if (this.playRootBtn) {
                this.playRootBtn.textContent = 'Play Root';
            }
            if (this.playTargetBtn) {
                this.playTargetBtn.textContent = 'Play Target';
            }
        } else {
            // Play both
            this.rootToneGenerator.playTone(this.rootFrequency, 0.3);
            this.targetToneGenerator.playTone(this.targetFrequency, 0.3);
            this.isPlayingRoot = true;
            this.isPlayingTarget = true;
            if (this.playBothBtn) {
                this.playBothBtn.textContent = 'Stop Both';
            }
            if (this.playRootBtn) {
                this.playRootBtn.textContent = 'Stop Root';
            }
            if (this.playTargetBtn) {
                this.playTargetBtn.textContent = 'Stop Target';
            }
        }
    }

    updateDisplay() {
        const intervalNames = {
            'unison': 'Unison - Same Pitch',
            'halfStep': 'Half Step - Adjacent Notes',
            'wholeStep': 'Whole Step - Skip One Note',
            'minorThird': 'Minor Third - Sad Sound',
            'majorThird': 'Major Third - Happy Sound',
            'perfectFourth': 'Perfect Fourth - Open Sound',
            'perfectFifth': 'Perfect Fifth - Power Chord',
            'octave': 'Octave - Double Frequency',
            'custom': 'Custom Interval'
        };

        if (this.intervalNameDisplay) {
            const cents = Math.round(1200 * Math.log2(this.targetFrequency / this.rootFrequency));
            const intervalText = intervalNames[this.currentInterval] || 'Custom Interval';
            this.intervalNameDisplay.textContent = `${intervalText} (${cents} cents)`;
        }
        if (this.rootFreqDisplay) {
            this.rootFreqDisplay.textContent = `Root: ${this.rootFrequency.toFixed(1)} Hz`;
        }
        if (this.targetFreqDisplay) {
            const ratio = this.targetFrequency / this.rootFrequency;
            this.targetFreqDisplay.textContent = `Target: ${this.targetFrequency.toFixed(1)} Hz (${ratio.toFixed(3)}x)`;
        }
    }

    animate() {
        if (!this.container || this.container.style.display === 'none') return;

        Object.entries(this.canvases).forEach(([name, canvas]) => {
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });

        this.drawWaveInterference();
        this.drawBeatsVisualization();
        this.drawFrequencyRatio();
        this.drawCentsDistance();
        this.drawHarmonicsComparison();
        this.drawWavelengthSpacing();
        this.drawDensityBars();
        this.drawColorCodedFrequency();
        this.drawWaveCounter();
        this.drawGridSpeed();

        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    // 1. Wave Interference - Static snapshot showing waveform relationships
    drawWaveInterference() {
        const canvas = this.canvases.wave;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#00ffff';
        ctx.font = '11px monospace';
        ctx.fillText('Wave Interference - Static view of waveform relationships', 10, 15);

        const amplitude = height / 3;
        const centerY = height / 2;

        // Draw center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Calculate how many wavelengths to show based on frequencies
        // Show a fixed time window (e.g., enough to see a few cycles of the lower frequency)
        const wavelengthsToShow = 3;
        const lowerFreq = Math.min(this.rootFrequency, this.targetFrequency);
        const timeWindow = wavelengthsToShow / lowerFreq;

        // Draw root wave (cyan) - static, showing multiple wavelengths
        if (this.isPlayingRoot) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                // Map x position to time in the waveform
                const t = (x / width) * timeWindow;
                const phase = t * this.rootFrequency * Math.PI * 2;
                const y = centerY + Math.sin(phase) * amplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#00ffff';
            ctx.fillText('Root', 5, centerY - amplitude - 10);
        }

        // Draw target wave (magenta) - static, showing multiple wavelengths
        if (this.isPlayingTarget) {
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                // Map x position to time in the waveform
                const t = (x / width) * timeWindow;
                const phase = t * this.targetFrequency * Math.PI * 2;
                const y = centerY + Math.sin(phase) * amplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ff00ff';
            ctx.fillText('Target', 5, centerY + amplitude + 20);
        }

        // Show frequency info
        if (this.isPlayingRoot && this.isPlayingTarget) {
            const ratio = this.targetFrequency / this.rootFrequency;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '10px monospace';
            ctx.fillText(`Frequency Ratio: ${ratio.toFixed(3)}:1`, 10, height - 10);
        }
    }

    // 2. Beats - Shows combined wave moving with beating envelope
    drawBeatsVisualization() {
        const canvas = this.canvases.beats;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#39ff14';
        ctx.font = '11px monospace';
        ctx.fillText('Beats - Closer pitches create faster oscillations', 10, 15);

        const beatFreq = Math.abs(this.targetFrequency - this.rootFrequency);
        const amplitude = height / 3;
        const centerY = height / 2;

        // Draw center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Only draw if both are playing
        if (this.isPlayingRoot && this.isPlayingTarget) {
            // Draw combined wave with beats, moving across screen
            ctx.strokeStyle = '#39ff14';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#39ff14';
            ctx.beginPath();

            const avgFreq = (this.rootFrequency + this.targetFrequency) / 2;

            for (let x = 0; x < width; x++) {
                // Combined wave motion (75% slower = 25% speed)
                const phase = (x / 50) - (time * avgFreq / 240);
                const wave1 = Math.sin(phase * Math.PI * 2);
                const wave2 = Math.sin(phase * Math.PI * 2 * (this.targetFrequency / this.rootFrequency));

                // Beat envelope modulates the amplitude (75% slower)
                const beatPhase = (x / width * 2) - (time * beatFreq / 80);
                const envelope = Math.abs(Math.cos(beatPhase * Math.PI));

                const combined = (wave1 + wave2) / 2;
                const y = centerY + combined * amplitude * envelope;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Show beat frequency
            ctx.fillStyle = '#39ff14';
            ctx.fillText(`Beat Frequency: ${beatFreq.toFixed(1)} Hz`, 10, height - 10);
        } else {
            // Draw individual moving waves if only one is playing (75% slower)
            if (this.isPlayingRoot) {
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let x = 0; x < width; x++) {
                    const phase = (x / 50) - (time * this.rootFrequency / 240);
                    const y = centerY + Math.sin(phase * Math.PI * 2) * amplitude;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            if (this.isPlayingTarget) {
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let x = 0; x < width; x++) {
                    const phase = (x / 50) - (time * this.targetFrequency / 240);
                    const y = centerY + Math.sin(phase * Math.PI * 2) * amplitude;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }
    }

    // 3. Combined Wave Interference & Beats - Shows overlapping waves with beat envelope
    drawFrequencyRatio() {
        const canvas = this.canvases.ratio;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#b026ff';
        ctx.font = '11px monospace';
        ctx.fillText('Combined Waves - Both waves with beat envelope', 10, 15);

        const amplitude = height / 3.5;
        const beatAmplitude = amplitude * 0.5; // 50% of normal amplitude for beat envelope
        const centerY = height / 2;
        const beatFreq = Math.abs(this.targetFrequency - this.rootFrequency);

        // Draw center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Draw beat envelope (only if both are playing) - pulsing without moving
        if (this.isPlayingRoot && this.isPlayingTarget) {
            // Calculate current envelope value based on time and beat frequency
            const currentEnvelope = Math.abs(Math.cos(time * beatFreq * 2 * Math.PI));

            ctx.strokeStyle = 'rgba(176, 38, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);

            // Upper envelope - static shape, pulsing amplitude
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const y = centerY - currentEnvelope * beatAmplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Lower envelope - static shape, pulsing amplitude
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const y = centerY + currentEnvelope * beatAmplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw root wave (cyan) - translucent, moving (75% slower = 25% original speed)
        if (this.isPlayingRoot) {
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const phase = (x / 50) - (time * this.rootFrequency / 960); // 960 = 240 * 4 (75% slower)
                const y = centerY + Math.sin(phase * Math.PI * 2) * amplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Draw target wave (magenta) - translucent, moving (75% slower)
        if (this.isPlayingTarget) {
            ctx.strokeStyle = 'rgba(255, 0, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < width; x++) {
                const phase = (x / 50) - (time * this.targetFrequency / 960); // 75% slower
                const y = centerY + Math.sin(phase * Math.PI * 2) * amplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Draw combined wave (bright purple) - only if both playing, moving (75% slower)
        if (this.isPlayingRoot && this.isPlayingTarget) {
            ctx.strokeStyle = '#b026ff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#b026ff';
            ctx.beginPath();

            for (let x = 0; x < width; x++) {
                const phase1 = (x / 50) - (time * this.rootFrequency / 960); // 75% slower
                const phase2 = (x / 50) - (time * this.targetFrequency / 960); // 75% slower
                const wave1 = Math.sin(phase1 * Math.PI * 2);
                const wave2 = Math.sin(phase2 * Math.PI * 2);
                const combined = (wave1 + wave2) / 2;
                const y = centerY + combined * amplitude;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Show beat frequency and info
            ctx.fillStyle = '#b026ff';
            ctx.fillText(`Beat Frequency: ${beatFreq.toFixed(1)} Hz`, 10, height - 25);
            ctx.fillStyle = 'rgba(176, 38, 255, 0.7)';
            ctx.font = '10px monospace';
            ctx.fillText('Purple = Combined | Cyan = Root | Magenta = Target', 10, height - 10);
        } else {
            // Show instruction when not both playing
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px monospace';
            ctx.fillText('Play both notes to see wave interference and beating', width / 2 - 120, height - 15);
        }
    }

    // 4. Strobe Tuner - Multi-band patterns like a physical strobe tuner
    drawCentsDistance() {
        const canvas = this.canvases.cents;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#ff6600';
        ctx.font = '11px monospace';
        ctx.fillText('Strobe Tuner - When patterns stop moving, pitches align perfectly', 10, 15);

        const centerY = height / 2;
        const numBands = 5;
        const bandHeight = (height - 50) / numBands;
        const numStripes = 40;
        const stripeWidth = width / numStripes;

        // Calculate beat frequency (difference between the two tones)
        const beatFreq = Math.abs(this.targetFrequency - this.rootFrequency);

        // Calculate drift speed based on beat frequency
        const driftDirection = this.targetFrequency > this.rootFrequency ? 1 : -1;
        const driftSpeed = beatFreq * driftDirection;

        if (this.isPlayingRoot && this.isPlayingTarget) {
            // Draw multiple horizontal bands, each with different pattern phase and direction
            for (let band = 0; band < numBands; band++) {
                const bandY = 25 + band * bandHeight;

                // Alternate directions like Peterson/Sonic Research tuners
                // Bands 0, 2, 4 go right, bands 1, 3 go left
                const direction = (band % 2 === 0) ? 1 : -1;

                // Each band has a different phase offset for visual variety
                const phaseOffset = band * 0.4;
                const offset = ((time * driftSpeed * 5 * direction) + (phaseOffset * stripeWidth)) % (stripeWidth * 2);

                // Draw background for this band
                ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                ctx.fillRect(0, bandY, width, bandHeight);

                // Draw alternating pattern for this band
                for (let i = -2; i < numStripes + 2; i++) {
                    const x = i * stripeWidth + offset;
                    const isLight = i % 2 === 0;

                    if (isLight) {
                        // Different colors for each band for visual distinction
                        const colors = [
                            'rgba(255, 102, 0, 0.9)',   // Orange
                            'rgba(0, 255, 255, 0.9)',   // Cyan
                            'rgba(255, 0, 255, 0.9)',   // Magenta
                            'rgba(255, 255, 0, 0.9)',   // Yellow
                            'rgba(0, 255, 102, 0.9)'    // Green
                        ];
                        ctx.fillStyle = colors[band];
                        ctx.fillRect(x, bandY + 2, stripeWidth, bandHeight - 4);
                    }
                }

                // Draw band separator
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, bandY);
                ctx.lineTo(width, bandY);
                ctx.stroke();
            }

            // Draw center reference line (like a tuning needle)
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ff00';
            ctx.beginPath();
            ctx.moveTo(width / 2, 25);
            ctx.lineTo(width / 2, 25 + (numBands * bandHeight));
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Draw center reference arrows
            ctx.fillStyle = '#00ff00';

            // Top arrow
            ctx.beginPath();
            ctx.moveTo(width / 2, 20);
            ctx.lineTo(width / 2 - 8, 30);
            ctx.lineTo(width / 2 + 8, 30);
            ctx.closePath();
            ctx.fill();

            // Bottom arrow
            ctx.beginPath();
            ctx.moveTo(width / 2, 25 + (numBands * bandHeight) + 5);
            ctx.lineTo(width / 2 - 8, 25 + (numBands * bandHeight) - 5);
            ctx.lineTo(width / 2 + 8, 25 + (numBands * bandHeight) - 5);
            ctx.closePath();
            ctx.fill();

            // Show tuning status
            const centsOff = Math.round(1200 * Math.log2(this.targetFrequency / this.rootFrequency));

            if (Math.abs(beatFreq) < 0.5) {
                ctx.fillStyle = '#00ff00';
                ctx.font = 'bold 12px monospace';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#00ff00';
                ctx.fillText('IN TUNE ✓', width / 2 - 45, height - 8);
                ctx.shadowBlur = 0;
            } else if (Math.abs(beatFreq) < 2) {
                ctx.fillStyle = '#ffff00';
                ctx.font = 'bold 11px monospace';
                const dir = driftDirection > 0 ? 'sharp ↑' : 'flat ↓';
                ctx.fillText(`Close - slightly ${dir}`, width / 2 - 70, height - 8);
            } else if (Math.abs(beatFreq) < 10) {
                ctx.fillStyle = '#ff9900';
                ctx.font = 'bold 11px monospace';
                const dir = driftDirection > 0 ? '→→→' : '←←←';
                ctx.fillText(`Drifting ${dir}`, width / 2 - 50, height - 8);
            } else {
                ctx.fillStyle = '#ff0000';
                ctx.font = 'bold 11px monospace';
                const dir = driftDirection > 0 ? '→→→' : '←←←';
                ctx.fillText(`Far apart ${dir}`, width / 2 - 50, height - 8);
            }

            // Show cents difference
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '10px monospace';
            ctx.fillText(`${centsOff} cents apart`, width / 2 - 45, height - 20);

        } else if (this.isPlayingRoot || this.isPlayingTarget) {
            // Show single tone indication
            ctx.fillStyle = 'rgba(255, 102, 0, 0.3)';
            ctx.font = '12px monospace';
            ctx.fillText('Play both tones to see strobe tuning', width / 2 - 90, centerY);
        } else {
            // Show instructions
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px monospace';
            ctx.fillText('Play both notes - patterns stop moving when in tune', width / 2 - 130, centerY);
        }
    }

    // 5. Tuning Fork Visualization - Shows vibrating tuning forks
    drawHarmonicsComparison() {
        const canvas = this.canvases.harmonics;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#ffff00';
        ctx.font = '11px monospace';
        ctx.fillText('Tuning Fork - Visualizing frequency vibrations', 10, 15);

        const centerY = height / 2;

        // Draw root tuning fork (left side)
        if (this.isPlayingRoot) {
            const leftX = width / 4;
            this.drawTuningFork(ctx, leftX, centerY, this.rootFrequency, time, '#00ffff', 'Root');
        }

        // Draw target tuning fork (right side)
        if (this.isPlayingTarget) {
            const rightX = (width * 3) / 4;
            this.drawTuningFork(ctx, rightX, centerY, this.targetFrequency, time, '#ff00ff', 'Target');
        }

        // Draw interference where sound waves meet (only if both playing)
        if (this.isPlayingRoot && this.isPlayingTarget) {
            const leftX = width / 4;
            const rightX = (width * 3) / 4;
            const intersectionX = width / 2;
            const intersectionY = centerY - 40; // Same height as fork emission point

            // Calculate beat frequency and beat phase
            const beatFreq = Math.abs(this.targetFrequency - this.rootFrequency);

            // Slow down beat visualization for human perception
            const beatPhase = time * beatFreq * 0.5 * Math.PI;
            const beatIntensity = (Math.cos(beatPhase) + 1) / 2; // 0 to 1

            // Draw visible interference patterns - show constructive/destructive interference
            const numInterferenceRings = 5;
            for (let i = 0; i < numInterferenceRings; i++) {
                // Alternate between constructive (bright) and destructive (dim) interference
                const ringPhase = (beatPhase / Math.PI + i * 0.5) % 2;
                const isConstructive = ringPhase < 1;

                const ringRadius = 15 + i * 25;
                const baseAlpha = isConstructive ? beatIntensity : (1 - beatIntensity);
                const alpha = baseAlpha * 0.5 * (1 - i / numInterferenceRings);

                if (alpha > 0.05) {
                    // Constructive = bright yellow/white, Destructive = dim orange
                    const colorR = isConstructive ? 255 : 200;
                    const colorG = isConstructive ? 255 : 150;
                    const colorB = isConstructive ? 100 : 0;

                    ctx.strokeStyle = `rgba(${colorR}, ${colorG}, ${colorB}, ${alpha})`;
                    ctx.lineWidth = isConstructive ? 4 : 2;
                    ctx.beginPath();
                    ctx.arc(intersectionX, intersectionY, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }

            // Draw center pulse
            const pulseRadius = 8 + beatIntensity * 15;
            const gradient = ctx.createRadialGradient(intersectionX, intersectionY, 0,
                                                      intersectionX, intersectionY, pulseRadius);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${beatIntensity * 0.9})`);
            gradient.addColorStop(0.6, `rgba(255, 255, 0, ${beatIntensity * 0.5})`);
            gradient.addColorStop(1, `rgba(255, 150, 0, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(intersectionX, intersectionY, pulseRadius, 0, Math.PI * 2);
            ctx.fill();

            // Beat frequency label with state
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 11px monospace';
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#ffff00';
            const interferenceState = beatIntensity > 0.6 ? 'Constructive' : beatIntensity < 0.4 ? 'Destructive' : 'Neutral';
            ctx.fillText(`Beat: ${beatFreq.toFixed(1)} Hz (${interferenceState})`, intersectionX - 80, intersectionY + 60);
            ctx.shadowBlur = 0;
        }

        // Show instructions
        if (!this.isPlayingRoot && !this.isPlayingTarget) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px monospace';
            ctx.fillText('Play notes to see tuning fork vibrations', width / 2 - 90, centerY);
        }
    }

    // Helper: Draw simple tuning fork
    drawSimpleFork(ctx, centerX, centerY, frequency, time, color, label) {
        const vibrationPhase = time * frequency * Math.PI * 0.125;
        const displacement = Math.sin(vibrationPhase) * 15;

        const handleWidth = 8;
        const handleHeight = 60;
        const handleTop = centerY + 40;
        const prongWidth = 6;
        const prongHeight = 80;
        const prongSeparation = 30;

        // Handle
        ctx.fillStyle = 'rgba(128, 128, 128, 0.8)';
        ctx.fillRect(centerX - handleWidth / 2, handleTop, handleWidth, handleHeight);

        // Prongs
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        const leftProngX = centerX - prongSeparation / 2 - prongWidth + displacement;
        ctx.fillRect(leftProngX, centerY - prongHeight, prongWidth, prongHeight);
        const rightProngX = centerX + prongSeparation / 2 - displacement;
        ctx.fillRect(rightProngX, centerY - prongHeight, prongWidth, prongHeight);

        // Connecting base
        ctx.fillRect(centerX - prongSeparation / 2 - prongWidth, centerY - 10,
                     prongSeparation + prongWidth * 2, 10);
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(label, centerX - 20, centerY + handleHeight + 75);
        ctx.font = '10px monospace';
        ctx.fillText(`${frequency.toFixed(1)} Hz`, centerX - 25, centerY + handleHeight + 90);
    }

    // Helper: Draw interference pulse
    drawInterferencePulse(ctx, centerX, centerY, time, rootFreq, targetFreq) {
        const beatFreq = Math.abs(targetFreq - rootFreq);
        const beatPhase = time * beatFreq * 0.5 * Math.PI;
        const beatIntensity = (Math.cos(beatPhase) + 1) / 2;

        // Center pulse
        const pulseRadius = 8 + beatIntensity * 15;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseRadius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${beatIntensity * 0.9})`);
        gradient.addColorStop(0.6, `rgba(255, 255, 0, ${beatIntensity * 0.5})`);
        gradient.addColorStop(1, `rgba(255, 150, 0, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Interference rings
        const numInterferenceRings = 3;
        for (let i = 0; i < numInterferenceRings; i++) {
            const ringPhase = (beatPhase / Math.PI + i * 0.5) % 2;
            const isConstructive = ringPhase < 1;

            const ringRadius = 15 + i * 20;
            const baseAlpha = isConstructive ? beatIntensity : (1 - beatIntensity);
            const alpha = baseAlpha * 0.4 * (1 - i / numInterferenceRings);

            if (alpha > 0.05) {
                const colorR = isConstructive ? 255 : 200;
                const colorG = isConstructive ? 255 : 150;
                const colorB = isConstructive ? 100 : 0;

                ctx.strokeStyle = `rgba(${colorR}, ${colorG}, ${colorB}, ${alpha})`;
                ctx.lineWidth = isConstructive ? 3 : 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Beat label
        ctx.fillStyle = '#ffff00';
        ctx.font = '10px monospace';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffff00';
        const interferenceState = beatIntensity > 0.6 ? 'Constructive' : beatIntensity < 0.4 ? 'Destructive' : 'Neutral';
        ctx.fillText(`Beat: ${beatFreq.toFixed(1)} Hz (${interferenceState})`, centerX - 70, centerY + 45);
        ctx.shadowBlur = 0;
    }

    drawTuningFork(ctx, centerX, centerY, frequency, time, color, label) {
        // Calculate vibration displacement based on frequency and time (slowed down by 93.75% total - half as slow)
        const vibrationPhase = time * frequency * Math.PI * 0.125; // Half the previous speed
        const displacement = Math.sin(vibrationPhase) * 15; // Max 15 pixels displacement

        // Draw handle (base) - doesn't vibrate
        const handleWidth = 8;
        const handleHeight = 60;
        const handleTop = centerY + 40;

        ctx.fillStyle = 'rgba(128, 128, 128, 0.8)';
        ctx.fillRect(centerX - handleWidth / 2, handleTop, handleWidth, handleHeight);

        // Draw U-shaped tuning fork prongs
        const prongWidth = 6;
        const prongHeight = 80;
        const prongSeparation = 30;

        // Left prong - vibrates left
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        const leftProngX = centerX - prongSeparation / 2 - prongWidth + displacement;
        ctx.fillRect(leftProngX, centerY - prongHeight, prongWidth, prongHeight);

        // Right prong - vibrates right
        const rightProngX = centerX + prongSeparation / 2 - displacement;
        ctx.fillRect(rightProngX, centerY - prongHeight, prongWidth, prongHeight);

        // Draw connecting base (U bottom)
        ctx.fillRect(
            centerX - prongSeparation / 2 - prongWidth,
            centerY - 10,
            prongSeparation + prongWidth * 2,
            10
        );
        ctx.shadowBlur = 0;

        // Draw pulsing waves emanating from the fork - scaled by frequency for human perception
        const emissionY = centerY - prongHeight / 2;
        const numWaves = 8;
        const maxRadius = 150;

        // Scale wave speed based on frequency - normalize to human-perceivable range
        // Lower frequencies = slower waves, higher frequencies = faster waves
        const frequencyScale = frequency / 440; // Relative to A440
        const waveSpeed = 0.5 + (frequencyScale * 0.3); // Range: 0.5x to ~0.8x base speed

        for (let i = 0; i < numWaves; i++) {
            // Each wave starts at a different phase offset
            const phaseOffset = (i / numWaves) * Math.PI * 2;

            // Slow expansion based on time and frequency
            const expansionPhase = (time * waveSpeed * 0.5) + phaseOffset;
            const waveRadius = 30 + ((expansionPhase % (Math.PI * 2)) / (Math.PI * 2)) * maxRadius;

            // Calculate alpha based on distance (fade out as waves expand)
            const alpha = Math.max(0, 0.8 * (1 - (waveRadius - 30) / maxRadius));

            if (alpha > 0.05 && waveRadius <= 30 + maxRadius) {
                ctx.strokeStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
                ctx.lineWidth = 2 + (alpha * 2); // Thicker when closer

                // Draw circular wave
                ctx.beginPath();
                ctx.arc(centerX, emissionY, waveRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(label, centerX - 20, centerY + handleHeight + 75);
        ctx.font = '10px monospace';
        ctx.fillText(`${frequency.toFixed(1)} Hz`, centerX - 25, centerY + handleHeight + 90);
    }

    // 6. Tuning Forks - Wavelength Spacing (ring spacing proportional to wavelength)
    drawWavelengthSpacing() {
        const canvas = this.canvases.wavelength;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#00ffaa';
        ctx.font = '11px monospace';
        ctx.fillText('Wavelength Spacing - Lower freq = wider gaps between rings', 10, 15);

        const centerY = height / 2;
        const leftX = width / 4;
        const rightX = (width * 3) / 4;

        // Draw root fork (left) with wavelength-based spacing
        if (this.isPlayingRoot) {
            this.drawSimpleFork(ctx, leftX, centerY, this.rootFrequency, time, '#00ffff', 'Root');

            const wavelength = 343 / this.rootFrequency; // Speed of sound / frequency (in meters)
            const pixelsPerMeter = 30; // Scale factor
            const ringSpacing = wavelength * pixelsPerMeter;

            // Draw expanding rings with wavelength spacing
            const numRings = 6;
            for (let i = 0; i < numRings; i++) {
                const phase = (time * 2 + i * 0.5) % numRings;
                const radius = 30 + phase * ringSpacing;
                const alpha = Math.max(0, 0.7 * (1 - phase / numRings));

                if (alpha > 0.05) {
                    ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(leftX, centerY - 40, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        // Draw target fork (right) with wavelength-based spacing
        if (this.isPlayingTarget) {
            this.drawSimpleFork(ctx, rightX, centerY, this.targetFrequency, time, '#ff00ff', 'Target');

            const wavelength = 343 / this.targetFrequency;
            const pixelsPerMeter = 30;
            const ringSpacing = wavelength * pixelsPerMeter;

            const numRings = 6;
            for (let i = 0; i < numRings; i++) {
                const phase = (time * 2 + i * 0.5) % numRings;
                const radius = 30 + phase * ringSpacing;
                const alpha = Math.max(0, 0.7 * (1 - phase / numRings));

                if (alpha > 0.05) {
                    ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(rightX, centerY - 40, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        // Draw interference pulse
        if (this.isPlayingRoot && this.isPlayingTarget) {
            this.drawInterferencePulse(ctx, width / 2, centerY - 40, time, this.rootFrequency, this.targetFrequency);
        }

        // Instructions
        if (!this.isPlayingRoot && !this.isPlayingTarget) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px monospace';
            ctx.fillText('Higher frequency = rings closer together', width / 2 - 100, centerY);
        }
    }

    // 7. Tuning Forks - Density Bars (show wave compression with bars and forks)
    drawDensityBars() {
        const canvas = this.canvases.density;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#ffaa00';
        ctx.font = '11px monospace';
        ctx.fillText('Wave Density - How many waves fit in fixed space', 10, 15);

        const centerY = height / 2;
        const leftX = width / 5;
        const rightX = (width * 4) / 5;
        const barWidth = width / 2.5;
        const barHeight = 40;

        // Root fork and density bar
        if (this.isPlayingRoot) {
            // Small fork on left
            this.drawSimpleFork(ctx, leftX - 40, centerY - 40, this.rootFrequency, time, '#00ffff', '');

            const rootBarY = centerY - 60;

            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.fillRect(leftX, rootBarY, barWidth, barHeight);

            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(leftX, rootBarY, barWidth, barHeight);

            // Draw wave cycles
            const cyclesInView = 8;
            const wavelength = barWidth / cyclesInView;
            const actualWavelength = wavelength * (440 / this.rootFrequency);

            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x <= barWidth; x++) {
                const phase = ((x + time * 30) / actualWavelength) * Math.PI * 2;
                const y = rootBarY + barHeight / 2 + Math.sin(phase) * (barHeight / 3);
                if (x === 0) ctx.moveTo(leftX + x, y);
                else ctx.lineTo(leftX + x, y);
            }
            ctx.stroke();

            ctx.fillStyle = '#00ffff';
            ctx.font = '10px monospace';
            ctx.fillText(`Root: ${this.rootFrequency.toFixed(1)} Hz`, leftX, rootBarY - 8);
        }

        // Target fork and density bar
        if (this.isPlayingTarget) {
            this.drawSimpleFork(ctx, rightX + 40, centerY + 30, this.targetFrequency, time, '#ff00ff', '');

            const targetBarY = centerY + 10;

            ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
            ctx.fillRect(rightX - barWidth, targetBarY, barWidth, barHeight);

            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(rightX - barWidth, targetBarY, barWidth, barHeight);

            const cyclesInView = 8;
            const wavelength = barWidth / cyclesInView;
            const actualWavelength = wavelength * (440 / this.targetFrequency);

            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x <= barWidth; x++) {
                const phase = ((x + time * 30) / actualWavelength) * Math.PI * 2;
                const y = targetBarY + barHeight / 2 + Math.sin(phase) * (barHeight / 3);
                if (x === 0) ctx.moveTo(rightX - barWidth + x, y);
                else ctx.lineTo(rightX - barWidth + x, y);
            }
            ctx.stroke();

            ctx.fillStyle = '#ff00ff';
            ctx.font = '10px monospace';
            ctx.fillText(`Target: ${this.targetFrequency.toFixed(1)} Hz`, rightX - barWidth, targetBarY - 8);
        }

        // Draw interference pulse in center
        if (this.isPlayingRoot && this.isPlayingTarget) {
            this.drawInterferencePulse(ctx, width / 2, centerY - 15, time, this.rootFrequency, this.targetFrequency);
        }

        if (!this.isPlayingRoot && !this.isPlayingTarget) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px monospace';
            ctx.fillText('Higher frequency = more compressed waves', width / 2 - 100, centerY);
        }
    }

    // 8. Tuning Forks - Color-Coded Frequency (temperature mapping with forks)
    drawColorCodedFrequency() {
        const canvas = this.canvases.colorCoded;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.fillText('Color-Coded - Red=Low, Orange=Mid, Cyan=High frequency', 10, 15);

        const centerY = height / 2;
        const leftX = width / 4;
        const rightX = (width * 3) / 4;

        // Helper function to get frequency color
        const getFreqColor = (freq) => {
            const minFreq = 200;
            const maxFreq = 800;
            const normalized = Math.max(0, Math.min(1, (freq - minFreq) / (maxFreq - minFreq)));

            let r, g, b;
            if (normalized < 0.5) {
                r = 255;
                g = Math.floor(normalized * 2 * 255);
                b = 0;
            } else {
                r = Math.floor((1 - (normalized - 0.5) * 2) * 255);
                g = 255;
                b = Math.floor((normalized - 0.5) * 2 * 255);
            }
            return { r, g, b };
        };

        // Draw root fork with color-coded waves
        if (this.isPlayingRoot) {
            const color = getFreqColor(this.rootFrequency);
            const colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`;

            // Draw fork in frequency color
            this.drawColoredFork(ctx, leftX, centerY, this.rootFrequency, time, colorStr, 'Root');

            // Draw pulsing color-coded rings
            const numRings = 5;
            for (let i = 0; i < numRings; i++) {
                const phase = (time * 1.5 + i * 0.6) % numRings;
                const radius = 30 + phase * 25;
                const alpha = Math.max(0, 0.8 * (1 - phase / numRings));

                ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 10;
                ctx.shadowColor = colorStr;
                ctx.beginPath();
                ctx.arc(leftX, centerY - 40, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }

        // Draw target fork with color-coded waves
        if (this.isPlayingTarget) {
            const color = getFreqColor(this.targetFrequency);
            const colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`;

            this.drawColoredFork(ctx, rightX, centerY, this.targetFrequency, time, colorStr, 'Target');

            const numRings = 5;
            for (let i = 0; i < numRings; i++) {
                const phase = (time * 1.5 + i * 0.6) % numRings;
                const radius = 30 + phase * 25;
                const alpha = Math.max(0, 0.8 * (1 - phase / numRings));

                ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.shadowBlur = 10;
                ctx.shadowColor = colorStr;
                ctx.beginPath();
                ctx.arc(rightX, centerY - 40, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        }

        // Draw interference pulse
        if (this.isPlayingRoot && this.isPlayingTarget) {
            this.drawInterferencePulse(ctx, width / 2, centerY - 40, time, this.rootFrequency, this.targetFrequency);
        }
    }

    // Helper: Draw colored fork
    drawColoredFork(ctx, centerX, centerY, frequency, time, color, label) {
        const vibrationPhase = time * frequency * Math.PI * 0.125;
        const displacement = Math.sin(vibrationPhase) * 15;

        const handleWidth = 8;
        const handleHeight = 60;
        const handleTop = centerY + 40;
        const prongWidth = 6;
        const prongHeight = 80;
        const prongSeparation = 30;

        // Handle
        ctx.fillStyle = 'rgba(128, 128, 128, 0.8)';
        ctx.fillRect(centerX - handleWidth / 2, handleTop, handleWidth, handleHeight);

        // Prongs in frequency color
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        const leftProngX = centerX - prongSeparation / 2 - prongWidth + displacement;
        ctx.fillRect(leftProngX, centerY - prongHeight, prongWidth, prongHeight);
        const rightProngX = centerX + prongSeparation / 2 - displacement;
        ctx.fillRect(rightProngX, centerY - prongHeight, prongWidth, prongHeight);

        ctx.fillRect(centerX - prongSeparation / 2 - prongWidth, centerY - 10,
                     prongSeparation + prongWidth * 2, 10);
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(label, centerX - 20, centerY + handleHeight + 75);
        ctx.font = '10px monospace';
        ctx.fillText(`${frequency.toFixed(1)} Hz`, centerX - 25, centerY + handleHeight + 90);
    }

    // 9. Tuning Forks - Wave Counter (real-time frequency counter with forks)
    drawWaveCounter() {
        const canvas = this.canvases.waveCounter;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#ff00aa';
        ctx.font = '11px monospace';
        ctx.fillText('Wave Counter - Counts waves passing reference line', 10, 15);

        const centerY = height / 2;
        const refLineX = width / 2;
        const leftForkX = width / 6;
        const rightForkX = (width * 5) / 6;

        // Draw reference line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(refLineX, 30);
        ctx.lineTo(refLineX, height - 30);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText('REF', refLineX - 15, 25);

        // Root fork and wave counter
        if (this.isPlayingRoot) {
            this.drawSimpleFork(ctx, leftForkX, centerY - 20, this.rootFrequency, time, '#00ffff', '');

            const rootY = centerY - 60;

            // Draw moving wave from fork to ref line
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = leftForkX; x < refLineX + 50; x++) {
                const phase = ((x - time * this.rootFrequency * 0.5) / 30) * Math.PI * 2;
                const y = rootY + Math.sin(phase) * 20;
                if (x === leftForkX) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Count waves
            const currentPhase = ((refLineX - time * this.rootFrequency * 0.5) / 30) * Math.PI * 2;
            const normalizedPhase = currentPhase % (Math.PI * 2);

            if (this.lastRootPhase > Math.PI && normalizedPhase <= Math.PI) {
                this.rootWaveCount++;
            }
            this.lastRootPhase = normalizedPhase;

            // Display counter
            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 16px monospace';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.fillText(`${this.rootWaveCount}`, refLineX + 15, rootY + 5);
            ctx.shadowBlur = 0;

            ctx.font = '10px monospace';
            ctx.fillText(`Root: ${this.rootFrequency.toFixed(1)} Hz`, leftForkX - 35, centerY + 80);
        }

        // Target fork and wave counter
        if (this.isPlayingTarget) {
            this.drawSimpleFork(ctx, rightForkX, centerY + 50, this.targetFrequency, time, '#ff00ff', '');

            const targetY = centerY + 10;

            // Draw moving wave from fork to ref line
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = rightForkX; x > refLineX - 50; x--) {
                const phase = ((x + time * this.targetFrequency * 0.5) / 30) * Math.PI * 2;
                const y = targetY + Math.sin(phase) * 20;
                if (x === rightForkX) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Count waves
            const currentPhase = ((refLineX + time * this.targetFrequency * 0.5) / 30) * Math.PI * 2;
            const normalizedPhase = currentPhase % (Math.PI * 2);

            if (this.lastTargetPhase > Math.PI && normalizedPhase <= Math.PI) {
                this.targetWaveCount++;
            }
            this.lastTargetPhase = normalizedPhase;

            // Display counter
            ctx.fillStyle = '#ff00ff';
            ctx.font = 'bold 16px monospace';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff00ff';
            ctx.fillText(`${this.targetWaveCount}`, refLineX + 15, targetY + 5);
            ctx.shadowBlur = 0;

            ctx.font = '10px monospace';
            ctx.fillText(`Target: ${this.targetFrequency.toFixed(1)} Hz`, rightForkX - 40, centerY + 150);
        }

        // Draw interference pulse at ref line
        if (this.isPlayingRoot && this.isPlayingTarget) {
            this.drawInterferencePulse(ctx, refLineX, centerY - 25, time, this.rootFrequency, this.targetFrequency);
        }

        if (!this.isPlayingRoot && !this.isPlayingTarget) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px monospace';
            ctx.fillText('Higher frequency = faster count', width / 2 - 80, centerY);
        }
    }

    // 10. Tuning Forks - Grid Speed (motion speed comparison with forks)
    drawGridSpeed() {
        const canvas = this.canvases.gridSpeed;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;

        ctx.fillStyle = '#00ff00';
        ctx.font = '11px monospace';
        ctx.fillText('Motion Speed - Higher frequency = faster wave motion', 10, 15);

        // Draw reference grid
        const gridSpacing = 30;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x < width; x += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 30);
            ctx.lineTo(x, height - 30);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 30; y < height - 30; y += gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        const centerY = height / 2;
        const rootY = centerY - 30;
        const targetY = centerY + 40;
        const leftForkX = 60;
        const rightForkX = width - 60;

        // Root fork and wave
        if (this.isPlayingRoot) {
            this.drawSimpleFork(ctx, leftForkX, rootY, this.rootFrequency, time, '#00ffff', '');

            const speed = this.rootFrequency / 440;
            const offset = (time * speed * 100) % gridSpacing;

            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ffff';
            ctx.beginPath();
            for (let x = leftForkX + 50; x < width; x++) {
                const phase = ((x - offset * 3) / 40) * Math.PI * 2;
                const y = rootY - 40 + Math.sin(phase) * 25;
                if (x === leftForkX + 50) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Speed indicator
            ctx.fillStyle = '#00ffff';
            ctx.font = '10px monospace';
            ctx.fillText(`${speed.toFixed(2)}x speed`, leftForkX - 25, rootY + 80);

            // Motion arrow
            const arrowX = width - 100;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(arrowX, rootY - 40);
            ctx.lineTo(arrowX + 30, rootY - 40);
            ctx.lineTo(arrowX + 25, rootY - 45);
            ctx.moveTo(arrowX + 30, rootY - 40);
            ctx.lineTo(arrowX + 25, rootY - 35);
            ctx.stroke();
        }

        // Target fork and wave
        if (this.isPlayingTarget) {
            this.drawSimpleFork(ctx, rightForkX, targetY, this.targetFrequency, time, '#ff00ff', '');

            const speed = this.targetFrequency / 440;
            const offset = (time * speed * 100) % gridSpacing;

            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            for (let x = rightForkX - 50; x > 0; x--) {
                const phase = ((x + offset * 3) / 40) * Math.PI * 2;
                const y = targetY - 40 + Math.sin(phase) * 25;
                if (x === rightForkX - 50) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#ff00ff';
            ctx.font = '10px monospace';
            ctx.fillText(`${speed.toFixed(2)}x speed`, rightForkX - 30, targetY + 80);

            // Motion arrow (pointing left)
            const arrowX = 100;
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(arrowX, targetY - 40);
            ctx.lineTo(arrowX - 30, targetY - 40);
            ctx.lineTo(arrowX - 25, targetY - 45);
            ctx.moveTo(arrowX - 30, targetY - 40);
            ctx.lineTo(arrowX - 25, targetY - 35);
            ctx.stroke();
        }

        // Draw interference pulse in center
        if (this.isPlayingRoot && this.isPlayingTarget) {
            this.drawInterferencePulse(ctx, width / 2, centerY - 40, time, this.rootFrequency, this.targetFrequency);
        }

        if (!this.isPlayingRoot && !this.isPlayingTarget) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '11px monospace';
            ctx.fillText('Watch waves move across grid at different speeds', width / 2 - 120, centerY);
        }
    }

    exit() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.rootToneGenerator.stopTone();
        this.targetToneGenerator.stopTone();
        this.isPlayingRoot = false;
        this.isPlayingTarget = false;
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
        if (window.mainApp) {
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pitchVisualization = new PitchVisualization();
    });
} else {
    window.pitchVisualization = new PitchVisualization();
}
