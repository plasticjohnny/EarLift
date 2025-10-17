# EarTrainer Architecture

## Overview
This app uses a layered architecture to separate platform-specific code from business logic, making it easy to port to iOS, Android, or other platforms.

## Layer Structure

```
┌─────────────────────────────────────────┐
│         UI Layer (Platform-specific)    │
│    - DOM manipulation                   │
│    - User input handling                │
│    - Visual rendering                   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Platform Adapters (Interfaces)     │
│    - IAudioService                      │
│    - IStorageService                    │
│    - IUIService                         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│    Core Business Logic (Pure JS)        │
│    - PitchDetectionEngine               │
│    - ExerciseController                 │
│    - SettingsManager                    │
│    - ToneGenerator (core)               │
└─────────────────────────────────────────┘
```

## Directory Structure

```
/core/                      # Platform-agnostic business logic
  /audio/
    - PitchDetectionEngine.js
    - ToneGenerationEngine.js
    - AudioAnalyzer.js
  /exercises/
    - ExerciseBase.js
    - GlissandoExercise.js
    - PitchMatchExercise.js
    - etc.
  /models/
    - Settings.js
    - VocalRange.js
    - Note.js
  /utils/
    - FrequencyUtils.js
    - NoteUtils.js

/adapters/                  # Platform-specific implementations
  /web/
    - WebAudioService.js    # Implements IAudioService
    - WebStorageService.js  # Implements IStorageService
    - WebUIService.js       # Implements IUIService
  /ios/                     # Future: iOS implementations
  /android/                 # Future: Android implementations

/ui/                        # UI layer (can be replaced per platform)
  /web/
    - index.html
    - components/
    - styles.css
```

## Key Principles

1. **Core logic never imports DOM or Web APIs directly**
2. **All platform features go through adapter interfaces**
3. **Dependency injection for all services**
4. **Pure functions where possible**
5. **No global state in core logic**

## Interface Definitions

### IAudioService
```javascript
interface IAudioService {
  initialize(): Promise<void>
  getAudioContext(): AudioContext
  getAnalyser(): AnalyserNode
  createToneOscillator(frequency: number): Oscillator
  setMicrophoneGain(gain: number): void
  getMicrophoneGain(): number
  stop(): void
}
```

### IStorageService
```javascript
interface IStorageService {
  get(key: string): any
  set(key: string, value: any): void
  remove(key: string): void
  clear(): void
}
```

### IUIService
```javascript
interface IUIService {
  showScreen(screenId: string): void
  updateElement(elementId: string, value: any): void
  showMessage(message: string, type: string): void
  showDialog(title: string, message: string): Promise<boolean>
}
```

## Migration Path

1. Create core/ directory with business logic
2. Create adapters/web/ with current Web API implementations
3. Update existing code to use adapters
4. For iOS: Create adapters/ios/ implementing same interfaces
5. Reuse 100% of core/ logic

## Benefits

- ✅ Easy to unit test (mock adapters)
- ✅ Port to native platforms by implementing new adapters
- ✅ Swap implementations (e.g., different audio engines)
- ✅ Clear separation of concerns
- ✅ Reusable business logic
