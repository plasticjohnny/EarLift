const earlift_BUILD_VERSION = '2024.10.21-06';
console.log(`[earlift] App initializing – build ${earlift_BUILD_VERSION}`);

// Initialize Profile System
const profileManager = new ProfileManager();
window.profileManager = profileManager;

// Determine which profile to load on startup
const startupProfile = profileManager.getStartupProfile();
console.log('[Profile] Loading startup profile:', startupProfile);

// Initialize global settings with the startup profile
appSettings = new Settings(startupProfile);
window.appSettings = appSettings;

// Initialize FTUE System
const ftueManager = new FTUEManager(startupProfile);
window.ftueManager = ftueManager;

const ftueAnimations = new FTUEAnimations();
window.ftueAnimations = ftueAnimations;

// Main App Class
class EarTrainerApp {
    constructor() {
        this.setupContainer = document.getElementById('setupContainer');
        this.appContainer = document.getElementById('appContainer');
        this.resetSetupBtn = document.getElementById('resetSetupBtn');
        this.exerciseCards = document.querySelectorAll('.exercise-card');
        this.toneGenerator = new ToneGenerator();
        this.isFirstLoad = true;

        this.attachEventListeners();
        this.initialize();
    }

    initialize() {
        // Check if setup is complete
        if (appSettings.isSetupComplete()) {
            this.showMainApp();

            // Check for exercise in URL and auto-start it
            const urlParams = new URLSearchParams(window.location.search);
            const exerciseType = urlParams.get('exercise');
            if (exerciseType) {
                // Delay to ensure everything is loaded
                setTimeout(() => {
                    this.startExercise(exerciseType);
                }, 100);
            }
        } else {
            this.showSetup();
        }
    }

    addFadeIn(element) {
        element.classList.remove('fade-in');
        void element.offsetWidth; // Force reflow
        element.classList.add('fade-in');
    }

    /**
     * Clear exercise parameter from URL (called when returning to main menu)
     */
    clearExerciseFromURL() {
        const url = new URL(window.location);
        url.searchParams.delete('exercise');
        window.history.replaceState({}, '', url);
    }

    showSetup() {
        this.setupContainer.style.display = 'block';
        this.appContainer.style.display = 'none';
        this.addFadeIn(this.setupContainer);
        startSetup();
    }

    showMainApp() {
        this.setupContainer.style.display = 'none';
        this.appContainer.style.display = 'block';
        this.addFadeIn(this.appContainer);
        this.loadVocalRange();
        this.updateExerciseStates();
    }

    loadVocalRange() {
        const range = appSettings.getVocalRange();
        document.getElementById('appLowNote').textContent = Settings.formatNote(range.low);
        document.getElementById('appHighNote').textContent = Settings.formatNote(range.high);

        // Ensure voice type is set (auto-detect if missing)
        if (!range.voiceType && range.low && range.high) {
            const voiceType = appSettings.detectVoiceType(range.low.frequency, range.high.frequency);
            appSettings.setVocalRange(range.low, range.high, voiceType);
            range.voiceType = voiceType;
        }

        // Show voice type if available
        const voiceTypeContainer = document.getElementById('voiceTypeContainer');
        const voiceTypeElement = document.getElementById('appVoiceType');
        if (range.voiceType && voiceTypeContainer && voiceTypeElement) {
            voiceTypeElement.textContent = range.voiceType;
            voiceTypeContainer.style.display = 'flex';
        }
    }

    attachEventListeners() {
        this.resetSetupBtn.addEventListener('click', () => this.resetSetup());

        this.exerciseCards.forEach(card => {
            card.addEventListener('click', () => {
                const exerciseType = card.dataset.exercise;

                // Skip cards without data-exercise attribute (e.g., training mode button)
                if (!exerciseType) {
                    return;
                }

                // Check if exercise is compatible with current usage mode
                if (!appSettings.isExerciseCompatible(exerciseType)) {
                    const usageMode = appSettings.getCurrentUsageModeConfig();
                    alert(`This exercise is not available in ${usageMode.name}. Please change your usage mode in settings.`);
                    return;
                }

                this.startExercise(exerciseType);
            });
        });

        // Category collapse/expand toggles - make entire header clickable
        const categoryHeaders = document.querySelectorAll('.category-header');
        categoryHeaders.forEach(header => {
            header.addEventListener('click', (e) => {
                e.preventDefault();
                const category = header.closest('.exercise-category');
                const toggle = header.querySelector('.category-toggle');
                const isCollapsed = category.classList.toggle('collapsed');

                // Change button text between − and +
                toggle.textContent = isCollapsed ? '+' : '−';
            });
        });

        // Global click handler for helper definition terms
        document.addEventListener('click', (e) => {
            const helperTerm = e.target.closest('.helper-term');
            if (helperTerm && window.helperDefinitionModal) {
                const term = helperTerm.dataset.term;
                if (term) {
                    // Gather context information
                    const context = {
                        inTutorial: !!document.querySelector('[data-tutorial="controls"]'),
                        currentExercise: this.getCurrentExercise()
                    };

                    window.helperDefinitionModal.show(term, context);
                }
            }
        });
    }

    /**
     * Get the current exercise name if in an exercise
     * @returns {string|null}
     */
    getCurrentExercise() {
        // Check if any exercise container is visible
        const exerciseContainers = [
            'intervalOverview',
            'unisonOverview',
            'glissandoOverview',
            'intervalSystem',
            'beatFrequencyFeeling'
        ];

        for (const containerName of exerciseContainers) {
            const container = document.getElementById(containerName);
            if (container && container.style.display !== 'none') {
                return containerName;
            }
        }

        return null;
    }

    updateExerciseStates() {
        // Update visual state of exercise cards based on compatibility
        this.exerciseCards.forEach(card => {
            const exerciseType = card.dataset.exercise;
            const isCompatible = appSettings.isExerciseCompatible(exerciseType);

            if (isCompatible) {
                card.classList.remove('exercise-disabled');
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            } else {
                card.classList.add('exercise-disabled');
                card.style.opacity = '0.4';
                card.style.pointerEvents = 'auto'; // Still allow clicks for alert message
                card.style.filter = 'grayscale(70%)';
            }
        });
    }

    resetSetup() {
        if (confirm('Are you sure you want to reset your vocal range? You will need to set it up again.')) {
            appSettings.reset();
            this.showSetup();
        }
    }

