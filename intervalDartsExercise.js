// Interval Darts Exercise - Base Class
// Match interval accuracy game - plays root, sing the interval
class IntervalDartsExercise {
    constructor(intervalName, intervalRatio, exerciseId, containerId) {
        this.intervalName = intervalName; // "Unison", "Half-Step", "Whole-Step"
        this.intervalRatio = intervalRatio; // 1.0, Math.pow(2, 1/12), Math.pow(2, 2/12)
        this.exerciseId = exerciseId;
        this.containerId = containerId;

        this.toneGenerator = new ToneGenerator();
        this.pitchDetector = null; // Created lazily on first use
        this.vocalRange = null;
        this.rootFrequency = null;
        this.targetFrequency = null; // The interval we're trying to sing
        this.isPlayingTone = false;
        this.isListening = false;
        this.totalScore = 0;
        this.roundsPlayed = 0;
        this.detectionInterval = null;
        this.listeningStartTime = null;
        this.matchDuration = 1000; // 1 second to match
        this.bestMatch = null; // Track best match during listening period
        this.datsRightAudioBuffer = null; // Store loaded audio buffer for hits
        this.missAudioBuffer = null; // Store loaded audio buffer for misses
        this.dartboardAudioBuffer = null; // Store dartboard impacts for accuracy-based sounds

        // Car mode state
        this.isCarMode = false;
        this.carModeLives = 5;
        this.carModePhase = null; // 'listen', 'countdown', 'sing', 'result'
        this.carModeTimers = []; // Track all car mode timers for cleanup

        this.initializeElements();
        this.attachEventListeners();
        this.loadDartSounds();
    }

    initializeElements() {
        this.container = document.getElementById(this.containerId);
        this.dartboard = document.getElementById(`${this.exerciseId}Dartboard`);
        this.scoreDisplay = document.getElementById(`${this.exerciseId}Score`);
        this.roundsDisplay = document.getElementById(`${this.exerciseId}Rounds`);
        this.playBtn = document.getElementById(`${this.exerciseId}PlayBtn`);
        this.playIcon = document.getElementById(`${this.exerciseId}PlayIcon`);
        this.exitBtn = document.getElementById(`${this.exerciseId}ExitBtn`);
    }

    attachEventListeners() {
        if (!this.playBtn || !this.exitBtn) {
            console.error(`IntervalDartsExercise: Missing elements for ${this.exerciseId}`);
            return;
        }
        this.playBtn.addEventListener('click', () => this.handlePlayButton());
        this.exitBtn.addEventListener('click', () => this.exit());
    }

    async loadDartSounds() {
        try {
            const audioContext = window.audioManager.getAudioContext();
            if (!audioContext) {
                // Audio context will be created on first user interaction
                return;
            }

            // Load all three sound files
            const [datsRightResponse, missResponse, dartboardResponse] = await Promise.all([
                fetch('datsright.wav'),
                fetch('miss.wav'),
                fetch('dartboard.wav')
            ]);

            const [datsRightArrayBuffer, missArrayBuffer, dartboardArrayBuffer] = await Promise.all([
                datsRightResponse.arrayBuffer(),
                missResponse.arrayBuffer(),
                dartboardResponse.arrayBuffer()
            ]);

            this.datsRightAudioBuffer = await audioContext.decodeAudioData(datsRightArrayBuffer);
            this.missAudioBuffer = await audioContext.decodeAudioData(missArrayBuffer);
            this.dartboardAudioBuffer = await audioContext.decodeAudioData(dartboardArrayBuffer);

            console.log('Interval Darts: All sounds loaded successfully!');
        } catch (error) {
            console.error('Failed to load dart sounds:', error);
        }
    }

