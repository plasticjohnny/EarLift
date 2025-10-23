# Interference Visualization Integration Guide

This guide explains how to integrate the Interference Visualization components into other exercises in the ToneDeath ear training app.

## Overview

The Interference Visualization has been refactored into 4 reusable modules that can be integrated into any exercise:

1. **ConsonanceColorSystem** - Color calculation based on frequency relationships
2. **SpeakerOverlayRenderer** - 2D canvas overlay for speaker icons
3. **DualToneAudioController** - Audio playback and beat amplitude management
4. **HarmonicRendererSettings** - Configuration presets for visualization

## Module Descriptions

### 1. ConsonanceColorSystem (`lib/consonanceColorSystem.js`)

Calculates colors based on consonance/dissonance of frequency relationships.

**Key Features:**
- Consonant intervals (unison, perfect 5th, octave) → Cyan/Blue
- Dissonant intervals (tritone, minor 2nd, major 7th) → Red/Orange
- Smooth gradients for intermediate intervals

**Usage:**
```javascript
// Get color for a frequency relative to a root
const color = ConsonanceColorSystem.getFrequencyColor(554, 440); // Returns hex color

// Calculate dissonance value (0.0 = consonant, 1.0 = dissonant)
const dissonance = ConsonanceColorSystem.getDissonanceCurve(600); // Tritone = 600 cents

// Color conversion utilities
const rgb = ConsonanceColorSystem.hexToRgb('#00ffff'); // Returns [r, g, b] 0-1
const hex = ConsonanceColorSystem.hslToHex(180, 60, 65); // Returns hex color
```

**Integration Example:**
```javascript
// In your exercise code
class MyExercise {
    updateToneColors() {
        const rootFreq = 440;
        const intervalFreq = 554;

        // Get colors based on consonance
        this.tone1Color = ConsonanceColorSystem.getFrequencyColor(rootFreq, rootFreq); // Cyan
        this.tone2Color = ConsonanceColorSystem.getFrequencyColor(intervalFreq, rootFreq); // Color based on interval

        // Use colors in your visualization
        this.drawTone(this.tone1Color);
        this.drawTone(this.tone2Color);
    }
}
```

---

### 2. SpeakerOverlayRenderer (`lib/speakerOverlayRenderer.js`)

Manages a 2D canvas overlay on top of any canvas (WebGL or 2D) to render speaker icons with visual feedback.

**Key Features:**
- Automatic canvas overlay creation and positioning
- Pulsing animation when tones are active
- Inactive state visualization (dark with outline)
- Responsive sizing (8% of smallest canvas dimension, clamped 40-80px)
- Colored glow effect matching tone colors

**Usage:**
```javascript
// Create overlay on top of your main canvas
const canvas = document.getElementById('myCanvas');
const overlayRenderer = new SpeakerOverlayRenderer(canvas);

// Render speaker icons each frame
function render() {
    // Prepare state objects for each tone
    const tone1State = {
        x: canvasWidth * 0.3,    // X position in pixels
        y: canvasHeight * 0.5,   // Y position in pixels
        color: '#00ffff',         // Hex color
        label: 'T1',              // Label (currently not rendered, but reserved)
        isActive: true            // Whether tone is playing
    };

    const tone2State = {
        x: canvasWidth * 0.7,
        y: canvasHeight * 0.5,
        color: '#ff00ff',
        label: 'T2',
        isActive: false
    };

    overlayRenderer.render(tone1State, tone2State);
}

// Handle resize
window.addEventListener('resize', () => {
    overlayRenderer.resize(newWidth, newHeight);
});

// Clean up when done
overlayRenderer.destroy();
```

**Integration Example:**
```javascript
class MyExercise {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);

        // Create overlay after canvas is ready
        setTimeout(() => {
            this.overlayRenderer = new SpeakerOverlayRenderer(this.canvas);
        }, 100);
    }

    animate() {
        // Your main rendering
        this.renderVisualization();

        // Overlay on top
        if (this.overlayRenderer) {
            this.overlayRenderer.render(
                this.getTone1State(),
                this.getTone2State()
            );
        }

        requestAnimationFrame(() => this.animate());
    }

    getTone1State() {
        return {
            x: this.canvas.width * this.tone1X,
            y: this.canvas.height * this.tone1Y,
            color: this.tone1Color,
            label: 'Root',
            isActive: this.isPlayingTone1
        };
    }
}
```

---

### 3. DualToneAudioController (`lib/dualToneAudioController.js`)

Manages two ToneGenerator instances for dual-tone audio playback with synchronized state management.

