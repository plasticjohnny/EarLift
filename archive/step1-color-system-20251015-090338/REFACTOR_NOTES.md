# Audio System Refactor - Implementation Notes

## New Architecture

### 1. AudioManager (audioManager.js)
- **Singleton** - One instance for entire app (`window.audioManager`)
- Manages ALL audio input/output
- Handles device selection and routing
- Auto-selects Bluetooth/AirPods when available
- Persists device selection
- Shares AudioContext across all components

### 2. PitchDetector (pitchDetector.v2.js)
- Simplified - no longer manages audio streams
- Uses AudioManager's analyser
- Just handles pitch detection algorithm
- `initialize()` now just calls AudioManager

### 3. ToneGenerator (toneGenerator.v2.js)
- Simplified - no longer creates its own AudioContext
- Uses AudioManager's AudioContext
- Just handles oscillator/tone generation

## Key Benefits

1. **Single audio stream** - iOS doesn't get confused about routing
2. **Automatic Bluetooth prioritization** - Finds and uses AirPods/headsets automatically
3. **Shared AudioContext** - More efficient, no conflicts
4. **Simpler code** - Each class does one thing
5. **Default gain 4.0** - Better for quiet microphones like AirPods

## Migration for Exercises

All exercises need to be simplified:

### OLD WAY (Pitch Hold example):
```javascript
async startPitchDetection() {
    const deviceId = window.audioSettings ? window.audioSettings.getSelectedMicId() : null;
    await this.pitchDetector.initialize(deviceId);
    // ... more code
}
```

### NEW WAY:
```javascript
async startPitchDetection() {
    await this.pitchDetector.initialize(); // AudioManager handles everything
    this.isDetecting = true;
    // ... detection loop
}
```

### For exercises that just play audio (Pitch Match):
```javascript
// Remove all microphone handling code
// ToneGenerator.playTone() now handles everything through AudioManager
```

## Files Changed

1. **NEW**: audioManager.js - Central audio system
2. **NEW**: pitchDetector.v2.js - Simplified detector
3. **NEW**: toneGenerator.v2.js - Simplified generator
4. **UPDATED**: settings.js - Default gain 4.0
5. **UPDATED**: audioSettings.js - Uses AudioManager
6. **UPDATED**: index.html - Loads new files
7. **TODO**: Update all exercises to remove device handling

## Testing Checklist

- [ ] Setup - vocal range detection
- [ ] Glissando - pitch tracking
- [ ] Pitch Match - audio playback (no mic needed)
- [ ] Pitch Hold - detection + playback
- [ ] Octave Match - audio playback
- [ ] Scale Exercise - detection
- [ ] Device switching in settings
- [ ] Gain control
- [ ] Debug panel shows correct device
- [ ] iOS/Safari with AirPods