    async start() {
        // Get vocal range
        this.vocalRange = appSettings.getVocalRange();

        if (!this.vocalRange || !this.vocalRange.low || !this.vocalRange.high) {
            alert('Please set your vocal range first!');
            return;
        }

        // Check if car mode
        const usageMode = appSettings.getUsageMode();
        this.isCarMode = (usageMode === 'car-mode');

        // Show exercise
        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';

        // Reset state
        this.totalScore = 0;
        this.roundsPlayed = 0;
        this.carModeLives = 5;
        this.updateScore();
        this.clearDartboard();

        // Ready for first tone
        if (this.isCarMode) {
            this.playBtn.textContent = 'Start Round';
            this.playIcon.textContent = '▶';
        } else {
            this.playBtn.textContent = 'Play Root';
            this.playIcon.textContent = '▶';
        }
    }

    async handlePlayButton() {
        if (this.isCarMode) {
            // Car mode flow
            if (this.carModePhase === null) {
                await this.startCarModeRound();
            }
        } else {
            // Normal mode flow
            if (!this.isPlayingTone && !this.isListening) {
                // Play the root tone
                await this.playRootTone();
            } else if (this.isListening) {
                // Stop listening early (optional)
                this.stopListening();
            }
        }
    }

    async playRootTone() {
        // Generate random frequency in vocal range
        const MIN_FREQUENCY = 174.61; // F3
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;

        // Randomly choose to go up or down
        this.goingUp = Math.random() < 0.5;

        // Make sure target interval frequency stays within range
        let maxRootFreq, minRootFreq, constrainedLowFreq, constrainedHighFreq;

        if (this.goingUp) {
            // Going up: root * ratio must be <= highFreq
            maxRootFreq = highFreq / this.intervalRatio;
            constrainedLowFreq = lowFreq;
            constrainedHighFreq = Math.min(maxRootFreq, highFreq);
        } else {
            // Going down: root / ratio must be >= lowFreq
            minRootFreq = lowFreq * this.intervalRatio;
            constrainedLowFreq = Math.max(minRootFreq, lowFreq);
            constrainedHighFreq = highFreq;
        }

        this.rootFrequency = this.toneGenerator.getRandomFrequencyInRange(constrainedLowFreq, constrainedHighFreq);
        this.targetFrequency = this.goingUp ?
            this.rootFrequency * this.intervalRatio :
            this.rootFrequency / this.intervalRatio;

        // Play root tone for 2 seconds
        this.isPlayingTone = true;
        const direction = this.goingUp ? 'Up ↑' : 'Down ↓';
        this.playBtn.textContent = `Playing Root... (Sing ${direction})`;
        this.playIcon.textContent = '♪';

        await this.toneGenerator.playTone(this.rootFrequency);

        setTimeout(() => {
            this.toneGenerator.stopTone();
            this.isPlayingTone = false;

            // Automatically start listening after tone plays
            this.startListening();
        }, 2000);
    }

    async startListening() {
        // Create pitch detector lazily (so config has time to load)
        if (!this.pitchDetector) {
            this.pitchDetector = new PitchDetector();
        }

        // Initialize pitch detector
        try {
            const deviceId = window.audioSettings ? window.audioSettings.getSelectedMicId() : null;
            await this.pitchDetector.initialize(deviceId);
        } catch (error) {
            alert('Failed to access microphone: ' + error.message);
            return;
        }

        this.isListening = true;
        this.listeningStartTime = Date.now();
        this.bestMatch = null;

        this.playBtn.textContent = 'Listening...';
        this.playIcon.textContent = '🎤';

        // Start pitch detection
        this.detectionInterval = setInterval(() => {
            this.checkPitch();
        }, 100);

        // Auto-stop after match duration
        setTimeout(() => {
            if (this.isListening) {
                this.stopListening();
            }
        }, this.matchDuration);
    }

