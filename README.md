# ToneDeath 🎵

**Conquer tone deafness with effective ear training.**

An ear training app that provides teaching and tools to effectively train your ear.

🌐 **Visit:** [ToneDeath.app](https://tonedeath.app)

## Features

- 🎯 **Interference Visualization** - See harmonic patterns and interval color dynamics
- 🎵 **Intonation Practice** - Match pitches accurately with real-time feedback
- 📱 **Installable PWA** - Works on mobile and desktop
- 🔌 **Offline Support** - Practice anywhere, anytime
- **Car Mode** - Hands free ear training practice

## Tech Stack

- **Pitch Detection** - Web Audio API with autocorrelation algorithm
- **Offline Storage** - localStorage for user settings
- **PWA Features** - Service Workers, Web App Manifest
- **Styling** - Pure CSS with a retro 80s neon theme
- **No Dependencies** - Vanilla JavaScript, no frameworks
- **Web GL** - Web GL integration for note visualization

## Architecture

- `index.html` - Main app with setup and exercise screens
- `pitchDetector.js` - Real-time pitch detection using Web Audio API
- `settings.js` - localStorage manager for vocal range persistence
- `setup.js` - First-time user onboarding flow
- `app.js` - Main application logic and PWA features
- `styles.css` - Irish-themed Celtic design system
- `manifest.json` - PWA configuration
- `service-worker.js` - Offline caching strategy

## Getting Started

### 1. Generate Icons

Open `create-icons.html` in a browser to generate the required PWA icons:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

The icons will be automatically downloaded to your downloads folder. Move them to the project root.

### 2. Serve the App

You need to serve the PWA over HTTPS (or localhost) for Service Workers to work.

**Using Python:**
```bash
python -m http.server 8000
```

**Using Node.js (http-server):**
```bash
npx http-server -p 8000
```

**Using PHP:**
```bash
php -S localhost:8000
```

### 3. Access the App

Open your browser and navigate to `http://localhost:8000`

## Testing PWA Features

### Install Prompt
- On Chrome/Edge: Look for the install icon in the address bar
- Click the "Install App" button when it appears

### Offline Support
1. Open the app in your browser
2. Open DevTools → Application → Service Workers
3. Check "Offline" mode
4. Refresh the page - it should still work!

### Testing on Mobile
1. Serve over HTTPS (required for PWA on mobile)
2. Visit the site on your mobile device
3. Look for "Add to Home Screen" prompt
4. Install and launch from your home screen

## Browser Support

- Chrome/Edge: Full support
- Firefox: Partial support (no install prompt)
- Safari: Partial support (iOS 11.3+)

## Deployment

For production deployment:

1. Use a web server with HTTPS
2. Update `start_url` in `manifest.json` if needed
3. Customize icons, colors, and content
4. Test with Lighthouse for PWA compliance

## How It Works

### 1. First-Time Setup
- User sings their lowest comfortable note
- App detects pitch using autocorrelation (10 stable readings required)
- User confirms low note, then repeats for high note
- Vocal range saved to localStorage

### 2. Pitch Detection
- Microphone input → Web Audio API
- FFT analysis → Time-domain data
- Autocorrelation algorithm → Frequency detection
- Frequency → Note name conversion (A4 = 440Hz standard)

### 3. Exercise Types (Coming Soon)
- **Intervals**: Play two notes, identify the interval
- **Intonation**: Match a target pitch precisely
- **Chords**: Hear a chord, identify its quality

## Design Philosophy

**ToneDeath** combines humor with serious functionality. The name playfully subverts "tone deaf" - you're conquering it, not embodying it. 

## Browser Support

- ✅ Chrome/Edge - Full support
- ⚠️ Firefox - Partial (no install prompt)
- ⚠️ Safari - Partial (iOS 11.3+)

## Contributing

This is an open-source project. Contributions welcome!

## License

MIT

---

**Made with ☘ for musicians who want to train their ears without taking themselves too seriously.**
