# EarTrainer Native iOS App

This is a native iOS wrapper for the ToneDeath/EarTrainer web app.

## Quick Start (5 minutes)

### Step 1: Open in Xcode

```bash
cd /home/john/Projects/EarTrainer/EarTrainerNative
open EarTrainerNative.xcodeproj
```

Or double-click `EarTrainerNative.xcodeproj` in Finder.

### Step 2: Configure Your Team

1. In Xcode, click on the project name (EarTrainerNative) in the left sidebar
2. Select the "EarTrainerNative" target
3. Go to "Signing & Capabilities" tab
4. Under "Team", select your Apple Developer account
5. Xcode will automatically configure the bundle identifier and provisioning

### Step 3: Connect Your iPhone

1. Connect your iPhone to your Mac via USB cable
2. Unlock your iPhone
3. If prompted "Trust This Computer?", tap "Trust"
4. In Xcode's top toolbar, click the device menu and select your iPhone

### Step 4: Build & Run

1. Click the ▶ Play button (or press ⌘R)
2. Xcode will build and install the app on your iPhone
3. **First time only**: On your iPhone, go to:
   - Settings → General → VPN & Device Management
   - Tap your developer certificate
   - Tap "Trust [Your Name]"
4. Return to home screen and open the ToneDeath app

### Step 5: Grant Microphone Permission

When the app first launches, it will ask for microphone permission. Tap "Allow".

## What This App Does

- Loads your ToneDeath web app (https://tonedeath.app) in a native WebView
- Configures iOS audio session with `.measurement` mode (less aggressive AGC)
- Allows microphone access for pitch detection
- Works exactly like Safari, but with better audio configuration

## Features

✅ **Native iOS app** - Installs like any other app
✅ **Microphone access** - Properly configured for recording
✅ **Audio session optimization** - Uses measurement mode for better pitch detection
✅ **Background audio** - Continues working when app is in background
✅ **Web inspector** - Debug mode enabled for Safari Web Inspector

## Testing AGC Issues

This app uses iOS native audio configuration:
- Category: `.playAndRecord` (allows both input and output)
- Mode: `.measurement` (minimizes OS-level processing)
- Options: `.defaultToSpeaker`, `.allowBluetooth`

This *should* reduce OS-level AGC, but AirPods still have hardware AGC that can't be disabled.

To test:
1. Use AirPods and sing sustained "OOOO" sound
2. Check if pitch detection lasts longer than in Safari
3. Try with built-in iPhone mic to compare

## Debugging

### Enable Safari Web Inspector

1. On your iPhone: Settings → Safari → Advanced → Web Inspector (ON)
2. On your Mac: Safari → Develop → [Your iPhone] → ToneDeath
3. You can now inspect console logs, network requests, etc.

### Check Console Logs in Xcode

1. With app running, open Xcode's debug console (⌘⇧Y)
2. Look for messages like:
   - "Audio session configured successfully"
   - "Microphone permission: true"

## Customization

### Change URL

Edit `ContentView.swift`, line 16:
```swift
WebView(url: URL(string: "https://tonedeath.app")!)
```

Change to:
```swift
WebView(url: URL(string: "http://localhost:8000")!) // For local testing
```

### Change App Name

Edit `Info.plist`:
```xml
<key>CFBundleDisplayName</key>
<string>ToneDeath</string>  <!-- Change this -->
```

### Change Bundle Identifier

In Xcode:
1. Select project → Target
2. General tab
3. Change "Bundle Identifier" (e.g., `com.yourname.eartrainer`)

## File Structure

```
EarTrainerNative/
├── EarTrainerNative.xcodeproj/     # Xcode project
│   └── project.pbxproj
├── EarTrainerNative/
│   ├── EarTrainerNativeApp.swift   # App entry point + audio config
│   ├── ContentView.swift           # Main WebView
│   ├── Info.plist                  # App permissions & config
│   └── Assets.xcassets/            # App icon (placeholder)
└── README.md                       # This file
```

## Troubleshooting

### "Failed to register bundle identifier"
- Someone else is using this bundle ID
- Change it in Xcode: Project → General → Bundle Identifier

### "No account for team..."
- Click "Add Account" in Xcode preferences
- Sign in with your Apple ID

### "Untrusted Developer"
- Go to Settings → General → VPN & Device Management
- Tap your certificate → Trust

### App crashes on launch
- Check Xcode console for errors
- Ensure https://tonedeath.app is accessible
- Try changing URL to a test page first

### Microphone not working
- Check Settings → ToneDeath → Microphone (should be ON)
- Check app requested permission (popup on first launch)
- Look for "Microphone permission: true" in Xcode console

## Next Steps

### If AGC is still an issue:
I can help you implement a native `AVAudioEngine` plugin that:
- Directly captures audio from microphone
- Sends data to JavaScript via bridge
- Bypasses WebAudio API entirely
- Maximum control over audio processing

### If this works well:
- Add app icon (replace Assets.xcassets/AppIcon)
- Submit to App Store ($99/year for distribution)
- Add TestFlight for beta testing

## Support

Questions? Check:
- Xcode console for error messages
- Safari Web Inspector for JavaScript errors
- iPhone Settings → ToneDeath for permissions

The app should work exactly like your web app, but with better native audio integration!
