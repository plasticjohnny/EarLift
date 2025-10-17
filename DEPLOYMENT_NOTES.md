# Deployment Notes - Refactored Architecture

## What Changed in deploy.sh

The deployment script has been updated to properly handle the new refactored architecture with subdirectories.

### New Files Deployed

**Core Business Logic** (platform-agnostic):
- `core/audio/PitchDetectionEngine.js`
- Future: `core/exercises/*.js`, `core/models/*.js`, etc.

**Platform Adapters**:
- `adapters/interfaces/IAudioService.js`
- `adapters/interfaces/IStorageService.js`
- `adapters/interfaces/IUIService.js`
- `adapters/web/WebAudioService.js`
- `adapters/web/WebStorageService.js`

**UI Components**:
- `ui/web/*` (when created)

### Files Excluded from Deployment

- `example-new-architecture.html` - Demo file (not needed in production)
- `*.md` - Documentation files (automatically excluded)
- `deploy.sh` - Deployment script itself
- Hidden files (`.git`, `.gitignore`, etc.)
- `node_modules/` - If present
- `.deploy_checksums/` - Local deployment cache

### How It Works

1. **Collects files from multiple locations**:
   ```bash
   ROOT_FILES    # Root level: *.html, *.css, *.js, etc.
   CORE_FILES    # core/**/*.js
   ADAPTER_FILES # adapters/**/*.js
   UI_FILES      # ui/**/*.{html,css,js}
   ```

2. **Creates subdirectories on server**:
   - For `core/audio/PitchDetectionEngine.js`:
     - Creates `core/audio/` directory
     - Uploads file to correct location

3. **Maintains checksums per file**:
   - Stores checksums in `.deploy_checksums/`
   - Mirrors directory structure for nested files
   - Only uploads changed files

### Testing the Deployment

**Dry run** (see what would be uploaded):
```bash
# Modify deploy.sh temporarily to add echo before lftp
# Or just check the file list output
./deploy.sh | grep "Uploading"
```

**First deployment** (after refactoring):
- Will upload all new architecture files
- Creates `core/` and `adapters/` directories on server
- Existing files remain unchanged (if not modified)

**Subsequent deployments**:
- Only uploads changed files (as before)
- Skips unchanged files for faster deployment

### Server Directory Structure

After deployment, server will have:
```
public_html/
├── index.html
├── styles.css
├── app.js
├── [other root files]
├── core/
│   └── audio/
│       └── PitchDetectionEngine.js
├── adapters/
│   ├── interfaces/
│   │   ├── IAudioService.js
│   │   ├── IStorageService.js
│   │   └── IUIService.js
│   └── web/
│       ├── WebAudioService.js
│       └── WebStorageService.js
└── ui/
    └── web/
        └── [future UI files]
```

### Backward Compatibility

- ✅ Old architecture files still deployed (no breaking changes)
- ✅ New architecture files deployed alongside old files
- ✅ Both versions work simultaneously
- ✅ Can gradually migrate without downtime

### Troubleshooting

**Problem**: Files not uploading to subdirectories
```bash
# Check lftp supports mkdir -p
lftp --version

# Manually test:
lftp -u 'user,pass' ftp.tonedeath.app -e "mkdir -p core/audio; exit"
```

**Problem**: Wrong directory structure on server
```bash
# Check what's on server:
lftp -u 'user,pass' ftp.tonedeath.app -e "find; exit"

# Clean and redeploy if needed:
# (Be careful - this deletes everything!)
lftp -u 'user,pass' ftp.tonedeath.app -e "rm -rf core adapters ui; exit"
./deploy.sh
```

**Problem**: Checksums not working for subdirectory files
- Check `.deploy_checksums/` has matching directory structure
- Checksums stored as `.deploy_checksums/core/audio/PitchDetectionEngine.js.md5`

### Future Enhancements

**When migrating to Capacitor/iOS**:
- Deploy script stays the same (web files still needed)
- Add `capacitor.config.json` to root
- Add `ios/` directory (but don't deploy it)
- iOS app bundles web files internally

**When creating native iOS app**:
- Web deployment continues for web version
- iOS app distributed via App Store
- Core logic shared between both!

### Performance

**Upload speed**:
- Only changed files uploaded (smart caching)
- Subdirectory files uploaded one-by-one (reliable)
- Typical deployment: 1-5 files (2-10 seconds)
- Full deployment: ~30-40 files (30-60 seconds)

**Checksum storage**:
- Minimal disk usage (~1KB per file)
- Fast MD5 calculation
- Persistent across deployments

## Summary

The deploy script now:
- ✅ Supports new architecture subdirectories
- ✅ Creates server directory structure automatically
- ✅ Maintains checksums for all files (including nested)
- ✅ Works with both old and new architecture
- ✅ No manual FTP client needed!

Deploy as usual:
```bash
./deploy.sh
```

Everything will be uploaded to the correct locations automatically! 🚀