    checkPitch() {
        const pitch = this.pitchDetector.detectPitch();

        if (pitch && pitch.confidence > 0.85) {
            // Calculate signed cents difference (positive = sharp, negative = flat)
            const signedCentsDiff = 1200 * Math.log2(pitch.frequency / this.targetFrequency);
            const centsDiff = Math.abs(signedCentsDiff);

            // Track best match during listening period
            if (!this.bestMatch || centsDiff < this.bestMatch.centsDiff) {
                this.bestMatch = {
                    frequency: pitch.frequency,
                    centsDiff: centsDiff,
                    signedCentsDiff: signedCentsDiff,
                    confidence: pitch.confidence
                };
            }
        }
    }

    stopListening() {
        if (!this.isListening) return;

        this.isListening = false;
        clearInterval(this.detectionInterval);

        // Calculate score based on best match
        if (this.bestMatch) {
            const score = this.calculateScore(this.bestMatch.centsDiff);
            this.showResult(score, this.bestMatch.centsDiff);
        } else {
            this.showResult(0, null);
        }

        this.playBtn.textContent = 'Play Root';
        this.playIcon.textContent = '▶';
    }

    calculateScore(centsDiff) {
        // Perfect: 0-5 cents = 100 points
        // Excellent: 5-10 cents = 80 points
        // Good: 10-25 cents = 50 points
        // Fair: 25-50 cents = 20 points
        // Miss: >50 cents = 0 points

        if (centsDiff <= 5) return 100;
        if (centsDiff <= 10) return 80;
        if (centsDiff <= 25) return 50;
        if (centsDiff <= 50) return 20;
        return 0;
    }

    showResult(score, centsDiff) {
        this.totalScore += score;
        this.roundsPlayed++;
        this.updateScore();

        // Place dart on dartboard (pass signed cents for vertical positioning)
        const signedCentsDiff = this.bestMatch ? this.bestMatch.signedCentsDiff : 0;
        this.placeDart(centsDiff, signedCentsDiff);

        // Play sound effect based on accuracy
        if (score > 0) {
            this.playHitSound(centsDiff);
        } else {
            this.playMissSound();
        }
    }

    playHitSound(centsDiff = null) {
        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext) {
            console.warn('Interval Darts: No audio context for playHitSound');
            return;
        }
        if (!this.dartboardAudioBuffer) {
            console.warn('Interval Darts: dartboardAudioBuffer not loaded');
            return;
        }

        console.log('Interval Darts: Playing hit sound, centsDiff:', centsDiff);

        // Dartboard sound segments ranked from cleanest to most metallic
        const soundSegments = [
            // Cleanest sounds - for bullseye/center hits (0-10 cents)
            { start: 0.08, duration: 0.35, quality: 'clean' },
            { start: 1.88, duration: 0.35, quality: 'clean' },
            { start: 3.58, duration: 0.35, quality: 'clean' },

            // Moderate sounds - for good hits (10-30 cents)
            { start: 5.28, duration: 0.35, quality: 'moderate' },
            { start: 6.88, duration: 0.35, quality: 'moderate' },
            { start: 8.48, duration: 0.35, quality: 'moderate' },

            // Metallic sounds - for edge hits (30-50 cents)
            { start: 10.08, duration: 0.35, quality: 'metallic' },
            { start: 11.58, duration: 0.35, quality: 'metallic' },
            { start: 13.08, duration: 0.35, quality: 'metallic' }
        ];

        let selectedSegment;

        if (centsDiff !== null) {
            // Map accuracy to sound quality
            if (centsDiff <= 10) {
                const cleanSounds = soundSegments.filter(s => s.quality === 'clean');
                selectedSegment = cleanSounds[Math.floor(Math.random() * cleanSounds.length)];
            } else if (centsDiff <= 30) {
                const moderateSounds = soundSegments.filter(s => s.quality === 'moderate');
                selectedSegment = moderateSounds[Math.floor(Math.random() * moderateSounds.length)];
            } else {
                const metallicSounds = soundSegments.filter(s => s.quality === 'metallic');
                selectedSegment = metallicSounds[Math.floor(Math.random() * metallicSounds.length)];
            }
        } else {
            selectedSegment = soundSegments[Math.floor(Math.random() * soundSegments.length)];
        }