**Key Features:**
- Dual-tone playback control (play/stop individual or both)
- Frequency management with live updates
- Beat amplitude calculation (for interference visualization)
- Timing management for expand/contract animations
- State queries for playback status

**Usage:**
```javascript
// Create audio controller
const audioCtrl = new DualToneAudioController();

// Set frequencies
audioCtrl.setFrequencies(440, 554);

// Playback control
audioCtrl.playBoth();              // Start both tones
audioCtrl.playTone1();             // Start tone 1 only
audioCtrl.stopTone2();             // Stop tone 2
audioCtrl.stopBoth();              // Stop both tones

// Update frequency while playing (smooth transition)
audioCtrl.setTone1Frequency(493.88, true); // updateIfPlaying = true

// Update frequencies without animation reset (for randomize/interval buttons)
audioCtrl.setFrequencies(330, 440);
audioCtrl.updatePlayingFrequencies(); // Updates if already playing

// Get beat amplitude for visualization (0.0 to 1.0)
const beatAmp = audioCtrl.getBeatAmplitude(); // Oscillates at difference frequency

// Query state
const state = audioCtrl.getState(); // Returns full state object
console.log(state.isPlayingTone1);  // Boolean
console.log(state.tone1Freq);       // Number (Hz)
console.log(state.tone1StartTime);  // Timestamp for animations
console.log(state.beatAmplitude);   // Current beat amplitude

// Convenience queries
if (audioCtrl.isAnyPlaying()) { /* ... */ }
if (audioCtrl.areBothPlaying()) { /* ... */ }

// Clean up
audioCtrl.destroy();
```

**Integration Example:**
```javascript
class FeelTheRootExercise {
    constructor() {
        this.audioController = new DualToneAudioController();
        this.audioController.setFrequencies(440, 440); // Start with unison
    }

    playInterval(semitones) {
        const rootFreq = 440;
        const intervalFreq = rootFreq * Math.pow(2, semitones / 12);

        this.audioController.setFrequencies(rootFreq, intervalFreq);

        // Play with expand animation
        this.audioController.playBoth();

        // Update UI
        this.updateButtonStates();
    }

    animate() {
        // Use beat amplitude for visual effects
        const beatAmp = this.audioController.getBeatAmplitude();
        this.drawVisualization(beatAmp);

        requestAnimationFrame(() => this.animate());
    }

    updateButtonStates() {
        const state = this.audioController.getState();
        this.playButton.textContent = state.isPlayingTone1 ? 'Stop' : 'Play';
    }
}
```

---

### 4. HarmonicRendererSettings (`lib/harmonicRendererSettings.js`)

Provides configuration presets for the WebGL harmonic interference renderer.

**Key Features:**
- Default settings (current Interval Visualization configuration)
- Minimal settings (no effects, performance mode)
- Exercise-specific presets
- Settings merging and validation

**Usage:**
```javascript
// Get default settings (current production config)
const settings = HarmonicRendererSettings.getDefault();

// Get minimal settings (no effects)
const minimalSettings = HarmonicRendererSettings.getMinimal();

// Get settings for specific exercise
const feelRootSettings = HarmonicRendererSettings.forExercise('feel-root');
const intervalSettings = HarmonicRendererSettings.forExercise('interval');

// Merge custom settings
const customSettings = HarmonicRendererSettings.merge(
    HarmonicRendererSettings.getDefault(),
    {
        gravityStrength: 200.0,  // Custom strength
        boundaryRadius: 350      // Larger radius
    }
);

// Validate settings (fills in missing values with defaults)
const validated = HarmonicRendererSettings.validate(myPartialSettings);

// Get gravity wells preset with specific variant
const variant5Settings = HarmonicRendererSettings.getGravityWellsPreset(5); // Pulsing Black Holes
```

**Settings Structure:**
```javascript
{
    // Core visualization
    amplitude: 1.0,
    harmonicOrder: 5,

    // Tone colors (dynamically calculated)
    tone1Color: '#00ffff',
    tone2Color: '#00ffff',

    // Intensity
    rootIntensity: 1.0,
    intervalIntensity: 0.8,
    intersectionIntensity: 1.2,

    // Gravity Wells - Pulsing Black Holes variant
    gravityWell: true,
    gravityStrength: 170.0,
    gravityWellCount: 5,
    gravityVariant5: true,
    eventHorizon: 10.0,
    pulseDepth: 0.5,
    wellJitter: true,
    jitterIntensity: 1.0,
    wellBreathing: true,
    consonantBreathSpeed: 0.1,
    dissonantPulseSpeed: 2.0,

    // Boundaries
    useBoundary: true,
    boundaryRadius: 300,
    speakerRadius: 30,

    // Color mode
    colorMode: 'consonance',
    rootFreq: 440
}
```

