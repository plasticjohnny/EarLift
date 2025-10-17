# Car Mode Exercise Adaptations

This document outlines proposed adaptations for each exercise to work in Car Mode (hands-free driving mode).

## Usage Modes Overview

### 1. Headphone + Mic (Default)
- User has a single headphone with microphone
- Can play tones and record voice simultaneously
- All exercises work as designed

### 2. Speaker + Mic
- User has separate speaker and microphone
- Cannot play tones and record simultaneously (sound pollution)
- Exercises requiring simultaneous audio are disabled

### 3. Car Mode
- Hands-free mode for safe driving
- Cannot use touch-based interactions
- Sequential audio only (no simultaneous playback + recording)
- Exercises must be adapted for voice-only interaction

---

## Exercise Compatibility Matrix

| Exercise | Headphone+Mic | Speaker+Mic | Car Mode | Notes |
|----------|---------------|-------------|----------|-------|
| Glissando | ✅ | ❌ | ❌ (needs adaptation) | Requires mic feedback during vocal range |
| Pitch Match | ✅ | ✅ | ✅ | Speaker only, no mic needed |
| Pitch Hold | ✅ | ❌ | ❌ (needs adaptation) | Requires simultaneous tone + mic |
| Octave Match | ✅ | ✅ | ✅ | Speaker only, no mic needed |
| Scale Match | ✅ | ✅ | ✅ | Speaker only, no mic needed |
| Tone Slide | ✅ | ✅ | ❌ | Requires touch interaction |
| Tone Darts | ✅ | ❌ | ❌ (needs adaptation) | Requires simultaneous tone + mic |
| Mic Diagnostics | ✅ | ✅ | ✅ | Diagnostic tool, always available |

---

## Car Mode Adaptation Proposals

### 1. Glissando Exercise
**Current:** User sings continuously while pitch is detected in real-time.

**Car Mode Adaptations:**

#### Option A: Voice-Guided Feedback
- User sings through their range
- App provides verbal feedback: "Higher... Perfect!... Lower..."
- No visual feedback needed
- Could use spatial audio cues (pitch in left/right ear)

#### Option B: Haptic/Audio Pulse Feedback
- User sings a sustained tone
- App plays pulsing beeps that change frequency with pitch accuracy
- Faster pulses = closer to target
- Different tone colors for too high/too low

#### Option C: Countdown Range Mode
- App announces: "Sing from low to high in 10 seconds"
- User performs glissando
- App scores coverage of vocal range
- Results announced verbally at end

**Recommendation:** Option A - most intuitive for driving

---

### 2. Pitch Match (Intonation) Exercise
**Current:** Plays tone, user matches with voice (no mic needed).

**Car Mode:** ✅ **Already Compatible**
- No changes needed
- User can match tones while driving safely

---

### 3. Pitch Hold Exercise
**Current:** Tone plays continuously, user must hold pitch for 3 seconds.

**Car Mode Adaptations:**

#### Option A: Sequential Mode
- Phase 1: Tone plays for 3 seconds
- Phase 2: Silence for 1 second (transition)
- Phase 3: User sings and holds for 3 seconds
- App announces: "Match!" or "Try again"

#### Option B: Memory Challenge Mode
- Phase 1: Tone plays for 2 seconds
- Phase 2: 5 seconds of silence (memory test)
- Phase 3: User sings the remembered pitch
- Scores both accuracy and pitch memory

#### Option C: Echo Mode
- Tone plays in 0.5s pulses with 0.5s gaps
- User sings during the silent gaps
- Tests ability to maintain pitch between references

**Recommendation:** Option A - simplest and safest for driving

---

### 4. Octave Match Exercise
**Current:** Plays two tones an octave apart.

**Car Mode:** ✅ **Already Compatible**
- No changes needed
- User listens to octave pairs while driving safely

---

### 5. Scale Match Exercise
**Current:** User plays each note of a scale.

**Car Mode:** ✅ **Already Compatible**
- No changes needed
- User listens to scale sequences while driving safely

---

### 6. Tone Slide Exercise
**Current:** User manually slides a slider to match pitch.

**Car Mode:** ❌ **Not Compatible**
- Requires manual touch interaction
- Cannot be safely adapted for driving
- Must remain disabled in Car Mode

---

### 7. Tone Darts Exercise
**Current:** Play tone for 3s, immediate 1s window to sing and score.

**Car Mode Adaptations:**

#### Option A: Extended Reaction Time Mode
- Phase 1: Tone plays for 3 seconds
- Phase 2: Wait for countdown beep (3-2-1)
- Phase 3: User has 2 seconds to sing
- Measures pitch recall rather than quick matching
- Voice announces: "50 points - bullseye!" or "20 points"

#### Option B: Duration Scoring Mode
- Phase 1: Tone plays for 3 seconds
- Phase 2: User sings and holds as long as possible
- Scores based on: accuracy × duration held
- Voice announces score and duration

#### Option C: Sequential Rounds
- Phase 1: Listen phase (tone plays)
- Phase 2: Sing phase (no tone, longer window)
- Multiple rounds build up score
- Emphasizes memory and sustained pitch

**Recommendation:** Option A - maintains game feel, safe for driving

---

## Implementation Priority

### Phase 1 (Immediate)
1. ✅ Implement usage mode selector in settings
2. ✅ Grey out incompatible exercises
3. ✅ Show helpful messages when selecting disabled exercises

### Phase 2 (Future)
1. Implement Car Mode adaptations for Pitch Hold (Option A)
2. Implement Car Mode adaptations for Tone Darts (Option A)
3. Implement Car Mode adaptations for Glissando (Option A)

### Phase 3 (Optional)
1. Add alternative Car Mode variations (Options B and C)
2. Add voice announcements for all feedback
3. Add setting to choose Car Mode adaptation style per exercise

---

## Technical Notes

- Car Mode adaptations should use `appSettings.getCurrentUsageModeConfig()` to check mode
- Each exercise should check `modeConfig.handsFree` to enable Car Mode behaviors
- Voice announcements can use Web Speech API (`speechSynthesis`)
- All Car Mode interactions should have generous timing (no quick reflexes required)
- Visual feedback should still be provided but not required for operation

---

## User Safety

**Important:** All Car Mode features are designed to be:
- Hands-free (no touch required during exercise)
- Eyes-free (no visual attention required)
- Low cognitive load (simple, clear instructions)
- Easily pausable (can stop immediately if driving requires attention)

Users should be reminded that safe driving is always the priority.
