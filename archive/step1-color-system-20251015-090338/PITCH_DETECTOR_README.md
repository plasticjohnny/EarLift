# Pitch Detector Configuration

This project has two pitch detection implementations that can be easily switched.

## Available Detectors

### 1. Custom Detector (pitchDetector.v2.js)
- Our custom FFT + autocorrelation hybrid implementation
- Extensive harmonic analysis and scoring
- More complex but fully customizable

### 2. Pitchy Detector (pitchDetector.pitchy.js)
- Uses the Pitchy library (https://github.com/ianprime0509/pitchy)
- Implements YIN algorithm for pitch detection
- Known to be better at avoiding octave errors
- Simpler and battle-tested

## How to Switch Detectors

Open `pitchDetectorConfig.js` and change the `activeDetector` setting:

```javascript
const PITCH_DETECTOR_CONFIG = {
    activeDetector: 'pitchy',  // Change to 'custom' to use our implementation
    debugMode: true
};
```

### To use Pitchy (recommended to try first):
```javascript
activeDetector: 'pitchy'
```

### To use Custom detector (if you want to go back):
```javascript
activeDetector: 'custom'
```

## What Gets Logged

When `debugMode: true`, you'll see a green message in the console when the page loads:
- **"Using pitch detector: pitchy"** - Pitchy library is active
- **"Using pitch detector: custom"** - Custom implementation is active

## Troubleshooting

If Pitchy doesn't load:
1. Check browser console for errors
2. Verify that `pitchy.bundle.js` exists in your project directory
3. The system will automatically fall back to custom detector if Pitchy isn't available

## Testing

After switching detectors:
1. Hard refresh the page (Ctrl+Shift+R)
2. Start Pitch Hold or Pitch Match exercise
3. Open Mic Debug Mode (Ctrl+Shift+D) to see detection results
4. Compare detected frequency with a tuner app

## Performance Notes

- **Pitchy**: Generally faster, uses YIN algorithm which is proven for avoiding octave errors
- **Custom**: More detailed diagnostic info, fully customizable scoring

Both use the same AudioManager and smoothing filters, so switching should be seamless.
