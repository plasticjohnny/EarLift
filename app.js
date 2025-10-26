const TONEDEATH_BUILD_VERSION = '2024.10.21-06';
console.log(`[ToneDeath] App initializing – build ${TONEDEATH_BUILD_VERSION}`);

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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        mainApp = new EarTrainerApp();
        window.mainApp = mainApp;
    });
} else {
    mainApp = new EarTrainerApp();
    window.mainApp = mainApp;
}