    showSystemExerciseMenu(intervalType) {
        const config = getIntervalConfig(intervalType);
        if (!config) {
            console.error(`No config found for interval type: ${intervalType}`);
            alert(`System exercises for ${intervalType} not available`);
            return;
        }

        const exercises = getSystemExercisesForInterval(intervalType);

        // Show menu screen
        document.getElementById('appContainer').style.display = 'none';
        const menuEl = document.getElementById('systemExerciseMenu');
        menuEl.style.display = 'block';

        // Update title
        document.getElementById('systemExerciseMenuTitle').textContent = `${config.intervalName} System Exercises`;
        document.getElementById('systemExerciseMenuIntervalName').textContent = `${config.intervalName} Exercises`;

        const description = config.intervalType === 'unison'
            ? 'Practice matching pitch with guided exercises'
            : `Practice the ${config.intervalName.toLowerCase()} interval with guided singing exercises`;
        document.getElementById('systemExerciseMenuDescription').textContent = description;

        // Generate exercise cards
        const grid = document.getElementById('systemExerciseMenuGrid');
        grid.innerHTML = '';

        exercises.forEach((exercise, index) => {
            const card = document.createElement('button');
            card.className = 'exercise-card';
            card.innerHTML = `
                <div class="exercise-icon">📝</div>
                <h3>${exercise.name}</h3>
                <p>${exercise.steps.length} steps • Practice this interval relationship</p>
            `;
            card.addEventListener('click', () => {
                this.startSystemExercise(intervalType, index);
            });
            grid.appendChild(card);
        });

        // Add "All Exercises" option
        const allCard = document.createElement('button');
        allCard.className = 'exercise-card';
        allCard.style.borderColor = 'var(--neon-green)';
        allCard.innerHTML = `
            <div class="exercise-icon">📚</div>
            <h3>All Exercises</h3>
            <p>Complete all ${exercises.length} exercises in sequence</p>
        `;
        allCard.addEventListener('click', () => {
            this.startSystemExercise(intervalType, 0, true); // Start from first, do all
        });
        grid.appendChild(allCard);

        // Set up back button
        const backBtn = document.getElementById('systemExerciseMenuBack');
        backBtn.onclick = () => {
            menuEl.style.display = 'none';
            document.getElementById('appContainer').style.display = 'block';
            this.clearExerciseFromURL();
        };

        this.addFadeIn(menuEl);
    }

    startSystemExercise(intervalType, exerciseIndex = 0, doAll = false) {
        const config = getIntervalConfig(intervalType);

        if (!config) {
            console.error(`No config found for interval type: ${intervalType}`);
            alert(`System exercise for ${intervalType} not available`);
            return;
        }

        try {
            // Create or reuse system exercise instance
            if (!window.systemExerciseInstance || !(window.systemExerciseInstance instanceof IntervalSystemExercise)) {
                window.systemExerciseInstance = new IntervalSystemExercise(config, 'intervalSystemExercise');
            } else {
                // Update config for new interval
                window.systemExerciseInstance.intervalConfig = config;
                window.systemExerciseInstance.intervalType = config.intervalType;
                window.systemExerciseInstance.intervalName = config.intervalName;
                window.systemExerciseInstance.isUnison = config.intervalType === 'unison';
                window.systemExerciseInstance.exercises = getSystemExercisesForInterval(config.intervalType);
            }

            // Set starting exercise index
            window.systemExerciseInstance.currentExerciseIndex = exerciseIndex;
            window.systemExerciseInstance.doAllExercises = doAll;

            // Hide menu, start exercise
            document.getElementById('systemExerciseMenu').style.display = 'none';
            window.systemExerciseInstance.start();

            setTimeout(() => {
                const exerciseEl = document.getElementById('intervalSystemExercise');
                if (exerciseEl && exerciseEl.style.display === 'block') {
                    this.addFadeIn(exerciseEl);
                }
            }, 10);
        } catch (error) {
            console.error('Error initializing system exercise:', error);
            alert('Error starting system exercise: ' + error.message);
        }
    }

