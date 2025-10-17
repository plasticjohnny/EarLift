// Scale Darts Exercise - Match scale degree accuracy game
// Plays root note, but has multiple target tones (scale degrees)
class ScaleDartsExercise {
    constructor() {
        this.toneGenerator = new ToneGenerator();
        this.pitchDetector = null;
        this.vocalRange = null;
        this.rootFrequency = null;
        this.targetFrequencies = []; // Array of all scale degree frequencies
        this.currentTargetIndex = 0; // Which scale degree we're currently aiming for
        this.isPlayingTone = false;
        this.isListening = false;
        this.totalScore = 0;
        this.roundsPlayed = 0;
        this.detectionInterval = null;
        this.listeningStartTime = null;
        this.matchDuration = 1000; // 1 second to match
        this.bestMatch = null;
        this.datsRightAudioBuffer = null;
        this.missAudioBuffer = null;
        this.dartboardAudioBuffer = null;

        // Scale degrees (major scale)
        // 1 (root), 2 (whole step), 3 (major third), 4 (perfect fourth),
        // 5 (perfect fifth), 6 (major sixth), 7 (major seventh), 8 (octave)
        this.scaleRatios = [
            1.0,                    // 1 - Root (unison)
            Math.pow(2, 2/12),      // 2 - Whole step
            Math.pow(2, 4/12),      // 3 - Major third
            Math.pow(2, 5/12),      // 4 - Perfect fourth
            Math.pow(2, 7/12),      // 5 - Perfect fifth
            Math.pow(2, 9/12),      // 6 - Major sixth
            Math.pow(2, 11/12),     // 7 - Major seventh
            2.0                     // 8 - Octave
        ];
        this.scaleNames = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti', 'Do\''];

        // Car mode state
        this.isCarMode = false;
        this.carModeLives = 5;
        this.carModePhase = null;
        this.carModeTimers = [];