**Integration Example:**
```javascript
class ScaleDartsExercise {
    constructor() {
        // Use custom settings for this exercise
        this.settings = HarmonicRendererSettings.merge(
            HarmonicRendererSettings.getDefault(),
            {
                gravityStrength: 150.0,     // Slightly weaker
                boundaryRadius: 250,        // Smaller radius
                gravityWellCount: 3         // Fewer wells
            }
        );

        // Pass to renderer
        this.renderer = new MyRenderer(this.canvas, this.settings);
    }
}
```

---

## Complete Integration Example: "Feel the Root" Exercise

Here's a complete example of integrating all modules into a new exercise:

```javascript
class FeelTheRootExercise {
    constructor(canvasId = 'feelRootCanvas') {
        // Get canvas
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`);
        }

        // Initialize settings
        this.settings = HarmonicRendererSettings.forExercise('feel-root');

        // Initialize audio controller
        this.audioController = new DualToneAudioController();
        this.audioController.setFrequencies(440, 440);

        // Speaker positions (normalized 0-1)
        this.tone1X = 0.5;  // Center for root
        this.tone1Y = 0.5;
        this.tone2X = 0.5;  // Same position initially
        this.tone2Y = 0.5;

        // Create overlay renderer (after canvas is ready)
        setTimeout(() => {
            this.overlayRenderer = new SpeakerOverlayRenderer(this.canvas);
        }, 100);

        // Initialize your WebGL/Canvas2D renderer here
        // this.renderer = new YourRenderer(this.canvas, this.settings);

        // Start animation loop
        this.animate();
    }

    playInterval(semitones) {
        const rootFreq = 440;
        const intervalFreq = rootFreq * Math.pow(2, semitones / 12);

        // Update colors based on interval
        this.settings.tone1Color = ConsonanceColorSystem.getFrequencyColor(rootFreq, rootFreq);
        this.settings.tone2Color = ConsonanceColorSystem.getFrequencyColor(intervalFreq, rootFreq);

        // Update audio
        this.audioController.setFrequencies(rootFreq, intervalFreq);
        this.audioController.playBoth();

        // Animate tone 2 position to show interval
        this.animateTone2Position(semitones);
    }

    animateTone2Position(semitones) {
        // Move tone 2 based on interval size
        const angle = (semitones / 12) * Math.PI * 2;
        const radius = 0.3;
        this.tone2X = 0.5 + Math.cos(angle) * radius;
        this.tone2Y = 0.5 + Math.sin(angle) * radius;
    }

    animate() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Your main visualization rendering here
        // this.renderer.render(...);

        // Get beat amplitude for effects
        const beatAmp = this.audioController.getBeatAmplitude();
        // Use beatAmp for visual effects in your renderer

        // Render speaker overlay
        if (this.overlayRenderer) {
            const state = this.audioController.getState();

            const tone1State = {
                x: width * this.tone1X,
                y: height * this.tone1Y,
                color: this.settings.tone1Color,
                label: 'Root',
                isActive: state.isPlayingTone1
            };

            const tone2State = {
                x: width * this.tone2X,
                y: height * this.tone2Y,
                color: this.settings.tone2Color,
                label: 'Interval',
                isActive: state.isPlayingTone2
            };

            this.overlayRenderer.render(tone1State, tone2State);
        }

        requestAnimationFrame(() => this.animate());
    }

    stop() {
        this.audioController.stopBoth();
    }

    destroy() {
        this.stop();

        if (this.audioController) {
            this.audioController.destroy();
        }

        if (this.overlayRenderer) {
            this.overlayRenderer.destroy();
        }

        // Clean up your renderer
        // this.renderer.destroy();
    }
}

// Usage
const exercise = new FeelTheRootExercise('myCanvasId');
exercise.playInterval(7); // Play perfect 5th
```

---

## HTML Integration

Don't forget to include the modules in your HTML:

```html
<!-- Interval Visualization Modules -->
<script src="lib/consonanceColorSystem.js?v=1"></script>
<script src="lib/speakerOverlayRenderer.js?v=1"></script>
<script src="lib/dualToneAudioController.js?v=1"></script>
<script src="lib/harmonicRendererSettings.js?v=1"></script>