    startExercise(type) {
        if (type === 'intervalVisualization') {
            type = 'interferenceVisualization';
        }

        console.log('app.js startExercise called with type:', type);

        // Update URL to track current exercise
        const url = new URL(window.location);
        url.searchParams.set('exercise', type);
        window.history.replaceState({}, '', url);
        if (type === 'glissando') {
            // Glissando exercise
            if (window.glissandoExercise) {
                window.glissandoExercise.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('glissandoExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'pitch') {
            // Pitch Match exercise (formerly intonation)
            console.log('Starting pitch exercise, window.intonationExercise exists:', !!window.intonationExercise);
            if (window.intonationExercise) {
                console.log('Calling window.intonationExercise.start()');
                window.intonationExercise.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('intonationExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('window.intonationExercise is not defined!');
            }
        } else if (type === 'pitchhold') {
            // Pitch Hold exercise
            console.log('Starting pitchhold exercise, window.pitchHoldExercise exists:', !!window.pitchHoldExercise);
            if (window.pitchHoldExercise) {
                console.log('Calling window.pitchHoldExercise.start()');
                window.pitchHoldExercise.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('pitchHoldExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('window.pitchHoldExercise is not defined!');
            }
        } else if (type === 'octave') {
            // Octave Match Up exercise
            if (window.octaveExercise) {
                window.octaveExercise.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('octaveExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'scale') {
            // Scale Match Up exercise
            if (window.scaleExerciseInstance) {
                window.scaleExerciseInstance.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('scaleExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'toneSlide') {
            // Tone Slide exercise
            if (window.toneSlideExercise) {
                window.toneSlideExercise.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('toneSlideExercise');
                    if (exerciseEl && exerciseEl.style.display === 'flex') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'diagnostics') {
            // Mic Diagnostics exercise
            if (window.audioDiagnostics) {
                window.audioDiagnostics.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('audioDiagnostics');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'halfStepFeelRoot') {
            // Half-Step Feel the Root exercise
            if (window.halfStepFeelRootExercise) {
                window.halfStepFeelRootExercise.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('halfStepFeelRootExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'wholeStepFeelRoot') {
            // Whole-Step Feel the Root exercise
            if (window.wholeStepFeelRootExercise) {
                window.wholeStepFeelRootExercise.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('wholeStepFeelRootExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'halfStepSlide') {
            // Half-Step Slide exercise
            if (window.halfStepSlideExercise) {
                window.halfStepSlideExercise.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('halfStepSlideExercise');
                    if (exerciseEl && exerciseEl.style.display === 'flex') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'wholeStepSlide') {
            // Whole-Step Slide exercise
            if (window.wholeStepSlideExercise) {
                window.wholeStepSlideExercise.start();
                // Add fade-in to exercise container
                setTimeout(() => {
                    const exerciseEl = document.getElementById('wholeStepSlideExercise');
                    if (exerciseEl && exerciseEl.style.display === 'flex') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'unisonDarts') {
            // Unison Darts exercise
            if (window.unisonDartsExercise) {
                window.unisonDartsExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('unisonDartsExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'halfStepDarts') {
            // Half-Step Darts exercise
            if (window.halfStepDartsExercise) {
                window.halfStepDartsExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('halfStepDartsExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'wholeStepDarts') {
            // Whole-Step Darts exercise
            if (window.wholeStepDartsExercise) {
                window.wholeStepDartsExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('wholeStepDartsExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'octaveFeelRoot') {
            // Octave Feel the Root exercise
            if (window.octaveFeelRootExercise) {
                window.octaveFeelRootExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('octaveFeelRootExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'octaveSlide') {
            // Octave Slide exercise
            if (window.octaveSlideExercise) {
                window.octaveSlideExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('octaveSlideExercise');
                    if (exerciseEl && exerciseEl.style.display === 'flex') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'octaveDarts') {
            // Octave Darts exercise
            if (window.octaveDartsExercise) {
                window.octaveDartsExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('octaveDartsExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'majorThirdFeelRoot') {
            // Major Third Feel the Root exercise
            if (window.majorThirdFeelRootExercise) {
                window.majorThirdFeelRootExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('majorThirdFeelRootExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'majorThirdSlide') {
            // Major Third Slide exercise
            if (window.majorThirdSlideExercise) {
                window.majorThirdSlideExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('majorThirdSlideExercise');
                    if (exerciseEl && exerciseEl.style.display === 'flex') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'majorThirdDarts') {
            // Major Third Darts exercise
            if (window.majorThirdDartsExercise) {
                window.majorThirdDartsExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('majorThirdDartsExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'perfectFourthFeelRoot') {
            // Perfect Fourth Feel the Root exercise
            if (window.perfectFourthFeelRootExercise) {
                window.perfectFourthFeelRootExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('perfectFourthFeelRootExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'perfectFourthSlide') {
            // Perfect Fourth Slide exercise
            if (window.perfectFourthSlideExercise) {
                window.perfectFourthSlideExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('perfectFourthSlideExercise');
                    if (exerciseEl && exerciseEl.style.display === 'flex') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'perfectFourthDarts') {
            // Perfect Fourth Darts exercise
            if (window.perfectFourthDartsExercise) {
                window.perfectFourthDartsExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('perfectFourthDartsExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'perfectFifthFeelRoot') {
            // Perfect Fifth Feel the Root exercise
            if (window.perfectFifthFeelRootExercise) {
                window.perfectFifthFeelRootExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('perfectFifthFeelRootExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'perfectFifthSlide') {
            // Perfect Fifth Slide exercise
            if (window.perfectFifthSlideExercise) {
                window.perfectFifthSlideExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('perfectFifthSlideExercise');
                    if (exerciseEl && exerciseEl.style.display === 'flex') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'perfectFifthDarts') {
            // Perfect Fifth Darts exercise
            if (window.perfectFifthDartsExercise) {
                window.perfectFifthDartsExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('perfectFifthDartsExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'majorSixthFeelRoot') {
            // Major Sixth Feel the Root exercise
            if (window.majorSixthFeelRootExercise) {
                window.majorSixthFeelRootExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('majorSixthFeelRootExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'majorSixthSlide') {
            // Major Sixth Slide exercise
            if (window.majorSixthSlideExercise) {
                window.majorSixthSlideExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('majorSixthSlideExercise');
                    if (exerciseEl && exerciseEl.style.display === 'flex') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'majorSixthDarts') {
            // Major Sixth Darts exercise
            if (window.majorSixthDartsExercise) {
                window.majorSixthDartsExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('majorSixthDartsExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'majorSeventhFeelRoot') {
            // Major Seventh Feel the Root exercise
            if (window.majorSeventhFeelRootExercise) {
                window.majorSeventhFeelRootExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('majorSeventhFeelRootExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'majorSeventhSlide') {
            // Major Seventh Slide exercise
            if (window.majorSeventhSlideExercise) {
                window.majorSeventhSlideExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('majorSeventhSlideExercise');
                    if (exerciseEl && exerciseEl.style.display === 'flex') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'majorSeventhDarts') {
            // Major Seventh Darts exercise
            if (window.majorSeventhDartsExercise) {
                window.majorSeventhDartsExercise.start();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('majorSeventhDartsExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            }
        } else if (type === 'scaleHopping') {
            // Scale Hopping exercise - coming soon
            alert('Scale Hopping exercise coming soon!');
        } else if (type === 'hopToOctave') {
            // Hop to the Octave exercise - coming soon
            alert('Hop to the Octave exercise coming soon!');
        } else if (type === 'scaleDarts') {
            // Scale Darts exercise
            if (window.scaleDartsExercise && window.scaleDartsExercise.start) {
                window.scaleDartsExercise.start();
            } else {
                console.error('Scale Darts exercise not initialized');
            }
        } else if (type === 'earTrainingOverview') {
            // Ear Training Overview tutorial
            if (window.earTrainingOverview && window.earTrainingOverview.start) {
                window.earTrainingOverview.start();
            } else {
                console.error('Ear Training Overview not initialized');
            }
        } else if (type === 'pitchVisualization') {
            // Pitch Visualization exercise
            if (window.pitchVisualization && window.pitchVisualization.start) {
                window.pitchVisualization.start();
            } else {
                console.error('Pitch Visualization not initialized');
            }
        } else if (type === 'tuningForkViz') {
            // Tuning Fork Visualization exercise
            if (window.tuningForkViz && window.tuningForkViz.start) {
                window.tuningForkViz.start();
            } else {
                console.error('Tuning Fork Viz not initialized');
            }
        } else if (type === 'cymaticViz') {
            // Cymatic Visualizations exercise
            if (!window.cymaticViz) {
                window.cymaticViz = new CymaticViz();
            }
            // Show the exercise container
            document.getElementById('cymaticVizExercise').style.display = 'block';
            document.getElementById('appContainer').style.display = 'none';
            // Start the visualization
            setTimeout(() => {
                window.cymaticViz.start();
                const exerciseEl = document.getElementById('cymaticVizExercise');
                if (exerciseEl && exerciseEl.style.display === 'block') {
                    this.addFadeIn(exerciseEl);
                }
            }, 10);
        } else if (type === 'cymaticHarmonicViz') {
            // Cymatic Harmonic Visualization exercise
            // Initialize both renderers if needed
            if (!window.cymaticHarmonicViz) {
                window.cymaticHarmonicViz = new CymaticHarmonicViz();
            }
            if (!window.cymaticHarmonicVizWebGL) {
                try {
                    window.cymaticHarmonicVizWebGL = new CymaticHarmonicVizWebGL();
                } catch (e) {
                    console.warn('WebGL initialization failed:', e);
                }
            }

            // Set up renderer switching
            const rendererSelect = document.getElementById('settingRenderer');
            const rendererInfo = document.getElementById('rendererInfo');
            const canvas2D = document.getElementById('cymaticHarmonicCanvas');
            const canvasWebGL = document.getElementById('cymaticHarmonicCanvasWebGL');

            // Load saved preference or default to WebGL if available
            const savedRenderer = localStorage.getItem('cymaticRenderer') || (window.cymaticHarmonicVizWebGL ? 'webgl' : 'canvas2d');
            rendererSelect.value = savedRenderer;

            // Active renderer reference
            window.activeCymaticRenderer = savedRenderer === 'webgl' ? window.cymaticHarmonicVizWebGL : window.cymaticHarmonicViz;

            // Set initial canvas visibility
            if (savedRenderer === 'webgl' && window.cymaticHarmonicVizWebGL) {
                canvas2D.style.display = 'none';
                canvasWebGL.style.display = 'block';
                rendererInfo.textContent = '✓ GPU-accelerated rendering active';
                rendererInfo.style.color = '#4a4';
            } else {
                canvas2D.style.display = 'block';
                canvasWebGL.style.display = 'none';
                rendererInfo.textContent = 'CPU rendering (compatible mode)';
                rendererInfo.style.color = '#888';
            }

            // Handle renderer switching
            rendererSelect.addEventListener('change', (e) => {
                const newRenderer = e.target.value;

                // Get canvas elements
                const canvas2D = document.getElementById('cymaticHarmonicCanvas');
                const canvasWebGL = document.getElementById('cymaticHarmonicCanvasWebGL');

                // Switch renderer and canvas visibility
                if (newRenderer === 'webgl' && window.cymaticHarmonicVizWebGL) {
                    window.activeCymaticRenderer = window.cymaticHarmonicVizWebGL;
                    canvas2D.style.display = 'none';
                    canvasWebGL.style.display = 'block';
                    rendererInfo.textContent = '✓ GPU-accelerated rendering active';
                    rendererInfo.style.color = '#4a4';
                    localStorage.setItem('cymaticRenderer', 'webgl');

                    // Start WebGL, pause Canvas 2D rendering (but keep audio analysis)
                    window.cymaticHarmonicViz.pauseRendering();
                    window.cymaticHarmonicVizWebGL.start();
                } else {
                    window.activeCymaticRenderer = window.cymaticHarmonicViz;
                    canvas2D.style.display = 'block';
                    canvasWebGL.style.display = 'none';
                    rendererInfo.textContent = newRenderer === 'webgl' ? '✗ WebGL not available' : 'CPU rendering (compatible mode)';
                    rendererInfo.style.color = newRenderer === 'webgl' ? '#a44' : '#888';
                    localStorage.setItem('cymaticRenderer', 'canvas2d');
                    if (newRenderer === 'webgl') {
                        rendererSelect.value = 'canvas2d';
                    }

                    // Stop WebGL and resume Canvas 2D rendering
                    window.cymaticHarmonicViz.resumeRendering();
                    if (window.cymaticHarmonicVizWebGL && typeof window.cymaticHarmonicVizWebGL.stop === 'function') {
                        window.cymaticHarmonicVizWebGL.stop();
                    }
                }
            });

            // Show the exercise container
            document.getElementById('cymaticHarmonicVizExercise').style.display = 'block';
            document.getElementById('appContainer').style.display = 'none';

            // Start both renderers - Canvas 2D handles audio, active renderer handles visuals
            setTimeout(() => {
                // Always start Canvas 2D for audio control
                window.cymaticHarmonicViz.start();

                // Start WebGL if it's the active renderer
                if (savedRenderer === 'webgl' && window.cymaticHarmonicVizWebGL) {
                    window.cymaticHarmonicViz.pauseRendering(); // Pause Canvas 2D rendering
                    window.cymaticHarmonicVizWebGL.start();
                    // Resize WebGL canvas and overlay
                    window.cymaticHarmonicVizWebGL.resize();
                }

                const exerciseEl = document.getElementById('cymaticHarmonicVizExercise');
                if (exerciseEl && exerciseEl.style.display === 'block') {
                    this.addFadeIn(exerciseEl);
                }
            }, 10);
        } else if (type === 'intervalOverview') {
            // Interval Overview - Interference + Wave with Tutorial
            if (typeof showIntervalOverview === 'function') {
                showIntervalOverview();

                setTimeout(() => {
                    const exerciseEl = document.getElementById('intervalOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Interval Overview not available');
            }
        } else if (type === 'unisonOverview') {
            // Unison Overview - Interference + Wave with Tutorial
            if (typeof showUnisonOverview === 'function') {
                showUnisonOverview();

                setTimeout(() => {
                    const exerciseEl = document.getElementById('unisonOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Unison Overview not available');
            }
        } else if (type === 'glissandoOverview') {
            // Glissando Overview Tutorial
            if (window.glissandoOverview && window.glissandoOverview.start) {
                window.glissandoOverview.start();

                setTimeout(() => {
                    const exerciseEl = document.getElementById('glissandoOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Glissando Overview not available');
            }
        } else if (type === 'octaveOverview') {
            // Octave Overview
            if (typeof showOctaveOverview === 'function') {
                showOctaveOverview();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('generalIntervalOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Octave Overview not available');
            }
        } else if (type === 'majorSecondOverview') {
            // Major Second Overview
            if (typeof showMajorSecondOverview === 'function') {
                showMajorSecondOverview();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('generalIntervalOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Major Second Overview not available');
            }
        } else if (type === 'minorSecondOverview') {
            // Minor Second Overview
            if (typeof showMinorSecondOverview === 'function') {
                showMinorSecondOverview();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('generalIntervalOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Minor Second Overview not available');
            }
        } else if (type === 'majorThirdOverview') {
            // Major Third Overview
            if (typeof showMajorThirdOverview === 'function') {
                showMajorThirdOverview();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('generalIntervalOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Major Third Overview not available');
            }
        } else if (type === 'fourthOverview') {
            // Perfect Fourth Overview
            if (typeof showFourthOverview === 'function') {
                showFourthOverview();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('generalIntervalOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Perfect Fourth Overview not available');
            }
        } else if (type === 'fifthOverview') {
            // Perfect Fifth Overview
            if (typeof showFifthOverview === 'function') {
                showFifthOverview();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('generalIntervalOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Perfect Fifth Overview not available');
            }
        } else if (type === 'majorSixthOverview') {
            // Major Sixth Overview
            if (typeof showMajorSixthOverview === 'function') {
                showMajorSixthOverview();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('generalIntervalOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Major Sixth Overview not available');
            }
        } else if (type === 'majorSeventhOverview') {
            // Major Seventh Overview
            if (typeof showMajorSeventhOverview === 'function') {
                showMajorSeventhOverview();
                setTimeout(() => {
                    const exerciseEl = document.getElementById('generalIntervalOverviewExercise');
                    if (exerciseEl && exerciseEl.style.display === 'block') {
                        this.addFadeIn(exerciseEl);
                    }
                }, 10);
            } else {
                console.error('Major Seventh Overview not available');
            }
        } else if (type === 'interferenceVisualization') {
            // Interference Visualization exercise - WebGL only
            if (!window.interferenceViz) {
                try {
                    window.interferenceViz = new InterferenceVisualization();
                } catch (e) {
                    console.error('Failed to initialize Interference Visualization:', e);
                    alert('WebGL is required for Interference Visualization');
                    return;
                }
            }

            // Show the exercise container
            document.getElementById('interferenceVizExercise').style.display = 'block';
            document.getElementById('appContainer').style.display = 'none';

            // Start visualization
            setTimeout(() => {
                window.interferenceViz.start();
                window.interferenceViz.resize();

                const exerciseEl = document.getElementById('interferenceVizExercise');
                if (exerciseEl && exerciseEl.style.display === 'block') {
                    this.addFadeIn(exerciseEl);
                }
            }, 10);
        } else if (type === 'waveVisualization') {
            if (!window.waveVizExercise) {
                window.waveVizExercise = new WaveVisualizationExercise();
            }

            document.getElementById('waveVisualizationExercise').style.display = 'block';
            document.getElementById('appContainer').style.display = 'none';

            setTimeout(() => {
                window.waveVizExercise.start();
                const exerciseEl = document.getElementById('waveVisualizationExercise');
                if (exerciseEl && exerciseEl.style.display === 'block') {
                    this.addFadeIn(exerciseEl);
                }
            }, 10);
        } else if (type === 'beatFrequencyFeeling') {
            // Beat Frequency Feeling exercise
            if (!window.beatFrequencyFeelingInstance) {
                window.beatFrequencyFeelingInstance = new BeatFrequencyFeeling();
            }

            document.getElementById('beatFrequencyFeeling').style.display = 'block';
            document.getElementById('appContainer').style.display = 'none';

            setTimeout(() => {
                window.beatFrequencyFeelingInstance.start();
                const exerciseEl = document.getElementById('beatFrequencyFeeling');
                if (exerciseEl && exerciseEl.style.display === 'block') {
                    this.addFadeIn(exerciseEl);
                }
            }, 10);
        } else if (type.endsWith('SystemExercise')) {
            // System exercises for intervals - show menu to choose which exercise
            const intervalType = type.replace('SystemExercise', '');
            this.showSystemExerciseMenu(intervalType);
        } else {
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} exercise coming soon!`);
        }
    }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        // Force unregister all service workers and clear caches
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
            console.log('Unregistered service worker:', registration.scope);
        }

        // Clear all caches
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
            await caches.delete(cacheName);
            console.log('Deleted cache:', cacheName);
        }

        // Re-register service worker
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// Install button functionality
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) {
        installBtn.style.display = 'block';
    }
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        installBtn.style.display = 'none';
    });
}

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
});

// Initialize the app when DOM is ready
let mainApp;
let trainingUI;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        mainApp = new EarTrainerApp();
        window.mainApp = mainApp;

        // Initialize Training Mode
        initializeTrainingMode();

        // Initialize FTUE
        initializeFTUE();
    });
} else {
    mainApp = new EarTrainerApp();
    window.mainApp = mainApp;

    // Initialize Training Mode
    initializeTrainingMode();

    // Initialize FTUE
    initializeFTUE();
}

/**
 * Initialize Training Mode UI and event listeners
 */
function initializeTrainingMode() {
    // Create training UI instance with current profile
    const currentProfile = profileManager.getCurrentProfileName();
    trainingUI = new TrainingUI(currentProfile);
    window.trainingUI = trainingUI;

    // Update profile display
    updateProfileDisplay();

    // Training Mode button (main menu)
    const trainingModeBtn = document.getElementById('trainingModeBtn');
    if (trainingModeBtn) {
        trainingModeBtn.addEventListener('click', () => {
            trainingUI.startTrainNow();
        });
    }

    // Progress button
    const progressBtn = document.getElementById('progressBtn');
    if (progressBtn) {
        progressBtn.addEventListener('click', () => {
            trainingUI.showProgress();
        });
    }

    // Training Settings button
    const trainingSettingsBtn = document.getElementById('trainingSettingsBtn');
    if (trainingSettingsBtn) {
        trainingSettingsBtn.addEventListener('click', () => {
            trainingUI.showSettings();
        });
    }

    // Training Menu - Exit button
    const trainingExitBtn = document.getElementById('trainingExitBtn');
    if (trainingExitBtn) {
        trainingExitBtn.addEventListener('click', () => {
            trainingUI.hideTrainingMenu();
        });
    }

    // Training Menu - Train Now button
    const trainNowBtn = document.getElementById('trainNowBtn');
    if (trainNowBtn) {
        trainNowBtn.addEventListener('click', () => {
            trainingUI.startTrainNow();
        });
    }

    // Training Menu - Progress button
    const trainingProgressBtn = document.getElementById('trainingProgressBtn');
    if (trainingProgressBtn) {
        trainingProgressBtn.addEventListener('click', () => {
            trainingUI.showProgress();
        });
    }

    // Training Menu - Settings button
    const trainingMenuSettingsBtn = document.getElementById('trainingMenuSettingsBtn');
    if (trainingMenuSettingsBtn) {
        trainingMenuSettingsBtn.addEventListener('click', () => {
            trainingUI.showSettings();
        });
    }

    // Training Settings - Back button
    const trainingSettingsBackBtn = document.getElementById('trainingSettingsBackBtn');
    if (trainingSettingsBackBtn) {
        trainingSettingsBackBtn.addEventListener('click', () => {
            trainingUI.hideSettings();
        });
    }

    // Training Settings - Priority Boost slider
    const priorityBoostSlider = document.getElementById('settingPriorityBoost');
    if (priorityBoostSlider) {
        priorityBoostSlider.addEventListener('input', (e) => {
            trainingUI.updateSetting('priorityBoost', e.target.value);
        });
    }

    // Training Settings - Unlock Threshold slider
    const unlockThresholdSlider = document.getElementById('settingUnlockThreshold');
    if (unlockThresholdSlider) {
        unlockThresholdSlider.addEventListener('input', (e) => {
            trainingUI.updateSetting('unlockThreshold', parseFloat(e.target.value) / 100);
        });
    }

    // Training Settings - Unlock Window slider
    const unlockWindowSlider = document.getElementById('settingUnlockWindow');
    if (unlockWindowSlider) {
        unlockWindowSlider.addEventListener('input', (e) => {
            trainingUI.updateSetting('unlockWindow', e.target.value);
        });
    }

    // Training Settings - Enable Tutorial Mode checkbox
    const enableTutorialModeCheckbox = document.getElementById('settingEnableTutorialMode');
    if (enableTutorialModeCheckbox) {
        enableTutorialModeCheckbox.addEventListener('change', (e) => {
            trainingUI.handleTutorialModeToggle(e.target.checked);
        });
    }

    // Training Settings - Slider Glissando Visualization checkbox
    const sliderGlissandoVizCheckbox = document.getElementById('settingSliderGlissandoVisualization');
    if (sliderGlissandoVizCheckbox) {
        // Initialize from settings
        sliderGlissandoVizCheckbox.checked = appSettings.getSliderGlissandoVisualization();

        sliderGlissandoVizCheckbox.addEventListener('change', (e) => {
            appSettings.setSliderGlissandoVisualization(e.target.checked);
        });
    }

    // Training Settings - Reset button
    const resetTrainingDataBtn = document.getElementById('resetTrainingDataBtn');
    if (resetTrainingDataBtn) {
        resetTrainingDataBtn.addEventListener('click', () => {
            trainingUI.resetTrainingData();
        });
    }

    // Training Progress - Back button
    const trainingProgressBackBtn = document.getElementById('trainingProgressBackBtn');
    if (trainingProgressBackBtn) {
        trainingProgressBackBtn.addEventListener('click', () => {
            trainingUI.hideProgress();
        });
    }

    // Rating UI - Rating buttons
    const ratingButtons = document.querySelectorAll('.rating-btn');
    ratingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const rating = btn.getAttribute('data-rating');
            trainingUI.handleRating(rating);
        });
    });

    // Rating UI - Exit button
    const trainingRatingExitBtn = document.getElementById('trainingRatingExitBtn');
    if (trainingRatingExitBtn) {
        trainingRatingExitBtn.addEventListener('click', () => {
            trainingUI.exitTrainingMode();
        });
    }

    // ==== PROFILE MANAGEMENT EVENT LISTENERS ====

    // Enable Profile System checkbox
    const enableProfileSystemCheckbox = document.getElementById('enableProfileSystem');
    if (enableProfileSystemCheckbox) {
        enableProfileSystemCheckbox.checked = profileManager.isEnabled();
        enableProfileSystemCheckbox.addEventListener('change', (e) => {
            profileManager.setEnabled(e.target.checked);
            updateProfileDisplay();
            updateProfileManagementUI();
        });
    }

    // Auto-load preference radio buttons
    const autoLoadLastRadio = document.getElementById('autoLoadLast');
    const autoLoadDefaultRadio = document.getElementById('autoLoadDefault');
    if (autoLoadLastRadio && autoLoadDefaultRadio) {
        const pref = profileManager.getAutoLoadPreference();
        if (pref === 'last') {
            autoLoadLastRadio.checked = true;
        } else {
            autoLoadDefaultRadio.checked = true;
        }

        autoLoadLastRadio.addEventListener('change', () => {
            if (autoLoadLastRadio.checked) {
                profileManager.setAutoLoadPreference('last');
            }
        });

        autoLoadDefaultRadio.addEventListener('change', () => {
            if (autoLoadDefaultRadio.checked) {
                profileManager.setAutoLoadPreference('default');
            }
        });
    }

    // Add Profile button
    const addProfileBtn = document.getElementById('addProfileBtn');
    const newProfileNameInput = document.getElementById('newProfileName');
    if (addProfileBtn && newProfileNameInput) {
        addProfileBtn.addEventListener('click', () => {
            const name = newProfileNameInput.value.trim();
            if (!name) {
                alert('Please enter a profile name');
                return;
            }

            const result = profileManager.createProfile(name);
            if (result.success) {
                // Switch to new profile
                switchToProfile(result.profileName);
                newProfileNameInput.value = '';
                updateProfileList();
            } else {
                alert(result.error);
            }
        });

        // Allow Enter key to add profile
        newProfileNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addProfileBtn.click();
            }
        });
    }

    // Initialize profile management UI
    updateProfileManagementUI();
    updateProfileList();

    // ==== PROFILE SWITCHER DIALOG EVENT LISTENERS ====

    // Click on profile name to show switcher
    const profileNameSpan = document.getElementById('currentProfileName');
    if (profileNameSpan) {
        profileNameSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            // Only show if profiles are enabled
            if (profileManager.isEnabled()) {
                showProfileSwitcher();
            }
        });
    }

    // Close button
    const closeProfileSwitcherBtn = document.getElementById('closeProfileSwitcher');
    if (closeProfileSwitcherBtn) {
        closeProfileSwitcherBtn.addEventListener('click', () => {
            hideProfileSwitcher();
        });
    }

    // Click outside dialog to close
    const profileSwitcherOverlay = document.getElementById('profileSwitcherModal');
    if (profileSwitcherOverlay) {
        profileSwitcherOverlay.addEventListener('click', (e) => {
            if (e.target === profileSwitcherOverlay) {
                hideProfileSwitcher();
            }
        });
    }
}

/**
 * Update profile display in header
 */
function updateProfileDisplay() {
    const profileDisplay = document.getElementById('currentProfileDisplay');
    const profileNameSpan = document.getElementById('currentProfileName');

    if (profileDisplay && profileNameSpan) {
        const isEnabled = profileManager.isEnabled();
        const currentProfile = profileManager.getCurrentProfileName();

        if (isEnabled) {
            profileDisplay.style.display = 'inline';
            profileNameSpan.textContent = currentProfile;
        } else {
            profileDisplay.style.display = 'none';
        }
    }
}

/**
 * Update profile management UI visibility
 */
function updateProfileManagementUI() {
    const profileManagementSection = document.getElementById('profileManagementSection');
    const currentProfileNameSetting = document.getElementById('currentProfileNameSetting');

    if (profileManagementSection) {
        const isEnabled = profileManager.isEnabled();
        profileManagementSection.style.display = isEnabled ? 'block' : 'none';
    }

    if (currentProfileNameSetting) {
        currentProfileNameSetting.textContent = profileManager.getCurrentProfileName();
    }
}

/**
 * Update profile list in settings
 */
function updateProfileList() {
    const profileListContainer = document.getElementById('profileListContainer');
    if (!profileListContainer) return;

    const profiles = profileManager.getProfiles();
    const currentProfile = profileManager.getCurrentProfileName();
    const profileNames = Object.keys(profiles).sort();

    profileListContainer.innerHTML = '';

    profileNames.forEach(profileName => {
        const profileItem = document.createElement('div');
        profileItem.className = 'profile-list-item';
        if (profileName === currentProfile) {
            profileItem.classList.add('active-profile');
        }

        const profileInfo = document.createElement('div');
        profileInfo.className = 'profile-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'profile-name';
        nameSpan.textContent = profileName;
        if (profileName === currentProfile) {
            nameSpan.textContent += ' (active)';
        }

        profileInfo.appendChild(nameSpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'profile-actions';

        // Load button
        if (profileName !== currentProfile) {
            const loadBtn = document.createElement('button');
            loadBtn.textContent = 'Load';
            loadBtn.className = 'btn-secondary btn-small';
            loadBtn.addEventListener('click', () => {
                switchToProfile(profileName);
            });
            actionsDiv.appendChild(loadBtn);
        }

        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Reset';
        resetBtn.className = 'btn-secondary btn-small';
        resetBtn.addEventListener('click', () => {
            if (confirm(`Are you sure you want to reset all data for profile "${profileName}"? This cannot be undone.`)) {
                const result = profileManager.resetProfile(profileName);
                if (result.success) {
                    alert(`Profile "${profileName}" has been reset.`);
                    // If it's the current profile, reinitialize
                    if (profileName === currentProfile) {
                        location.reload();
                    }
                } else {
                    alert(result.error);
                }
            }
        });
        actionsDiv.appendChild(resetBtn);

        // Delete button (not for Default profile)
        if (profileName !== 'Default') {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'btn-danger btn-small';
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete profile "${profileName}"? This cannot be undone.`)) {
                    const result = profileManager.deleteProfile(profileName);
                    if (result.success) {
                        updateProfileList();
                        alert(`Profile "${profileName}" has been deleted.`);
                    } else {
                        alert(result.error);
                    }
                }
            });
            actionsDiv.appendChild(deleteBtn);
        }

        profileItem.appendChild(profileInfo);
        profileItem.appendChild(actionsDiv);
        profileListContainer.appendChild(profileItem);
    });
}

/**
 * Show profile switcher dialog
 */
function showProfileSwitcher() {
    const modal = document.getElementById('profileSwitcherModal');
    if (!modal) return;

    // Populate with profiles
    populateProfileSwitcher();

    // Show modal
    modal.style.display = 'flex';
}

/**
 * Hide profile switcher dialog
 */
function hideProfileSwitcher() {
    const modal = document.getElementById('profileSwitcherModal');
    if (!modal) return;

    modal.style.display = 'none';
}

/**
 * Populate profile switcher with list of profiles
 */
function populateProfileSwitcher() {
    const listContainer = document.getElementById('profileSwitcherList');
    if (!listContainer) return;

    const profiles = profileManager.getProfiles();
    const currentProfile = profileManager.getCurrentProfileName();
    const profileNames = Object.keys(profiles).sort();

    listContainer.innerHTML = '';

    profileNames.forEach(profileName => {
        const item = document.createElement('button');
        item.className = 'profile-switcher-item';
        item.textContent = profileName;

        if (profileName === currentProfile) {
            item.classList.add('active');
        }

        // Click to switch profile
        item.addEventListener('click', () => {
            hideProfileSwitcher();
            if (profileName !== currentProfile) {
                switchToProfile(profileName);
            }
        });

        listContainer.appendChild(item);
    });
}

/**
 * Switch to a different profile
 */
function switchToProfile(profileName) {
    console.log('[Profile] Switching to profile:', profileName);

    // Switch profile in manager
    const result = profileManager.switchProfile(profileName);
    if (!result.success) {
        alert(result.error);
        return;
    }

    // Update app settings with new profile
    appSettings = new Settings(profileName);
    window.appSettings = appSettings;

    // Update training UI with new profile
    trainingUI.switchProfile(profileName);

    // Update UI
    updateProfileDisplay();
    updateProfileManagementUI();
    updateProfileList();

    // If we're in training mode, exit it
    if (trainingUI.isInTrainingMode) {
        trainingUI.exitTrainingMode();
    }

    // Reload the page to ensure all components use the new profile
    // This is the safest approach to ensure consistency
    setTimeout(() => {
        location.reload();
    }, 500);
}

/**
 * Initialize FTUE (First Time User Experience) System
 */
function initializeFTUE() {
    console.log('[FTUE] Initializing FTUE system');

    // Apply initial lock states
    updateFTUELocks();

    // Update progress bar
    updateFTUEProgress();

    // Prevent Tutorial section collapse during FTUE
    setupTutorialSectionBehavior();

    // Unlock All button
    const unlockAllBtn = document.getElementById('ftueUnlockAllBtn');
    if (unlockAllBtn) {
        unlockAllBtn.addEventListener('click', handleUnlockAll);
    }

    // Training Mode button - check if locked or if Glissando prompt is active
    const trainingModeBtn = document.getElementById('trainingModeBtn');
    const progressBtn = document.getElementById('progressBtn');
    const trainingSettingsBtn = document.getElementById('trainingSettingsBtn');

    // Override clicks if locked or if Glissando prompt is active
    [trainingModeBtn, progressBtn, trainingSettingsBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', (e) => {
                // Check if Training Mode is completely locked (not unlocked yet)
                if (!ftueManager.isTrainingModeUnlocked()) {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('[FTUE] Training Mode is locked');
                    return;
                }

                // Check if Glissando Overview prompt is active (should do Glissando first)
                if (ftueManager.isGlissandoPromptActive()) {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('[FTUE] Glissando Overview should be completed first');
                    showGlissandoPromptModal();
                    return;
                }
            }, true); // Use capture phase to intercept before other handlers
        }
    });

    // Listen for Glissando Overview unlock event
    window.addEventListener('glissandoOverviewUnlocked', () => {
        console.log('[FTUE] Glissando Overview unlocked - updating UI');
        updateFTUELocks();
        updateFTUEProgress();

        // Play unlock animation if available
        const glissandoCard = document.querySelector('[data-tutorial-card="glissandoOverview"]');
        if (glissandoCard && window.ftueAnimations && window.ftueAnimations.playUnlockSequence) {
            window.ftueAnimations.playUnlockSequence(glissandoCard, 'Glissando Overview');
        }
    });

    // Listen for Interval Overview unlock event
    window.addEventListener('intervalOverviewUnlocked', () => {
        console.log('[FTUE] Interval Overview unlocked - updating UI');
        updateFTUELocks();
        updateFTUEProgress();

        // Play unlock animation if available
        const intervalCard = document.querySelector('[data-tutorial-card="intervalOverview"]');
        if (intervalCard && window.ftueAnimations && window.ftueAnimations.playUnlockSequence) {
            window.ftueAnimations.playUnlockSequence(intervalCard, 'Interval Overview');
        }
    });
}

/**
 * Show modal prompting user to complete Glissando Overview
 * Also highlights the Glissando Overview card
 */
function showGlissandoPromptModal() {
    // Create modal backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'glissando-prompt-modal-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease-out;
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'glissando-prompt-modal';
    modal.style.cssText = `
        background: var(--color-surface, #2C2C2E);
        border: 2px solid var(--color-accent, #A568D9);
        border-radius: 12px;
        padding: 32px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        animation: slideUp 0.3s ease-out;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;

    modal.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
        <h2 style="color: var(--color-accent, #A568D9); margin: 0 0 16px 0; font-size: 24px;">Ready for the Next Level!</h2>
        <p style="color: var(--color-text, #FFFFFF); margin: 0 0 24px 0; line-height: 1.6; font-size: 16px;">
            You've mastered Slider Glissando! Now it's time to learn how to use your <strong>voice</strong> to match pitch.
        </p>
        <p style="color: var(--color-text-secondary, #B0B0B0); margin: 0 0 32px 0; font-size: 14px;">
            Complete <strong>Glissando Overview</strong> to unlock Training Mode
        </p>
        <button id="glissandoPromptOk" style="
            background: linear-gradient(135deg, var(--color-accent, #A568D9), var(--color-accent-dark, #7B3AA0));
            color: white;
            border: none;
            padding: 12px 32px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        ">Got it!</button>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Highlight Glissando Overview card
    const glissandoCard = document.querySelector('[data-tutorial-card="glissandoOverview"]');
    if (glissandoCard) {
        // Scroll to card
        glissandoCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add highlight animation
        setTimeout(() => {
            if (window.ftueAnimations && window.ftueAnimations.highlightElement) {
                window.ftueAnimations.highlightElement(glissandoCard);
            } else {
                // Fallback: simple highlight
                glissandoCard.style.animation = 'none';
                setTimeout(() => {
                    glissandoCard.style.animation = 'pulse 1s ease-in-out 3';
                }, 10);
            }
        }, 300);
    }

    // Close modal on button click or backdrop click
    const closeModal = () => {
        backdrop.style.animation = 'fadeOut 0.2s ease-out';
        setTimeout(() => backdrop.remove(), 200);
    };

    document.getElementById('glissandoPromptOk').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeModal();
    });
}

/**
 * Update FTUE lock states on tutorial cards and Training Mode
 */
function updateFTUELocks() {
    // Tutorial cards
    const tutorialCards = [
        { name: 'earTrainingOverview', card: document.querySelector('[data-tutorial-card="earTrainingOverview"]') },
        { name: 'unisonOverview', card: document.querySelector('[data-tutorial-card="unisonOverview"]') },
        { name: 'glissandoOverview', card: document.querySelector('[data-tutorial-card="glissandoOverview"]') }
    ];

    tutorialCards.forEach(({ name, card }) => {
        if (card) {
            const isUnlocked = ftueManager.isTutorialUnlocked(name);
            const lockOverlay = card.querySelector('.tutorial-lock-overlay');

            if (isUnlocked) {
                card.classList.remove('tutorial-card-locked');
                if (lockOverlay) lockOverlay.style.display = 'none';
            } else {
                card.classList.add('tutorial-card-locked');
                if (lockOverlay) lockOverlay.style.display = 'flex';
            }
        }
    });

    // Training Mode lock
    const trainingModeLock = document.querySelector('.training-mode-lock-overlay');
    const trainingModeSection = document.getElementById('trainingModeSection');

    if (ftueManager.isTrainingModeUnlocked()) {
        if (trainingModeLock) trainingModeLock.style.display = 'none';
        if (trainingModeSection) trainingModeSection.classList.remove('training-mode-locked');
    } else {
        if (trainingModeLock) trainingModeLock.style.display = 'flex';
        if (trainingModeSection) trainingModeSection.classList.add('training-mode-locked');
    }
}

/**
 * Update FTUE progress bar
 */
function updateFTUEProgress() {
    const progress = ftueManager.getProgress();
    const progressFill = document.getElementById('ftueProgressFill');
    const progressText = document.getElementById('ftueProgressText');

    if (progressFill) {
        progressFill.style.width = `${progress.percentage}%`;
    }

    if (progressText) {
        progressText.textContent = `${progress.completed} / ${progress.total}`;
    }

    // Hide "Unlock All" button if everything is unlocked
    const unlockAllContainer = document.querySelector('.ftue-unlock-all-container');
    if (unlockAllContainer) {
        const allUnlocked = ftueManager.isTrainingModeUnlocked();
        unlockAllContainer.style.display = allUnlocked ? 'none' : 'block';
    }
}

/**
 * Prevent Tutorial section from collapsing during FTUE
 */
function setupTutorialSectionBehavior() {
    const tutorialSection = document.getElementById('tutorialSection');
    const tutorialToggle = document.getElementById('tutorialCategoryToggle');

    if (!tutorialToggle || !tutorialSection) return;

    tutorialToggle.addEventListener('click', (e) => {
        // Prevent collapse if FTUE is incomplete
        if (!ftueManager.isTrainingModeUnlocked()) {
            e.stopPropagation();
            e.preventDefault();
            console.log('[FTUE] Cannot collapse Tutorial section during FTUE');

            // Optional: Show a brief visual feedback
            tutorialToggle.style.opacity = '0.5';
            setTimeout(() => {
                tutorialToggle.style.opacity = '1';
            }, 200);
        }
    });

    // Keep section expanded during FTUE
    if (!ftueManager.isTrainingModeUnlocked()) {
        tutorialSection.classList.remove('collapsed');
    }
}

/**
 * Handle tutorial completion - triggers unlock animations
 */
window.handleTutorialCompletion = async function(tutorialName) {
    console.log(`[FTUE] Tutorial ${tutorialName} completed!`);

    // Mark as complete and get what was unlocked
    const unlockedItem = ftueManager.markTutorialComplete(tutorialName);

    if (!unlockedItem) {
        console.warn('[FTUE] No item unlocked');
        return;
    }

    console.log(`[FTUE] Unlocked: ${unlockedItem}`);

    // Update locks and progress
    updateFTUELocks();
    updateFTUEProgress();

    // Wait a moment before animation
    await new Promise(resolve => setTimeout(resolve, 300));

    if (unlockedItem === 'trainingMode') {
        // All tutorials complete - Training Mode unlocked!
        await showTrainingModeUnlockCelebration();

        // Also unlock bonus tutorials with animation
        for (const bonusTutorial of ftueManager.bonusTutorials) {
            const bonusCard = document.querySelector(`[data-tutorial-card="${bonusTutorial}"]`);
            if (bonusCard) {
                console.log(`[FTUE] Unlocking bonus tutorial: ${bonusTutorial}`);
                await ftueAnimations.playUnlockSequence(bonusCard, bonusTutorial, () => {
                    console.log(`[FTUE] ${bonusTutorial} unlock animation complete`);
                });
            }
        }
    } else {
        // Next tutorial unlocked
        const nextCard = document.querySelector(`[data-tutorial-card="${unlockedItem}"]`);
        if (nextCard) {
            await ftueAnimations.playUnlockSequence(nextCard, unlockedItem, () => {
                console.log(`[FTUE] ${unlockedItem} unlock animation complete`);
            });
        }
    }
};

/**
 * Show Training Mode unlock celebration
 */
async function showTrainingModeUnlockCelebration() {
    console.log('[FTUE] Showing Training Mode unlock celebration');

    // First, scroll to Training Mode section so user sees the unlock happen
    const trainingModeSection = document.getElementById('trainingModeSection');
    if (trainingModeSection) {
        console.log('[FTUE] Scrolling to Training Mode section');
        ftueAnimations.scrollToElement(trainingModeSection);

        // Wait for scroll to complete
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    // Now show the celebration at the Training Mode location
    await ftueAnimations.playBigCelebration({
        title: '🎉 Training Mode Unlocked!',
        message: 'You\'ve completed all tutorials! You\'re ready to start your ear training journey.',
        onComplete: null
    });
}

/**
 * Handle "Unlock All" button click
 */
async function handleUnlockAll() {
    console.log('[FTUE] Unlock All clicked');

    // Unlock everything
    ftueManager.unlockAll();

    // Update UI
    updateFTUELocks();
    updateFTUEProgress();

    // Play big celebration
    await ftueAnimations.playBigCelebration({
        title: '🔓 All Unlocked!',
        message: 'All tutorials and Training Mode are now available. Happy training!',
        onComplete: null
    });
}
