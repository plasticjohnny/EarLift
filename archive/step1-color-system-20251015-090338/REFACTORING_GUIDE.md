# Refactoring Guide: Platform-Agnostic Architecture

## Overview

The codebase has been refactored to separate platform-specific code from business logic. This makes it easy to port the app to iOS, Android, or any other platform.

## Current Status

### ✅ Completed
- Core business logic layer (platform-agnostic)
- Interface definitions (IAudioService, IStorageService, IUIService)
- Web implementations (WebAudioService, WebStorageService)
- PitchDetectionEngine (pure business logic)

### 📝 Next Steps
1. Gradually migrate existing code to use new architecture
2. Create wrapper for backward compatibility during migration
3. Eventually remove old code once migration is complete

## Architecture Layers

### Layer 1: Core Business Logic (Platform-Agnostic)
**Location**: `/core/`

**Contents**:
- `core/audio/PitchDetectionEngine.js` - Pure pitch detection logic
- `core/audio/ToneGenerationEngine.js` - (TODO) Pure tone generation logic
- `core/exercises/` - Exercise controllers
- `core/models/` - Data models

**Rules**:
- ✅ NO imports of DOM, Web API, or any platform-specific code
- ✅ All external I/O through injected service interfaces
- ✅ Pure JavaScript/TypeScript only
- ✅ Easy to unit test with mocks

### Layer 2: Platform Adapters
**Location**: `/adapters/`

**Contents**:
- `adapters/interfaces/` - Interface definitions
- `adapters/web/` - Web/Browser implementations
- `adapters/ios/` - (Future) iOS implementations
- `adapters/android/` - (Future) Android implementations

**Rules**:
- ✅ Implement interface contracts
- ✅ Handle all platform-specific details
- ✅ Can use platform APIs freely

### Layer 3: UI Layer
**Location**: `/ui/` (or root for now)

**Contents**:
- HTML/CSS/DOM manipulation
- Platform-specific UI code
- Event handlers

## Using the New Architecture

### Example: Pitch Detection

**Old way (platform-specific)**:
```javascript
// pitchDetector.v2.js
class PitchDetector {
    constructor() {
        // Directly uses Web Audio API
        this.analyser = window.audioManager.getAnalyser();
        this.buffer = new Float32Array(analyser.fftSize);
    }

    detectPitch() {
        // Tightly coupled to Web Audio API
        this.analyser.getFloatTimeDomainData(this.buffer);
        // ... detection logic ...
    }
}
```

**New way (platform-agnostic)**:
```javascript
// core/audio/PitchDetectionEngine.js
class PitchDetectionEngine {
    constructor(audioService) {
        // Depends on interface, not implementation
        this.audioService = audioService;
    }

    detectPitch() {
        // Uses interface methods
        this.audioService.getTimeDomainData(this.timeBuffer);
        // ... detection logic ...
    }
}

// Usage (web platform):
const audioService = new WebAudioService(storageService);
await audioService.initialize();

const pitchEngine = new PitchDetectionEngine(audioService);
pitchEngine.start();

const result = pitchEngine.detectPitch();
console.log(result.frequency, result.note);
```

### Example: Settings Storage

**Old way**:
```javascript
// settings.js
class Settings {
    save() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    load() {
        const data = localStorage.getItem('settings');
        this.settings = JSON.parse(data);
    }
}
```

**New way**:
```javascript
// core/models/Settings.js
class SettingsManager {
    constructor(storageService) {
        this.storage = storageService;
    }

    save() {
        this.storage.set('settings', this.settings);
    }

    load() {
        this.settings = this.storage.get('settings', {});
    }
}

// Usage (web platform):
const storage = new WebStorageService('eartrainer_');
const settings = new SettingsManager(storage);

// Usage (iOS platform):
const storage = new IOSStorageService(); // Uses UserDefaults
const settings = new SettingsManager(storage); // Same code!
```

## Migration Strategy

### Phase 1: Parallel Systems (Current)
- New architecture exists alongside old code
- No breaking changes to existing functionality
- Gradual migration of components

### Phase 2: Create Compatibility Wrappers
- Make old code use new services under the hood
- Example:
```javascript
// audioManager.js (updated)
class AudioManager {
    constructor() {
        // Use new service internally
        this.service = new WebAudioService(new WebStorageService());
    }

    async initialize() {
        return this.service.initialize();
    }

    getAnalyser() {
        return this.service.getAnalyser();
    }
    // ... etc
}
```

### Phase 3: Full Migration
- Remove old code once all components use new architecture
- Clean up compatibility wrappers