        this.initializeElements();
        this.attachEventListeners();
        this.loadDartSounds();
    }

    initializeElements() {
        this.container = document.getElementById('scaleDartsExercise');
        this.dartboard = document.getElementById('scaleDartsDartboard');
        this.scoreDisplay = document.getElementById('scaleDartsScore');
        this.roundsDisplay = document.getElementById('scaleDartsRounds');
        this.playBtn = document.getElementById('scaleDartsPlayBtn');
        this.playIcon = document.getElementById('scaleDartsPlayIcon');
        this.exitBtn = document.getElementById('scaleDartsExitBtn');
        this.targetIndicator = document.getElementById('scaleDartsTarget');
    }

    attachEventListeners() {
        if (!this.playBtn || !this.exitBtn) {
            console.error('ScaleDartsExercise: Missing required elements');
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

            console.log('Scale Darts: All sounds loaded successfully!');
        } catch (error) {
            console.error('Failed to load dart sounds:', error);
        }
    }

    async start() {
        this.vocalRange = appSettings.getVocalRange();

        if (!this.vocalRange || !this.vocalRange.low || !this.vocalRange.high) {
            alert('Please set your vocal range first!');
            return;
        }

        const usageMode = appSettings.getUsageMode();
        this.isCarMode = (usageMode === 'car-mode');

        document.getElementById('appContainer').style.display = 'none';
        this.container.style.display = 'block';

        this.totalScore = 0;
        this.roundsPlayed = 0;
        this.carModeLives = 5;
        this.updateScore();
        this.clearDartboard();

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
            if (this.carModePhase === null) {
                await this.startCarModeRound();
            }
        } else {
            if (!this.isPlayingTone && !this.isListening) {
                await this.playRootTone();
            } else if (this.isListening) {
                this.stopListening();
            }
        }
    }

    async playRootTone() {
        const MIN_FREQUENCY = 174.61; // F3
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;

        // Choose a root that allows the full octave to fit in range
        const maxRootFreq = highFreq / 2.0; // Octave is 2x frequency
        const constrainedHighFreq = Math.min(maxRootFreq, highFreq);

        this.rootFrequency = this.toneGenerator.getRandomFrequencyInRange(lowFreq, constrainedHighFreq);

        // Calculate all scale degree frequencies
        this.targetFrequencies = this.scaleRatios.map(ratio => this.rootFrequency * ratio);

        // Pick a random target scale degree (excluding root for now to make it more challenging)
        this.currentTargetIndex = Math.floor(Math.random() * 7) + 1; // 1-7 (Re through Do')

        this.isPlayingTone = true;
        this.playBtn.textContent = 'Playing Root...';
        this.playIcon.textContent = '♪';

        // Update target indicator
        if (this.targetIndicator) {
            this.targetIndicator.textContent = `Target: ${this.scaleNames[this.currentTargetIndex]}`;
        }

        // Play root tone for 2 seconds
        await this.toneGenerator.playTone(this.rootFrequency);

        setTimeout(() => {
            this.toneGenerator.stopTone();
            this.isPlayingTone = false;
            this.startListening();
        }, 2000);
    }

    async startListening() {
        if (!this.pitchDetector) {
            this.pitchDetector = new PitchDetector();
        }

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

        this.detectionInterval = setInterval(() => {
            this.checkPitch();
        }, 100);

        setTimeout(() => {
            if (this.isListening) {
                this.stopListening();
            }
        }, this.matchDuration);
    }

    checkPitch() {
        const pitch = this.pitchDetector.detectPitch();

        if (pitch && pitch.confidence > 0.85) {
            // Calculate cents difference from the target scale degree
            const targetFreq = this.targetFrequencies[this.currentTargetIndex];
            const signedCentsDiff = 1200 * Math.log2(pitch.frequency / targetFreq);
            const centsDiff = Math.abs(signedCentsDiff);

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

        const signedCentsDiff = this.bestMatch ? this.bestMatch.signedCentsDiff : 0;
        this.placeDart(centsDiff, signedCentsDiff);

        if (score > 0) {
            this.playHitSound(centsDiff);
        } else {
            this.playMissSound();
        }
    }

    playHitSound(centsDiff = null) {
        const audioContext = window.audioManager.getAudioContext();
        if (!audioContext || !this.dartboardAudioBuffer) {
            console.warn('Scale Darts: No audio for hit sound');
            return;
        }

        const soundSegments = [
            { start: 0.08, duration: 0.35, quality: 'clean' },
            { start: 1.88, duration: 0.35, quality: 'clean' },
            { start: 3.58, duration: 0.35, quality: 'clean' },
            { start: 5.28, duration: 0.35, quality: 'moderate' },
            { start: 6.88, duration: 0.35, quality: 'moderate' },
            { start: 8.48, duration: 0.35, quality: 'moderate' },
            { start: 10.08, duration: 0.35, quality: 'metallic' },
            { start: 11.58, duration: 0.35, quality: 'metallic' },
            { start: 13.08, duration: 0.35, quality: 'metallic' }
        ];

        let selectedSegment;

        if (centsDiff !== null) {
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

        const source = audioContext.createBufferSource();
        source.buffer = this.dartboardAudioBuffer;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.4;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        source.start(audioContext.currentTime, selectedSegment.start, selectedSegment.duration);

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
            console.warn('Scale Darts: Miss sound not available');
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

        const existingDarts = dartboard.querySelectorAll('.dart');
        if (existingDarts.length >= 5) {
            existingDarts[0].remove();
        }

        const dart = document.createElement('div');
        dart.className = 'dart';

        let dartX, dartY;
        const isSharp = signedCentsDiff > 0;

        if (centsDiff === null) {
            dart.classList.add('miss');
            dartX = 50;
            dartY = isSharp ? 10 : 90;
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
            dart.classList.add('bullseye');
            dartX = 50;
            dartY = 50 + (isSharp ? -(centsDiff / 5) * 3 : (centsDiff / 5) * 3);
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
            dart.classList.add('excellent');
            dartX = 50;
            const offset = ((centsDiff - 5) / 45) * 20;
            dartY = isSharp ? (50 - 3 - offset) : (50 + 3 + offset);
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
            dart.classList.add('miss');
            dartX = 50;
            const offset = 20 + ((centsDiff - 50) / 50) * 10;
            dartY = isSharp ? (50 - 3 - offset) : (50 + 3 + offset);
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
            dart.classList.add('purple-miss');
            dartX = 50;
            dartY = isSharp ? 10 : 90;
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

        dartboard.appendChild(dart);

        setTimeout(() => {
            dart.style.opacity = '1';
            dart.classList.add('dart-landed');
        }, 600);
    }

    animateDartFlight(targetX, targetY, centsDiff, isMiss = false) {
        const flyingDart = document.createElement('div');
        flyingDart.textContent = '✕';
        flyingDart.style.position = 'absolute';
        flyingDart.style.fontSize = '36px';
        flyingDart.style.fontWeight = 'bold';
        flyingDart.style.color = '#00aaff';
        flyingDart.style.textShadow = '0 0 10px #00aaff';
        flyingDart.style.zIndex = '100';
        flyingDart.style.pointerEvents = 'none';

        const startX = 50;
        const startY = -5;
        flyingDart.style.left = `${startX}%`;
        flyingDart.style.top = `${startY}%`;
        flyingDart.style.transform = 'translate(-50%, -50%)';

        this.dartboard.appendChild(flyingDart);

        const deltaX = targetX - startX;
        const deltaY = targetY - startY;
        const duration = 600;

        let startTime = null;
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            const easeProgress = progress * progress;
            const currentX = startX + deltaX * easeProgress;
            const arc = -15 * Math.sin(progress * Math.PI);
            const currentY = startY + deltaY * easeProgress + arc;

            flyingDart.style.left = `${currentX}%`;
            flyingDart.style.top = `${currentY}%`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                flyingDart.remove();
                if (!isMiss) {
                    this.createFlashEffect(targetX, targetY, centsDiff);
                }
            }
        };

        requestAnimationFrame(animate);
    }

    createFlashEffect(x, y, centsDiff) {
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

        let flashColor;
        if (centsDiff === null || centsDiff <= 1) {
            flashColor = '#ffdd00';
        } else if (centsDiff <= 10) {
            flashColor = '#00ff00';
        } else if (centsDiff <= 25) {
            flashColor = '#ffaa00';
        } else {
            flashColor = '#ff6600';
        }

        flash.style.background = `radial-gradient(circle, ${flashColor}, transparent)`;
        flash.style.opacity = '1';

        this.dartboard.appendChild(flash);

        setTimeout(() => {
            flash.style.transition = 'opacity 0.3s ease-out';
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 300);
        }, 200);
    }

    clearDartboard() {
        if (this.dartboard) {
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

        const MIN_FREQUENCY = 174.61;
        const lowFreq = Math.max(this.vocalRange.low.frequency, MIN_FREQUENCY);
        const highFreq = this.vocalRange.high.frequency;
        const maxRootFreq = highFreq / 2.0;
        const constrainedHighFreq = Math.min(maxRootFreq, highFreq);

        this.rootFrequency = this.toneGenerator.getRandomFrequencyInRange(lowFreq, constrainedHighFreq);
        this.targetFrequencies = this.scaleRatios.map(ratio => this.rootFrequency * ratio);
        this.currentTargetIndex = Math.floor(Math.random() * 7) + 1;

        if (this.targetIndicator) {
            this.targetIndicator.textContent = `Target: ${this.scaleNames[this.currentTargetIndex]}`;
        }

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

        await window.audioManager.initialize();

        this.isListening = true;
        this.listeningStartTime = Date.now();
        this.bestMatch = null;

        this.detectionInterval = setInterval(() => {
            this.checkPitch();
        }, 100);
        this.carModeTimers.push(this.detectionInterval);

        const listenTimer = setTimeout(() => {
            this.carModeResult();
        }, this.matchDuration);
        this.carModeTimers.push(listenTimer);
    }

    carModeResult() {
        this.carModePhase = 'result';
        this.isListening = false;
        clearInterval(this.detectionInterval);

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
        this.toneGenerator.stopTone();
        this.isPlayingTone = false;
        this.isListening = false;

        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }

        this.carModeTimers.forEach(timer => {
            if (typeof timer === 'number') {
                clearTimeout(timer);
                clearInterval(timer);
            }
        });
        this.carModeTimers = [];
        this.carModePhase = null;

        this.container.style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';

        if (window.mainApp) {
            window.mainApp.clearExerciseFromURL();
            window.mainApp.addFadeIn(document.getElementById('appContainer'));
        }
    }
}

// Initialize exercise
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.scaleDartsExercise = new ScaleDartsExercise();
    });
} else {
    window.scaleDartsExercise = new ScaleDartsExercise();
}