<!-- Your exercise -->
<script src="feelTheRootExercise.js"></script>
```

---

## Benefits of This Architecture

1. **Code Reuse**: Write once, use in multiple exercises
2. **Consistency**: All exercises use the same color system and audio management
3. **Maintainability**: Bug fixes in modules benefit all exercises
4. **Modularity**: Each module can be used independently or together
5. **Testability**: Modules can be tested in isolation
6. **Flexibility**: Easy to customize via settings without modifying core code

---

## Existing Exercises That Could Benefit

### 1. Feel the Root Exercise (`feelTheRootExercise.js`)
- **Use:** All 4 modules
- **Benefit:** Add visual harmonic interference patterns showing root vs interval
- **Implementation:** Integrate WebGL renderer with gravity wells showing consonance/dissonance

### 2. Scale Darts Exercise (`scaleDartsExercise.js`)
- **Use:** ConsonanceColorSystem, DualToneAudioController
- **Benefit:** Color-code dart targets by interval quality
- **Implementation:** Dart board colors based on consonance, audio plays interval on hit

### 3. Interval Darts Exercise (`intervalDartsExercise.js`)
- **Use:** ConsonanceColorSystem, DualToneAudioController
- **Benefit:** Same as Scale Darts
- **Implementation:** Visual feedback showing interval quality with colors

### 4. Interval Slide Exercise (`intervalSlideExercise.js`)
- **Use:** All 4 modules
- **Benefit:** Add real-time visual feedback as interval slides
- **Implementation:** Show interference patterns changing as interval size changes

### 5. Glissando Exercise (`glissandoExercise.js`)
- **Use:** ConsonanceColorSystem, SpeakerOverlayRenderer
- **Benefit:** Visual color feedback during pitch slides
- **Implementation:** Color changes as pitch moves through consonant/dissonant regions

---

## Tips and Best Practices

### 1. Canvas Sizing
- Set canvas size before creating overlay renderer
- Call `overlayRenderer.resize()` when canvas dimensions change
- Use `setTimeout(() => { ... }, 100)` to ensure canvas is fully initialized

### 2. Animation Timing
- Get state from `audioController.getState()` once per frame
- Don't call `getBeatAmplitude()` multiple times per frame (caches internally)
- Use `resetTiming` parameter to control expand animations:
  - `playTone1(true)` - Reset timing (expand animation)
  - `playTone1(false)` - Keep timing (smooth frequency change)

### 3. Color Updates
- Update colors when frequencies change
- Use the root frequency as reference for all color calculations
- Cache colors if frequencies don't change often

### 4. Settings Management
- Load settings once during initialization
- Merge custom settings with defaults rather than replacing
- Validate settings if loading from external source

### 5. Cleanup
- Always call `destroy()` when exercise ends
- Remove event listeners in destroy method
- Stop audio before cleaning up controllers

---

## Performance Considerations

### WebGL Rendering
- The full interval visualization shader is complex (~1400 lines)
- Consider using simpler effects for some exercises
- Use `HarmonicRendererSettings.getMinimal()` for performance-critical exercises

### Audio Management
- `DualToneAudioController` is lightweight (two ToneGenerator instances)
- Beat amplitude calculation is cheap (just a sine wave)
- No performance concerns for audio module

### Overlay Rendering
- 2D canvas overlay is very efficient
- Speaker icons are cached images
- No performance concerns for typical usage

---

## Future Enhancements

Potential improvements to the modules:

1. **ConsonanceColorSystem**
   - Add more color modes (spectral, warm/cool, custom palettes)
   - Support for microtonal intervals
   - Configurable consonance/dissonance curves

2. **SpeakerOverlayRenderer**
   - Optional labels/text rendering
   - More icon styles (headphones, tuning fork, etc.)
   - Animated connection lines between speakers

3. **DualToneAudioController**
   - Support for more than 2 tones
   - Volume control per tone
   - Fade in/out support
   - Envelope control (ADSR)

4. **HarmonicRendererSettings**
   - More exercise-specific presets
   - Settings export/import
   - Real-time settings updates
   - Settings presets UI

---

## Questions or Issues?

For questions about integration or bug reports:
1. Check module JSDoc comments in the source files
2. Review `intervalVisualization.js` for usage examples
3. Test with minimal settings first before adding complexity

---

## Version History

- **v1.0** (2025-10-15) - Initial refactor and module extraction
  - Extracted 4 reusable modules from intervalVisualization.js
  - Reduced main file from 2423 to 2013 lines (16.9% reduction)
  - Created ~860 lines of reusable, documented code