## Porting to iOS (Future)

### Step 1: Implement iOS Adapters

Create `/adapters/ios/IOSAudioService.swift`:
```swift
class IOSAudioService: IAudioService {
    private var audioEngine: AVAudioEngine
    private var inputNode: AVAudioInputNode

    func initialize() async throws {
        audioEngine = AVAudioEngine()
        inputNode = audioEngine.inputNode

        let format = inputNode.inputFormat(forBus: 0)
        // Setup audio session, microphone, etc.
    }

    func getTimeDomainData(buffer: inout [Float]) {
        // Read from AVAudioPCMBuffer
    }

    func getFrequencyData(buffer: inout [Float]) {
        // Perform FFT on audio data
    }

    // ... implement all interface methods
}
```

### Step 2: Bridge to JavaScript (if using Capacitor/Cordova)

If using Capacitor:
```swift
@objc(AudioServicePlugin)
public class AudioServicePlugin: CAPPlugin {
    let audioService = IOSAudioService()

    @objc func initialize(_ call: CAPPluginCall) {
        Task {
            try await audioService.initialize()
            call.resolve()
        }
    }

    @objc func getTimeDomainData(_ call: CAPPluginCall) {
        var buffer = [Float](repeating: 0, count: 4096)
        audioService.getTimeDomainData(buffer: &buffer)
        call.resolve(["data": buffer])
    }
}
```

### Step 3: Reuse 100% of Core Logic

```javascript
// iOS app (using Capacitor bridge)
import { Plugins } from '@capacitor/core';
const { AudioServicePlugin } = Plugins;

class CapacitorAudioService {
    async initialize() {
        await AudioServicePlugin.initialize();
    }

    getTimeDomainData(buffer) {
        const result = await AudioServicePlugin.getTimeDomainData();
        buffer.set(result.data);
    }
    // ... etc
}

// Use existing PitchDetectionEngine!
const audioService = new CapacitorAudioService();
const pitchEngine = new PitchDetectionEngine(audioService);
```

## Porting to Native iOS (Without JavaScript)

If going fully native, port the core logic to Swift:

```swift
// core/audio/PitchDetectionEngine.swift
class PitchDetectionEngine {
    let audioService: IAudioService

    init(audioService: IAudioService) {
        self.audioService = audioService
    }

    func detectPitch() -> PitchResult? {
        audioService.getTimeDomainData(buffer: &timeBuffer)
        // Port detection algorithm from JS to Swift
        // Same logic, different language
    }
}
```

## Benefits of This Architecture

### ✅ Portability
- 90% of code is platform-agnostic
- Only adapters need to be rewritten per platform
- Core algorithms work everywhere

### ✅ Testability
- Easy to mock services for unit tests
- No need for browser/DOM in tests
- Fast test execution

### ✅ Maintainability
- Clear separation of concerns
- Changes to Web Audio API only affect WebAudioService
- Business logic changes don't touch platform code

### ✅ Flexibility
- Swap implementations (e.g., different audio engines)
- A/B test different pitch detection algorithms
- Support multiple platforms from one codebase

## File Organization Summary

```
EarTrainer/
├── core/                          # Platform-agnostic (port everywhere)
│   ├── audio/
│   │   └── PitchDetectionEngine.js
│   ├── exercises/
│   ├── models/
│   └── utils/
│
├── adapters/                      # Platform-specific implementations
│   ├── interfaces/                # Contracts
│   │   ├── IAudioService.js
│   │   ├── IStorageService.js
│   │   └── IUIService.js
│   └── web/                       # Web implementations
│       ├── WebAudioService.js
│       ├── WebStorageService.js
│       └── WebUIService.js (TODO)
│
├── ui/                            # UI layer (platform-specific)
│   └── web/
│       ├── index.html
│       └── components/
│
├── [legacy files]                 # Old code (will be migrated)
│   ├── audioManager.js
│   ├── pitchDetector.v2.js
│   ├── settings.js
│   └── ...
│
└── ARCHITECTURE.md                # Architecture overview
└── REFACTORING_GUIDE.md          # This file
```

## Next Steps for Full Migration

1. **Create WebUIService** implementation
2. **Migrate exercises** to use core controllers
3. **Create compatibility wrappers** for old code
4. **Update index.html** to use new services
5. **Remove old code** once migration complete
6. **Add unit tests** for core logic
7. **Document iOS porting process** with real example

## Questions?

See `ARCHITECTURE.md` for high-level overview of the design principles.
