// Tone Darts Exercise - Match pitch accuracy game
class ToneDartsExercise {
    constructor() {
        this.toneGenerator = new ToneGenerator();
        this.pitchDetector = null; // Created lazily on first use
        this.vocalRange = null;
        this.targetFrequency = null;
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
        this.container = document.getElementById('toneDartsExercise');
        this.dartboard = document.getElementById('dartboard');
        this.scoreDisplay = document.getElementById('dartScore');
        this.roundsDisplay = document.getElementById('dartRounds');
        this.playBtn = document.getElementById('dartPlayBtn');
        this.playIcon = document.getElementById('dartPlayIcon');
        this.exitBtn = document.getElementById('exitToneDarts');
        this.settingsBtn = document.getElementById('audioSettingsBtnDarts');
    }

    attachEventListeners() {
        this.playBtn.addEventListener('click', () => this.handlePlayButton());
        this.exitBtn.addEventListener('click', () => this.exit());

        // Settings button
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => {
                if (window.audioSettings) {
                    window.audioSettings.show();
                }
            });
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
            this.playBtn.textContent = 'Play Tone';
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
                // Play the target tone
                await this.playTargetTone();
            } else if (this.isListening) {
                // Stop listening early (optional)
                this.stopListening();
            }
        }
    }

    async playTargetTone() {
        // Generate random frequency in vocal range
        const MIN_FREQUENCY = 174.61; // F3
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;

        this.targetFrequency = this.toneGenerator.getRandomFrequencyInRange(lowFreq, highFreq);

        // Update button
        this.playBtn.textContent = 'Playing Tone...';
        this.playIcon.textContent = '🔊';
        this.isPlayingTone = true;

        // Play tone for 3 seconds
        this.toneGenerator.playTone(this.targetFrequency);

        setTimeout(() => {
            this.toneGenerator.stopTone();
            this.isPlayingTone = false;
            this.startListening();
        }, 3000);
    }

    async startListening() {
        try {
            // Create pitch detector lazily (so config has time to load)
            if (!this.pitchDetector) {
                this.pitchDetector = new PitchDetector();
            }

            // Initialize pitch detector if needed
            if (!this.pitchDetector.isListening) {
                const deviceId = window.audioSettings ? window.audioSettings.getSelectedMicId() : null;
                await this.pitchDetector.initialize(deviceId);
            }

            this.isListening = true;
            this.listeningStartTime = Date.now();
            this.bestMatch = null;

            // Update button - show microphone while listening
            this.playBtn.textContent = 'Listening...';
            this.playIcon.textContent = '🎤';

            // Start detection loop
            this.detectionInterval = setInterval(() => {
                this.detectPitch();
            }, 50); // 20 Hz update rate

            // Auto-stop after 1 second
            setTimeout(() => {
                if (this.isListening) {
                    this.stopListening();
                }
            }, this.matchDuration);

        } catch (error) {
            alert(error.message);
            this.exit();
        }
    }

    detectPitch() {
        if (!this.isListening) return;

        const pitch = this.pitchDetector.detectPitch();

        if (pitch && pitch.frequency > 50 && pitch.frequency < 2000) {
            // Calculate cents difference
            const cents = 1200 * Math.log2(pitch.frequency / this.targetFrequency);
            const centsDiff = Math.abs(cents);

            // Track best match (closest to target)
            if (this.bestMatch === null || centsDiff < this.bestMatch.centsDiff) {
                this.bestMatch = {
                    frequency: pitch.frequency,
                    centsDiff: centsDiff,
                    cents: cents
                };

                // Update button to show tone was registered - remove microphone
                this.playBtn.textContent = 'Registered!';
                this.playIcon.textContent = '✓';
            }
        }
    }

    stopListening() {
        this.isListening = false;

        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        // Add delay before showing dart (500ms)
        setTimeout(() => {
            // Calculate score based on best match
            if (this.bestMatch) {
                const points = this.calculatePoints(this.bestMatch.centsDiff);

                if (points === -1) {
                    // Miss - off board
                    this.roundsPlayed++;
                    this.throwDart(null, null);
                    this.updateScore();
                    this.playMissSound();
                } else {
                    // Hit board (including black band = 0 points)
                    this.totalScore += points;
                    this.roundsPlayed++;
                    this.throwDart(this.bestMatch.centsDiff, this.bestMatch.cents);
                    this.updateScore();
                    this.playHitSound(this.bestMatch.centsDiff);
                }
            } else {
                // No match detected
                this.roundsPlayed++;
                this.throwDart(null, null);
                this.updateScore();
                this.playMissSound();
            }

            // Reset for next round
            this.playBtn.textContent = 'Play Tone';
            this.playIcon.textContent = '▶';
        }, 500);
    }

    calculatePoints(centsDiff) {
        // Scoring based on cents difference:
        // 0-1 cents: 50 points (perfect bullseye)
        // 1-10 cents: 40 points (excellent)
        // 10-20 cents: 30 points (very good)
        // 20-30 cents: 20 points (good)
        // 30-40 cents: 10 points (okay)
        // 40-50 cents: 5 points (marginal)
        // 50-100 cents: 0 points (black ring)
        // >100 cents: -1 (miss - off board)

        if (centsDiff <= 1) return 50;
        if (centsDiff <= 10) return 40;
        if (centsDiff <= 20) return 30;
        if (centsDiff <= 30) return 20;
        if (centsDiff <= 40) return 10;
        if (centsDiff <= 50) return 5;
        if (centsDiff <= 100) return 0; // Black ring
        return -1; // Miss (off board)
    }

    async loadDartSounds() {
        try {
            const audioContext = window.audioManager.getAudioContext();
            if (!audioContext) {
                // Audio context will be created on first user interaction
                return;
            }

            console.log('Tone Darts: Loading sound files...');

            // Load "Dats Right" sound for hits
            const datsRightResponse = await fetch('sounds/587252__beetlemuse__dats-right.wav');
            if (!datsRightResponse.ok) {
                console.error('Failed to fetch dats-right.wav:', datsRightResponse.status);
            }
            const datsRightArrayBuffer = await datsRightResponse.arrayBuffer();
            this.datsRightAudioBuffer = await audioContext.decodeAudioData(datsRightArrayBuffer);
            console.log('Tone Darts: Loaded dats-right.wav');

            // Load miss sound
            const missResponse = await fetch('sounds/471427__juaner__23_miss_hit.wav');
            if (!missResponse.ok) {
                console.error('Failed to fetch miss sound:', missResponse.status);
            }
            const missArrayBuffer = await missResponse.arrayBuffer();
            this.missAudioBuffer = await audioContext.decodeAudioData(missArrayBuffer);
            console.log('Tone Darts: Loaded miss sound');

            // Load dartboard impacts for accuracy-based sounds
            const dartboardResponse = await fetch('sounds/706968__gridmaw__darts-impacting-dart-board.wav');
            if (!dartboardResponse.ok) {
                console.error('Failed to fetch dartboard impacts:', dartboardResponse.status);
            }
            const dartboardArrayBuffer = await dartboardResponse.arrayBuffer();
            this.dartboardAudioBuffer = await audioContext.decodeAudioData(dartboardArrayBuffer);
            console.log('Tone Darts: Loaded dartboard impacts (' + this.dartboardAudioBuffer.duration.toFixed(2) + 's)');

            console.log('Tone Darts: All sounds loaded successfully!');
        } catch (error) {
            console.error('Failed to load dart sounds:', error);
        }
    }

    playHitSound(centsDiff = null) {
        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext) {
            console.warn('Tone Darts: No audio context for playHitSound');
            return;
        }
        if (!this.dartboardAudioBuffer) {
            console.warn('Tone Darts: dartboardAudioBuffer not loaded');
            return;
        }

        console.log('Tone Darts: Playing hit sound, centsDiff:', centsDiff);

        // Dartboard sound segments ranked from cleanest to most metallic
        // After listening to the file, these timestamps represent distinct dart impacts:
        // File is ~14.43 seconds with multiple impact sounds

        const soundSegments = [
            // Cleanest sounds - for bullseye/center hits (0-10 cents)
            { start: 0.08, duration: 0.35, quality: 'clean' },      // Very clean thud
            { start: 1.88, duration: 0.35, quality: 'clean' },      // Clean impact
            { start: 3.58, duration: 0.35, quality: 'clean' },      // Solid clean sound

            // Moderate sounds - for good hits (10-30 cents)
            { start: 5.28, duration: 0.35, quality: 'moderate' },   // Slight ring
            { start: 6.88, duration: 0.35, quality: 'moderate' },   // Balanced sound
            { start: 8.48, duration: 0.35, quality: 'moderate' },   // Medium tone

            // Metallic sounds - for edge hits (30-50 cents)
            { start: 10.08, duration: 0.35, quality: 'metallic' },  // More metallic
            { start: 11.58, duration: 0.35, quality: 'metallic' },  // Ringing sound
            { start: 13.08, duration: 0.35, quality: 'metallic' }   // Most metallic
        ];

        let selectedSegment;

        if (centsDiff !== null) {
            // Map accuracy to sound quality
            if (centsDiff <= 10) {
                // Bullseye/Excellent - use cleanest sounds
                const cleanSounds = soundSegments.filter(s => s.quality === 'clean');
                selectedSegment = cleanSounds[Math.floor(Math.random() * cleanSounds.length)];
            } else if (centsDiff <= 30) {
                // Good - use moderate sounds
                const moderateSounds = soundSegments.filter(s => s.quality === 'moderate');
                selectedSegment = moderateSounds[Math.floor(Math.random() * moderateSounds.length)];
            } else {
                // Edge/Outer ring - use metallic sounds
                const metallicSounds = soundSegments.filter(s => s.quality === 'metallic');
                selectedSegment = metallicSounds[Math.floor(Math.random() * metallicSounds.length)];
            }
        } else {
            // Random if no accuracy provided
            selectedSegment = soundSegments[Math.floor(Math.random() * soundSegments.length)];
        }

        // Play dartboard impact sound immediately
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();

        source.buffer = this.dartboardAudioBuffer;
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        source.start(audioContext.currentTime, selectedSegment.start, selectedSegment.duration);

        // Play "Dats Right" sound 0.5 seconds later ONLY for perfect hits (0-1 cents)
        if (centsDiff !== null && centsDiff <= 1) {
            setTimeout(() => {
                this.playDatsRightSound();
            }, 500);
        }
    }

    playDatsRightSound() {
        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext || !this.datsRightAudioBuffer) return;

        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();

        source.buffer = this.datsRightAudioBuffer;
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        source.start(audioContext.currentTime);
    }

    playMissSound() {
        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext) {
            console.warn('Tone Darts: No audio context for playMissSound');
            return;
        }
        if (!this.missAudioBuffer) {
            console.warn('Tone Darts: missAudioBuffer not loaded');
            return;
        }

        console.log('Tone Darts: Playing miss sound');

        // Play the miss sound
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();

        source.buffer = this.missAudioBuffer;

        // Volume control
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

        source.connect(gainNode);
        gainNode.connect(audioContext.destination);

        source.start(audioContext.currentTime);
    }

    throwDart(centsDiff, cents) {
        // Create dart element with feather-like appearance
        const dart = document.createElement('div');
        dart.className = 'dart';
        dart.style.fontSize = '32px';
        dart.style.display = 'flex';
        dart.style.alignItems = 'center';
        dart.style.justifyContent = 'center';

        let dartX, dartY;
        let radius;

        // Random angle for all darts
        const angle = Math.random() * 2 * Math.PI;

        if (centsDiff === null || centsDiff > 100) {
            // Miss - off the board (>100 cents)
            // Use non-linear scale to keep misses on screen
            // Map 100-∞ cents to 50-70% radius using logarithmic scale
            const centsOver = centsDiff === null ? 200 : Math.max(100, centsDiff);
            const logScale = Math.log(centsOver - 99) / Math.log(10); // Log base 10
            radius = 50 + Math.min(20, logScale * 8); // Cap at 70% radius

            dartX = 50 + radius * Math.cos(angle);
            dartY = 50 + radius * Math.sin(angle);

            // Blue X for miss
            dart.innerHTML = `
                <div style="font-size: 50px; color: #00aaff; text-shadow: 0 0 15px #00aaff; font-weight: 300;">✕</div>
            `;
            dart.style.left = `${dartX}%`;
            dart.style.top = `${dartY}%`;
            dart.style.opacity = '0';

            this.animateDartFlight(dartX, dartY, null, false);
        } else if (centsDiff <= 50) {
            // Main dartboard area (0-50 cents)
            // Map 0-50 cents to 0-40% radius (80% of board width / 2)
            radius = (centsDiff / 50) * 40;

            dartX = 50 + radius * Math.cos(angle);
            dartY = 50 + radius * Math.sin(angle);

            // Blue X for hit
            dart.innerHTML = `
                <div style="font-size: 50px; color: #00aaff; text-shadow: 0 0 15px #00aaff; font-weight: 300;">✕</div>
            `;
            dart.style.left = `${dartX}%`;
            dart.style.top = `${dartY}%`;
            dart.style.opacity = '0';

            this.animateDartFlight(dartX, dartY, centsDiff, false);
        } else {
            // Black ring (50-100 cents)
            // Map 50-100 cents to 40-50% radius (the outer ring)
            radius = 40 + ((centsDiff - 50) / 50) * 10;

            dartX = 50 + radius * Math.cos(angle);
            dartY = 50 + radius * Math.sin(angle);

            // Blue X for black ring
            dart.innerHTML = `
                <div style="font-size: 50px; color: #00aaff; text-shadow: 0 0 15px #00aaff; font-weight: 300;">✕</div>
            `;
            dart.style.left = `${dartX}%`;
            dart.style.top = `${dartY}%`;
            dart.style.opacity = '0';

            this.animateDartFlight(dartX, dartY, centsDiff, false);
        }

        // Add dart to board
        this.dartboard.appendChild(dart);

        // Make the X appear after the flight animation
        setTimeout(() => {
            dart.style.transition = 'opacity 0.2s ease-in';
            dart.style.opacity = '1';
            dart.classList.add('dart-landed');
        }, 600);
    }

    animateDartFlight(targetX, targetY, centsDiff, isMiss = false) {
        // Create a small dot that will fly in an arc
        const flyingDart = document.createElement('div');
        flyingDart.style.position = 'absolute';
        flyingDart.style.width = '12px';
        flyingDart.style.height = '12px';
        flyingDart.style.background = isMiss ? '#ff4444' : '#00aaff';
        flyingDart.style.borderRadius = '50%';
        flyingDart.style.boxShadow = isMiss ? '0 0 10px #ff4444' : '0 0 10px #00aaff';
        flyingDart.style.zIndex = '10';
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
        if (centsDiff <= 1) {
            flashColor = '#ffdd00'; // Gold for bullseye
        } else if (centsDiff <= 10) {
            flashColor = '#00ff00'; // Green for good hit
        } else if (centsDiff <= 25) {
            flashColor = '#ffaa00'; // Orange for decent hit
        } else {
            flashColor = '#ff6600'; // Red-orange for outer hit
        }

        flash.style.backgroundColor = flashColor;
        flash.style.boxShadow = `0 0 20px ${flashColor}`;
        flash.style.opacity = '0.7';

        this.dartboard.appendChild(flash);

        // Animate flash: expand and fade out
        setTimeout(() => {
            flash.style.transition = 'all 0.5s ease-out';
            flash.style.width = '100px';
            flash.style.height = '100px';
            flash.style.opacity = '0';
        }, 10);

        // Remove flash after animation
        setTimeout(() => {
            flash.remove();
        }, 520);
    }

    clearDartboard() {
        // Remove all darts
        const darts = this.dartboard.querySelectorAll('.dart');
        darts.forEach(dart => dart.remove());
    }

    updateScore() {
        if (this.isCarMode) {
            this.scoreDisplay.textContent = this.totalScore;
            this.roundsDisplay.textContent = `❤️ ${this.carModeLives}`;
        } else {
            this.scoreDisplay.textContent = this.totalScore;
            this.roundsDisplay.textContent = this.roundsPlayed;
        }
    }

    // ========== CAR MODE METHODS ==========

    async startCarModeRound() {
        // Check if game over
        if (this.carModeLives <= 0) {
            this.carModeGameOver();
            return;
        }

        this.carModePhase = 'listen';

        // Generate random frequency
        const MIN_FREQUENCY = 174.61; // F3
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;
        this.targetFrequency = this.toneGenerator.getRandomFrequencyInRange(lowFreq, highFreq);

        // Phase 1: Listen (3 seconds)
        this.playBtn.textContent = 'Listen...';
        this.playIcon.textContent = '🔊';
        this.playBtn.disabled = true;

        this.toneGenerator.playTone(this.targetFrequency);

        const timer = setTimeout(() => {
            this.toneGenerator.stopTone();
            // Go directly to singing phase (no countdown)
            this.carModeStartSinging();
        }, 3000);
        this.carModeTimers.push(timer);
    }

    async carModeStartSinging() {
        this.carModePhase = 'sing';

        // Create pitch detector lazily (so config has time to load)
        if (!this.pitchDetector) {
            this.pitchDetector = new PitchDetector();
        }

        // Initialize pitch detector if needed
        try {
            if (!this.pitchDetector.isListening) {
                const deviceId = window.audioSettings ? window.audioSettings.getSelectedMicId() : null;
                await this.pitchDetector.initialize(deviceId);
            }
        } catch (error) {
            alert(error.message);
            this.carModePhase = null;
            this.playBtn.disabled = false;
            this.playBtn.textContent = 'Start Round';
            return;
        }

        this.playBtn.textContent = 'Sing Now!';
        this.playIcon.textContent = '🎤';

        this.isListening = true;
        this.bestMatch = null;

        // Start detection loop
        this.detectionInterval = setInterval(() => {
            this.detectPitch();
        }, 50);

        // Listen for 2.5 seconds
        const timer = setTimeout(() => {
            this.carModeStopSinging();
        }, 2500);
        this.carModeTimers.push(timer);
    }

    carModeStopSinging() {
        this.isListening = false;

        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        this.carModePhase = 'result';

        // Calculate result
        const resultTimer = setTimeout(() => {
            if (this.bestMatch) {
                const points = this.calculatePoints(this.bestMatch.centsDiff);

                if (points === -1) {
                    // Miss - lose a life
                    this.carModeLives--;
                    this.playBtn.textContent = 'Miss!';
                    this.playIcon.textContent = '❌';
                    this.playMissSound();
                    this.speakResult('Miss', 0);
                } else {
                    // Hit
                    this.totalScore += points;
                    this.roundsPlayed++;
                    this.throwDart(this.bestMatch.centsDiff, this.bestMatch.cents);
                    this.playHitSound(this.bestMatch.centsDiff);

                    let message = '';
                    if (points >= 50) message = 'Bullseye!';
                    else if (points >= 40) message = 'Excellent!';
                    else if (points >= 30) message = 'Great!';
                    else if (points >= 20) message = 'Good!';
                    else if (points >= 10) message = 'Nice!';
                    else if (points >= 5) message = 'Hit!';
                    else message = 'On board!';

                    this.playBtn.textContent = message;
                    this.playIcon.textContent = '✓';
                    this.speakResult(message, points);
                }
            } else {
                // No match - lose a life
                this.carModeLives--;
                this.playBtn.textContent = 'No pitch detected';
                this.playIcon.textContent = '❌';
                this.playMissSound();
                this.speakResult('No pitch detected', 0);
            }

            this.updateScore();

            // Auto-continue after 2 seconds
            const continueTimer = setTimeout(() => {
                this.carModePhase = null;
                this.playBtn.disabled = false;

                if (this.carModeLives > 0) {
                    this.playBtn.textContent = 'Next Round';
                    this.playIcon.textContent = '▶';
                    // Auto-start next round after 1 more second
                    const nextRoundTimer = setTimeout(() => {
                        this.startCarModeRound();
                    }, 1000);
                    this.carModeTimers.push(nextRoundTimer);
                } else {
                    this.carModeGameOver();
                }
            }, 2000);
            this.carModeTimers.push(continueTimer);
        }, 300);
        this.carModeTimers.push(resultTimer);
    }

    carModeGameOver() {
        this.playBtn.textContent = 'Game Over!';
        this.playIcon.textContent = '🏁';
        this.playBtn.disabled = true;

        this.speakResult(`Game over! Final score: ${this.totalScore}. Starting new game`, this.totalScore);

        // Auto-restart after 3 seconds (car mode plays indefinitely)
        const restartTimer = setTimeout(() => {
            this.playBtn.textContent = 'Starting...';
            this.playIcon.textContent = '🔄';
            this.carModePhase = null;
            this.totalScore = 0;
            this.roundsPlayed = 0;
            this.carModeLives = 5;
            this.updateScore();
            this.clearDartboard();

            // Start new game after 1 more second
            const newGameTimer = setTimeout(() => {
                this.startCarModeRound();
            }, 1000);
            this.carModeTimers.push(newGameTimer);
        }, 3000);
        this.carModeTimers.push(restartTimer);
    }

    speakResult(message, points) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance();
            if (points > 0) {
                utterance.text = `${message} ${points} points. Total: ${this.totalScore}`;
            } else {
                utterance.text = message;
            }
            utterance.rate = 1.1;
            utterance.volume = 0.7;
            speechSynthesis.speak(utterance);
        }
    }

    exit() {
        // Stop everything
        this.isListening = false;
        this.isPlayingTone = false;

        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        // Stop all car mode timers and reset state
        this.carModeTimers.forEach(timer => clearTimeout(timer));
        this.carModeTimers = [];
        this.carModePhase = null;
        this.isCarMode = false;

        this.toneGenerator.stopTone();
        this.pitchDetector.stop();

        // Stop microphone stream
        if (window.audioManager && window.audioManager.isInitialized) {
            window.audioManager.stop();
        }

        // Return to main app
        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        if (window.mainApp) {
            window.mainApp.clearExerciseFromURL();
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize exercise
window.toneDartsExercise = new ToneDartsExercise();
