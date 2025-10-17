# iOS Porting Guide

## Quick Start: Three Approaches

### Option 1: Capacitor (Easiest - Recommended)
**Reuses 100% of existing JavaScript code**

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios

# Initialize
npx cap init "EarTrainer" "com.yourname.eartrainer" --web-dir="."

# Add iOS platform
npx cap add ios

# Open in Xcode
npx cap open ios
```

**Pros:**
- ✅ Reuse ALL existing code
- ✅ Fast development
- ✅ Easy updates (just copy web assets)

**Cons:**
- ❌ Slight performance overhead (JavaScript bridge)
- ❌ Limited access to some native features

### Option 2: React Native (Medium Difficulty)
**Reuses core logic, rewrites UI**

1. Create React Native app
2. Copy `/core/` folder (business logic)
3. Implement native audio service using `react-native-audio`
4. Build React Native UI

**Pros:**
- ✅ Better performance than Capacitor
- ✅ Native look and feel
- ✅ Reuse core business logic

**Cons:**
- ❌ Need to learn React Native
- ❌ UI must be rewritten

### Option 3: Native Swift (Most Work, Best Performance)
**Port everything to Swift**

1. Create Xcode project
2. Implement Swift versions of adapters
3. Port core logic to Swift
4. Build native SwiftUI interface

**Pros:**
- ✅ Best performance
- ✅ Full access to iOS features
- ✅ Apple platform optimization

**Cons:**
- ❌ Most work
- ❌ Maintain two codebases

---

## Recommended Approach: Capacitor

### Step 1: Install and Configure

```bash
cd /home/john/Projects/EarTrainer

# Install Capacitor
npm init -y  # If no package.json
npm install @capacitor/core @capacitor/cli @capacitor/ios

# Initialize Capacitor
npx cap init
# App name: EarTrainer
# App ID: com.yourname.eartrainer
# Web dir: . (root directory)
```

### Step 2: Configure iOS Permissions

Edit `ios/App/App/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>EarTrainer needs microphone access to detect your pitch for vocal training exercises</string>

<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

### Step 3: Build and Deploy

```bash
# Copy web files to iOS app
npx cap copy ios

# Open in Xcode
npx cap open ios
```

In Xcode:
1. Connect your iPhone
2. Select your device as target
3. Click Run (⌘R)

### Step 4: Test on Device

The app will:
- ✅ Use existing WebAudioService
- ✅ Use existing PitchDetectionEngine
- ✅ Work exactly like web version
- ⚠️ Still subject to iOS Safari limitations (AGC, etc.)

---

## Advanced: Native iOS Audio Service

If you want to bypass WebAudio limitations and use native iOS audio:

### Create Native Plugin

Create `ios/App/App/AudioServicePlugin.swift`:

```swift
import Capacitor
import AVFoundation

@objc(AudioServicePlugin)
public class AudioServicePlugin: CAPPlugin {
    private var audioEngine: AVAudioEngine!
    private var inputNode: AVAudioInputNode!
    private var fftSize: Int = 4096
    private var sampleRate: Double = 48000

    @objc func initialize(_ call: CAPPluginCall) {
        do {
            // Configure audio session
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: [])
            try audioSession.setActive(true)

            // Create audio engine
            audioEngine = AVAudioEngine()
            inputNode = audioEngine.inputNode

            // Get format
            let format = inputNode.inputFormat(forBus: 0)
            sampleRate = format.sampleRate

            // Install tap for audio data
            inputNode.installTap(onBus: 0, bufferSize: AVAudioFrameCount(fftSize), format: format) { buffer, time in
                // Audio data available in buffer
            }

            // Start engine
            try audioEngine.start()

            call.resolve([
                "sampleRate": sampleRate,
                "fftSize": fftSize
            ])
        } catch {
            call.reject("Failed to initialize audio: \\(error.localizedDescription)")
        }
    }

    @objc func getTimeDomainData(_ call: CAPPluginCall) {
        // Return audio buffer data
        // This would be called from JavaScript
    }

    @objc func setMicrophoneGain(_ call: CAPPluginCall) {
        guard let gain = call.getFloat("gain") else {
            call.reject("Missing gain parameter")
            return
        }

        // iOS doesn't allow direct mic gain control
        // But we can apply gain in software
        call.resolve()
    }
}
```

Register in `ios/App/App/Podfile`:

```ruby
target 'App' do
  capacitor_pods
  # Add other pods here
end
```

### Create JavaScript Wrapper

Create `adapters/ios/CapacitorAudioService.js`:

```javascript
import { Plugins } from '@capacitor/core';
const { AudioServicePlugin } = Plugins;

class CapacitorAudioService {
    async initialize() {
        const result = await AudioServicePlugin.initialize();
        this.sampleRate = result.sampleRate;
        this.fftSize = result.fftSize;
        this.initialized = true;
    }

    async getTimeDomainData(buffer) {
        const result = await AudioServicePlugin.getTimeDomainData();
        buffer.set(result.data);
    }

    getSampleRate() {
        return this.sampleRate;
    }

    getFFTSize() {
        return this.fftSize;
    }

    // ... implement all IAudioService methods
}
```

### Use Native Service

Update `index.html` or main app:

```javascript
// Detect platform
const isIOS = Capacitor.getPlatform() === 'ios';

// Use appropriate service
const audioService = isIOS
    ? new CapacitorAudioService()
    : new WebAudioService(storage);

// Rest of code unchanged!
const pitchEngine = new PitchDetectionEngine(audioService);
```

---

## Benefits of This Approach

### ✅ Gradual Migration
- Start with Capacitor (easy)
- Add native plugins as needed
- Optimize performance incrementally

### ✅ Code Reuse
- 100% of core logic reused
- Most UI code reused
- Only platform-specific code changes

### ✅ Best of Both Worlds
- Web: Fast iteration, easy deployment
- iOS: Better performance, native features
- Shared business logic

---

## Handling iOS-Specific Challenges

### Challenge 1: AGC in AirPods
**Solution**: Use native AVAudioSession with `.measurement` mode

```swift
let audioSession = AVAudioSession.sharedInstance()
try audioSession.setCategory(.record, mode: .measurement, options: [])
```

Measurement mode disables OS-level AGC (but NOT hardware AGC in AirPods).

### Challenge 2: Background Audio
**Solution**: Enable background audio mode in Info.plist

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
</array>
```

### Challenge 3: Microphone Permission
**Solution**: Request permission before initializing audio

```swift
AVAudioSession.sharedInstance().requestRecordPermission { granted in
    if granted {
        // Initialize audio
    } else {
        // Show error
    }
}
```

---

## Deployment Checklist

### Development (FREE)
- [x] Mac with Xcode installed
- [x] iPhone connected via USB
- [x] Apple ID (free tier)
- [x] Sign app with your Apple ID in Xcode

### Production ($99/year)
- [ ] Apple Developer Program membership
- [ ] App Store Connect account
- [ ] Provisioning profiles
- [ ] App Store submission

---

## Next Steps

1. **Try Capacitor approach first** (easiest, fastest)
2. **Test on real iPhone** to see if AGC is still an issue
3. **If needed**, implement native audio plugin for better control
4. **Optimize** performance based on real-world testing
5. **Submit to App Store** when ready

---

## Questions?

- See `ARCHITECTURE.md` for architecture overview
- See `REFACTORING_GUIDE.md` for refactoring details
- See Capacitor docs: https://capacitorjs.com/docs