        // Play dartboard impact sound immediately
        const source = audioContext.createBufferSource();
        source.buffer = this.dartboardAudioBuffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.4;

        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        source.start(audioContext.currentTime, selectedSegment.start, selectedSegment.duration);

        // Play "dats right" sound shortly after
        if (this.datsRightAudioBuffer) {
            setTimeout(() => {
                const datsSource = audioContext.createBufferSource();
                datsSource.buffer = this.datsRightAudioBuffer;

                const datsGain = audioContext.createGain();
                datsGain.gain.value = 0.3;

                datsSource.connect(datsGain);
                datsGain.connect(audioContext.destination);

                datsSource.start();
            }, 200);
        }
    }

    playMissSound() {
        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext || !this.missAudioBuffer) {
            console.warn('Interval Darts: Miss sound not available');
            return;
        }

        const source = audioContext.createBufferSource();
        source.buffer = this.missAudioBuffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.3;

        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        source.start();
    }

    placeDart(centsDiff, signedCentsDiff = 0) {
        const dartboard = this.dartboard;

        // Clear old darts after 5 rounds
        const existingDarts = dartboard.querySelectorAll('.dart');
        if (existingDarts.length >= 5) {
            existingDarts[0].remove();
        }

        const dart = document.createElement('div');
        dart.className = 'dart';

        let dartX, dartY, radius;

        // Determine vertical position based on sharp (positive) or flat (negative)
        // signedCentsDiff > 0 means sharp (sung too high) -> dart goes high (low Y%)
        // signedCentsDiff < 0 means flat (sung too low) -> dart goes low (high Y%)
        const isSharp = signedCentsDiff > 0;

        // Check if this is Unison (ratio ~= 1.0)
        const isUnison = Math.abs(this.intervalRatio - 1.0) < 0.001;

        if (centsDiff === null) {
            // Miss - place in purple area off the dartboard
            dart.classList.add('miss');
            if (isUnison) {
                // For Unison: random angle, far radius, biased toward top/bottom based on sharp/flat
                const radiusPercent = 40; // Far from center
                const angleRange = isSharp ? [-90, -30] : [30, 90]; // Top half if sharp, bottom half if flat
                const angle = (Math.random() * (angleRange[1] - angleRange[0]) + angleRange[0]) * (Math.PI / 180);
                dartX = 50 + radiusPercent * Math.cos(angle);
                dartY = 50 + radiusPercent * Math.sin(angle);
            } else {
                dartX = 50;
                dartY = isSharp ? 10 : 90; // Top if sharp, bottom if flat
            }
            dart.textContent = '✕';
            dart.style.fontSize = '36px';
            dart.style.fontWeight = 'bold';
            dart.style.color = '#00aaff';
            dart.style.textShadow = '0 0 10px #00aaff';
            dart.style.left = `${dartX}%`;
            dart.style.top = `${dartY}%`;
            dart.style.opacity = '0';

            this.animateDartFlight(dartX, dartY, null, false);
        } else if (centsDiff <= 5) {
            // Bullseye! (0-5 cents) - very close to center
            dart.classList.add('bullseye');
            if (isUnison) {
                // For Unison: random angle around center, very small radius
                const radiusPercent = (centsDiff / 5) * 3; // 0-3% from center
                const angle = Math.random() * 2 * Math.PI; // Full circle
                dartX = 50 + radiusPercent * Math.cos(angle);
                dartY = 50 + radiusPercent * Math.sin(angle);
            } else {
                dartX = 50;
                dartY = 50 + (isSharp ? -(centsDiff / 5) * 3 : (centsDiff / 5) * 3);
            }
            dart.textContent = '✕';
            dart.style.fontSize = '36px';
            dart.style.fontWeight = 'bold';
            dart.style.color = '#00aaff';
            dart.style.textShadow = '0 0 10px #00aaff';
            dart.style.left = `${dartX}%`;
            dart.style.top = `${dartY}%`;
            dart.style.opacity = '0';

            this.animateDartFlight(dartX, dartY, null, false);
        } else if (centsDiff <= 50) {
            // Main dartboard area (5-50 cents)
            dart.classList.add('excellent');
            if (isUnison) {
                // For Unison: random angle, radius based on cents, biased toward top/bottom
                const radiusPercent = 3 + ((centsDiff - 5) / 45) * 20; // 3-23% from center
                const angleRange = isSharp ? [-90, -30] : [30, 90]; // Top half if sharp, bottom half if flat
                const angle = (Math.random() * (angleRange[1] - angleRange[0]) + angleRange[0]) * (Math.PI / 180);
                dartX = 50 + radiusPercent * Math.cos(angle);
                dartY = 50 + radiusPercent * Math.sin(angle);
            } else {
                dartX = 50;
                const offset = ((centsDiff - 5) / 45) * 20;
                dartY = isSharp ? (50 - 3 - offset) : (50 + 3 + offset);
            }
            dart.textContent = '✕';
            dart.style.fontSize = '36px';
            dart.style.fontWeight = 'bold';
            dart.style.color = '#00aaff';
            dart.style.textShadow = '0 0 10px #00aaff';
            dart.style.left = `${dartX}%`;
            dart.style.top = `${dartY}%`;
            dart.style.opacity = '0';

            this.animateDartFlight(dartX, dartY, centsDiff, false);
        } else if (centsDiff <= 100) {
            // Black ring (50-100 cents = half-step to whole-step)
            dart.classList.add('miss');
            if (isUnison) {
                // For Unison: random angle, larger radius, biased toward top/bottom
                const radiusPercent = 23 + ((centsDiff - 50) / 50) * 10; // 23-33% from center
                const angleRange = isSharp ? [-90, -30] : [30, 90]; // Top half if sharp, bottom half if flat
                const angle = (Math.random() * (angleRange[1] - angleRange[0]) + angleRange[0]) * (Math.PI / 180);
                dartX = 50 + radiusPercent * Math.cos(angle);
                dartY = 50 + radiusPercent * Math.sin(angle);
            } else {
                dartX = 50;
                const offset = 20 + ((centsDiff - 50) / 50) * 10;
                dartY = isSharp ? (50 - 3 - offset) : (50 + 3 + offset);
            }
            dart.textContent = '✕';
            dart.style.fontSize = '36px';
            dart.style.fontWeight = 'bold';
            dart.style.color = '#00aaff';
            dart.style.textShadow = '0 0 10px #00aaff';
            dart.style.left = `${dartX}%`;
            dart.style.top = `${dartY}%`;
            dart.style.opacity = '0';

            this.animateDartFlight(dartX, dartY, centsDiff, false);
        } else {
            // Purple area (>100 cents = more than a whole step off)
            dart.classList.add('purple-miss');
            if (isUnison) {
                // For Unison: random angle, very far radius, biased toward top/bottom
                const radiusPercent = 40; // Far from center
                const angleRange = isSharp ? [-90, -30] : [30, 90]; // Top half if sharp, bottom half if flat
                const angle = (Math.random() * (angleRange[1] - angleRange[0]) + angleRange[0]) * (Math.PI / 180);
                dartX = 50 + radiusPercent * Math.cos(angle);
                dartY = 50 + radiusPercent * Math.sin(angle);
            } else {
                dartX = 50;
                dartY = isSharp ? 10 : 90;
            }
            dart.textContent = '✕';
            dart.style.fontSize = '36px';
            dart.style.fontWeight = 'bold';
            dart.style.color = '#00aaff';
            dart.style.textShadow = '0 0 10px #00aaff';
            dart.style.left = `${dartX}%`;
            dart.style.top = `${dartY}%`;
            dart.style.opacity = '0';

            this.animateDartFlight(dartX, dartY, centsDiff, false);
        }

        // Add dart to board
        dartboard.appendChild(dart);

        // Fade in dart after animation
        setTimeout(() => {
            dart.style.opacity = '1';
            dart.classList.add('dart-landed');
        }, 600);
    }

    animateDartFlight(targetX, targetY, centsDiff, isMiss = false) {
        // Create an X that will fly in an arc
        const flyingDart = document.createElement('div');
        flyingDart.textContent = '✕';
        flyingDart.style.position = 'absolute';
        flyingDart.style.fontSize = '36px';
        flyingDart.style.fontWeight = 'bold';
        flyingDart.style.color = '#00aaff'; // Always blue
        flyingDart.style.textShadow = '0 0 10px #00aaff';
        flyingDart.style.zIndex = '100'; // Above all dartboard elements
        flyingDart.style.pointerEvents = 'none';

        // Start position (top center, slightly offset)
        const startX = 50;
        const startY = -5; // Above the board
        flyingDart.style.left = `${startX}%`;
        flyingDart.style.top = `${startY}%`;
        flyingDart.style.transform = 'translate(-50%, -50%)';

        this.dartboard.appendChild(flyingDart);

        // Animate using keyframes for arc motion
        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        const duration = 600; // ms

        let startTime = null;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            // Ease-in for more realistic dart throw
            const easeProgress = progress * progress;

            // Linear interpolation for X
            const currentX = startX + deltaX * easeProgress;

            // Parabolic arc for Y (adds the arc effect)
            const arc = -15 * Math.sin(progress * Math.PI); // Arc height of 15%
            const currentY = startY + deltaY * easeProgress + arc;

            flyingDart.style.left = `${currentX}%`;
            flyingDart.style.top = `${currentY}%`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove flying dart when animation completes
                flyingDart.remove();
                // Trigger flash effect when dart lands (only for hits, not misses)
                if (!isMiss) {
                    this.createFlashEffect(targetX, targetY, centsDiff);
                }
            }
        };

        requestAnimationFrame(animate);
    }

    createFlashEffect(x, y, centsDiff) {
        // Create a flash element
        const flash = document.createElement('div');
        flash.className = 'dart-flash';
        flash.style.position = 'absolute';
        flash.style.left = `${x}%`;
        flash.style.top = `${y}%`;
        flash.style.transform = 'translate(-50%, -50%)';
        flash.style.width = '60px';
        flash.style.height = '60px';
        flash.style.borderRadius = '50%';
        flash.style.pointerEvents = 'none';
        flash.style.zIndex = '5';

        // Color based on accuracy
        let flashColor;
        if (centsDiff === null || centsDiff <= 1) {
            flashColor = '#ffdd00'; // Gold for bullseye
        } else if (centsDiff <= 10) {
            flashColor = '#00ff00'; // Green for good hit
        } else if (centsDiff <= 25) {
            flashColor = '#ffaa00'; // Orange for decent hit
        } else {
            flashColor = '#ff6600'; // Red-orange for fair hit
        }

        flash.style.background = `radial-gradient(circle, ${flashColor}, transparent)`;
        flash.style.opacity = '1';

        this.dartboard.appendChild(flash);

        // Fade out and remove
        setTimeout(() => {
            flash.style.transition = 'opacity 0.3s ease-out';
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 300);
        }, 200);
    }

    clearDartboard() {
        if (this.dartboard) {
            // Only remove darts, not the dartboard segments
            const darts = this.dartboard.querySelectorAll('.dart, .dart-flash');
            darts.forEach(dart => dart.remove());
        }
    }

    updateScore() {
        if (this.scoreDisplay) {
            this.scoreDisplay.textContent = this.totalScore;
        }
        if (this.roundsDisplay) {
            this.roundsDisplay.textContent = this.roundsPlayed;
        }
    }

    // Car Mode Methods
    async startCarModeRound() {
        this.carModePhase = 'listen';
        this.playBtn.disabled = true;

        // Generate frequencies
        const MIN_FREQUENCY = 174.61;
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;
        const maxRootFreq = highFreq / this.intervalRatio;
        const constrainedHighFreq = Math.min(maxRootFreq, highFreq);

        this.rootFrequency = this.toneGenerator.getRandomFrequencyInRange(lowFreq, constrainedHighFreq);
        this.targetFrequency = this.rootFrequency * this.intervalRatio;

        // Phase 1: Play root tone
        this.playBtn.textContent = 'Listen...';
        await this.toneGenerator.playTone(this.rootFrequency);

        const playTimer = setTimeout(() => {
            this.toneGenerator.stopTone();
            this.carModeCountdown();
        }, 2000);
        this.carModeTimers.push(playTimer);
    }

    carModeCountdown() {
        this.carModePhase = 'countdown';
        let countdown = 3;
        this.playBtn.textContent = `Get Ready: ${countdown}`;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.playBtn.textContent = `Get Ready: ${countdown}`;
            } else {
                clearInterval(countdownInterval);
                this.carModeSing();
            }
        }, 1000);
        this.carModeTimers.push(countdownInterval);
    }

    async carModeSing() {
        this.carModePhase = 'sing';
        this.playBtn.textContent = 'Sing Now!';

        // Initialize audio system for microphone
        await window.audioManager.initialize();

        this.isListening = true;
        this.listeningStartTime = Date.now();
        this.bestMatch = null;

        // Start pitch detection
        this.detectionInterval = setInterval(() => {
            this.checkPitch();
        }, 100);
        this.carModeTimers.push(this.detectionInterval);

        // Listen for 1 second
        const listenTimer = setTimeout(() => {
            this.carModeResult();
        }, this.matchDuration);
        this.carModeTimers.push(listenTimer);
    }

    carModeResult() {
        this.carModePhase = 'result';
        this.isListening = false;
        clearInterval(this.detectionInterval);

        // Calculate result
        if (this.bestMatch) {
            const score = this.calculateScore(this.bestMatch.centsDiff);
            this.totalScore += score;
            this.roundsPlayed++;
            this.placeDart(this.bestMatch.centsDiff, this.bestMatch.signedCentsDiff);

            if (score > 0) {
                this.playHitSound(this.bestMatch.centsDiff);
                this.playBtn.textContent = `Hit! +${score}`;
            } else {
                this.playMissSound();
                this.carModeLives--;
                this.playBtn.textContent = 'Miss!';
            }
        } else {
            this.playMissSound();
            this.placeDart(null, 0);
            this.carModeLives--;
            this.playBtn.textContent = 'Miss!';
        }

        this.updateScore();

        // Check if game over
        if (this.carModeLives <= 0) {
            const gameOverTimer = setTimeout(() => {
                this.playBtn.textContent = 'Game Over';
                this.playBtn.disabled = true;
            }, 2000);
            this.carModeTimers.push(gameOverTimer);
        } else {
            const nextTimer = setTimeout(() => {
                this.carModePhase = null;
                this.playBtn.textContent = 'Next Round';
                this.playBtn.disabled = false;
            }, 2000);
            this.carModeTimers.push(nextTimer);
        }
    }

    exit() {
        // Stop all audio
        this.toneGenerator.stopTone();
        this.isPlayingTone = false;
        this.isListening = false;

        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }

        // Clear all car mode timers
        this.carModeTimers.forEach(timer => {
            if (typeof timer === 'number') {
                clearTimeout(timer);
                clearInterval(timer);
            }
        });
        this.carModeTimers = [];
        this.carModePhase = null;

        // Return to main app
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        if (window.mainApp) {
            window.mainApp.clearExerciseFromURL();
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize all Darts exercise variants when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Unison Darts
        window.unisonDartsExercise = new IntervalDartsExercise(
            'Unison',
            1.0,
            'unisonDarts',
            'unisonDartsExercise'
        );

        // Half-Step Darts
        window.halfStepDartsExercise = new IntervalDartsExercise(
            'Half-Step',
            Math.pow(2, 1/12),
            'halfStepDarts',
            'halfStepDartsExercise'
        );

        // Whole-Step Darts
        window.wholeStepDartsExercise = new IntervalDartsExercise(
            'Whole-Step',
            Math.pow(2, 2/12),
            'wholeStepDarts',
            'wholeStepDartsExercise'
        );

        // Octave Darts
        window.octaveDartsExercise = new IntervalDartsExercise(
            'Octave',
            2.0,
            'octaveDarts',
            'octaveDartsExercise'
        );

        // Major Third Darts
        window.majorThirdDartsExercise = new IntervalDartsExercise(
            'Major Third',
            Math.pow(2, 4/12),
            'majorThirdDarts',
            'majorThirdDartsExercise'
        );

        // Perfect Fourth Darts
        window.perfectFourthDartsExercise = new IntervalDartsExercise(
            'Perfect Fourth',
            Math.pow(2, 5/12),
            'perfectFourthDarts',
            'perfectFourthDartsExercise'
        );

        // Perfect Fifth Darts
        window.perfectFifthDartsExercise = new IntervalDartsExercise(
            'Perfect Fifth',
            Math.pow(2, 7/12),
            'perfectFifthDarts',
            'perfectFifthDartsExercise'
        );

        // Major Sixth Darts
        window.majorSixthDartsExercise = new IntervalDartsExercise(
            'Major Sixth',
            Math.pow(2, 9/12),
            'majorSixthDarts',
            'majorSixthDartsExercise'
        );

        // Major Seventh Darts
        window.majorSeventhDartsExercise = new IntervalDartsExercise(
            'Major Seventh',
            Math.pow(2, 11/12),
            'majorSeventhDarts',
            'majorSeventhDartsExercise'
        );
    });
} else {
    // Unison Darts
    window.unisonDartsExercise = new IntervalDartsExercise(
        'Unison',
        1.0,
        'unisonDarts',
        'unisonDartsExercise'
    );

    // Half-Step Darts
    window.halfStepDartsExercise = new IntervalDartsExercise(
        'Half-Step',
        Math.pow(2, 1/12),
        'halfStepDarts',
        'halfStepDartsExercise'
    );

    // Whole-Step Darts
    window.wholeStepDartsExercise = new IntervalDartsExercise(
        'Whole-Step',
        Math.pow(2, 2/12),
        'wholeStepDarts',
        'wholeStepDartsExercise'
    );

    // Octave Darts
    window.octaveDartsExercise = new IntervalDartsExercise(
        'Octave',
        2.0,
        'octaveDarts',
        'octaveDartsExercise'
    );

    // Major Third Darts
    window.majorThirdDartsExercise = new IntervalDartsExercise(
        'Major Third',
        Math.pow(2, 4/12),
        'majorThirdDarts',
        'majorThirdDartsExercise'
    );

    // Perfect Fourth Darts
    window.perfectFourthDartsExercise = new IntervalDartsExercise(
        'Perfect Fourth',
        Math.pow(2, 5/12),
        'perfectFourthDarts',
        'perfectFourthDartsExercise'
    );

    // Perfect Fifth Darts
    window.perfectFifthDartsExercise = new IntervalDartsExercise(
        'Perfect Fifth',
        Math.pow(2, 7/12),
        'perfectFifthDarts',
        'perfectFifthDartsExercise'
    );

    // Major Sixth Darts
    window.majorSixthDartsExercise = new IntervalDartsExercise(
        'Major Sixth',
        Math.pow(2, 9/12),
        'majorSixthDarts',
        'majorSixthDartsExercise'
    );

    // Major Seventh Darts
    window.majorSeventhDartsExercise = new IntervalDartsExercise(
        'Major Seventh',
        Math.pow(2, 11/12),
        'majorSeventhDarts',
        'majorSeventhDartsExercise'
    );
}
