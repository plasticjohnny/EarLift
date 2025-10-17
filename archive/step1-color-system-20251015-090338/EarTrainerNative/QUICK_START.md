# Quick Start - 5 Minutes to Native iOS App

## Step-by-Step Instructions

### 1. Open Xcode Project (30 seconds)

```bash
cd ~/Projects/EarTrainer/EarTrainerNative
open EarTrainerNative.xcodeproj
```

### 2. Select Your Team (1 minute)

In Xcode:
1. Click **"EarTrainerNative"** in left sidebar (project name)
2. Click **"EarTrainerNative"** under TARGETS
3. Go to **"Signing & Capabilities"** tab
4. Under **"Team"**, select your Apple Developer account from dropdown
5. ✅ You should see "Automatically manage signing" checked

### 3. Connect iPhone (30 seconds)

1. Plug iPhone into Mac via USB
2. Unlock iPhone
3. If asked **"Trust This Computer?"** → Tap **"Trust"**
4. In Xcode toolbar (top), click device dropdown → Select your iPhone

### 4. Run! (2 minutes)

1. Click the **▶ Play** button (or press **⌘R**)
2. Wait for "Build Succeeded"
3. App installs on your iPhone

### 5. Trust Developer Certificate (1 minute - first time only)

On your iPhone:
1. Go to **Settings**
2. **General** → **VPN & Device Management**
3. Under "Developer App", tap your certificate
4. Tap **"Trust [Your Name]"**
5. Confirm **"Trust"**

### 6. Launch App! (30 seconds)

1. Go to iPhone home screen
2. Find **"ToneDeath"** app icon
3. Tap to open
4. When asked for microphone permission → Tap **"Allow"**

**Done!** 🎉 The app should load https://tonedeath.app in a native WebView.

---

## Troubleshooting

**"No account for team"**
→ Xcode → Preferences → Accounts → Add your Apple ID

**"Untrusted Developer" error on iPhone**
→ Settings → General → VPN & Device Management → Trust certificate

**Can't find device in Xcode**
→ Unlock iPhone, tap "Trust This Computer"

**Build fails**
→ Check Xcode console (bottom area) for error message

---

## What You Get

✅ Native iOS app on your iPhone
✅ Loads your live web app (https://tonedeath.app)
✅ Microphone access for pitch detection
✅ Better audio configuration than Safari
✅ No App Store needed (direct install)

## Test AGC Issue

1. Connect AirPods
2. Open app → Mic Diagnostics
3. Sing sustained "OOOO" sound
4. Check if detection lasts longer than in Safari

If it's better → Native audio helps!
If it's the same → AirPods hardware AGC (can implement native audio engine to test further)

---

**That's it!** You now have a native iOS app running your web code.
