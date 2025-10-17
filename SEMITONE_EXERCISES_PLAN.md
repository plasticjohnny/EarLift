# Interval Exercises - Design Plan

## Overview
Two series of exercises designed to help users intuitively understand and hear the fundamental intervals in Western music:
- **Half-Steps** (semi-tones): 1 half-step = smallest interval
- **Whole-Steps**: 2 half-steps = fundamental scale building block

**Design Pattern**: Both categories contain the same exercises, adapted for their respective intervals. When you add/modify an exercise in one category, it should be mirrored in the other.

---

## Current Exercise Organization

### 🎯 Unison Exercises (5 exercises)
Match single pitches with precision:
1. **Pitch Match** - Match your voice to a tone
2. **Pitch Hold** - Hold a pitch for 3.5 seconds
3. **Octave Match** - Match notes an octave apart
4. **Tone Slide** - Slide pitch to match
5. **Tone Darts** - Pitch accuracy game

### 🎼 Half-Steps (NEW CATEGORY)
Hear and understand half-step (semi-tone) relationships:
- *To be designed*

### 🎵 Whole-Steps (NEW CATEGORY)
Hear and understand whole-step (2 semi-tones) relationships:
- *To be designed - mirrors Half-Steps exercises*

### 🎵 Other Exercises (3 exercises)
1. **Glissando** - Slide voice through range
2. **Scale Match Up** - Sing major scale
3. **Mic Diagnostics** - Test pitch detection

---

## Interval Exercise Ideas

**IMPORTANT**: Each exercise exists in BOTH Half-Steps and Whole-Steps categories. The only difference is the interval size used.

### 1. **Interval Recognition**
**Half-Step Version**: "Half-Step Recognition"
- Play two notes (either same pitch or 1 half-step apart)
- User identifies: "Same" or "Different"
- Progressive difficulty: start with obvious differences, get subtler
- Builds: Basic interval recognition

**Whole-Step Version**: "Whole-Step Recognition"
- Play two notes (either same pitch or 1 whole-step apart)
- Identical mechanics, just 2 semi-tones instead of 1

### 2. **Interval Direction**
**Half-Step Version**: "Half-Step Direction"
- Play two notes 1 half-step apart
- User identifies: "Up" or "Down"
- Helps: Directional hearing, pitch discrimination

**Whole-Step Version**: "Whole-Step Direction"
- Play two notes 1 whole-step apart
- User identifies: "Up" or "Down"

### 3. **Interval Singing**
**Half-Step Version**: "Half-Step Singing"
- Play a reference note
- User sings exactly 1 half-step higher or lower (indicated)
- Feedback on accuracy
- Builds: Active pitch control at half-step level

**Whole-Step Version**: "Whole-Step Singing"
- Play a reference note
- User sings exactly 1 whole-step higher or lower (indicated)

### 4. **Interval Match**
**Half-Step Version**: "Half-Step Match"
- Play two notes 1 half-step apart sequentially
- User matches the second note
- Like Pitch Match but with interval context
- Helps: Hearing in relation to another note

**Whole-Step Version**: "Whole-Step Match"
- Play two notes 1 whole-step apart sequentially
- User matches the second note

### 5. **Interval Memory**
**Half-Step Version**: "Half-Step Memory"
- Play a reference note
- Wait 3-5 seconds
- User sings 1 half-step up/down from memory
- Tests: Pitch memory + interval accuracy

**Whole-Step Version**: "Whole-Step Memory"
- Play a reference note
- Wait 3-5 seconds
- User sings 1 whole-step up/down from memory

### 6. **Scale Steps**
**Half-Step Version**: "Chromatic Steps"
- Play ascending/descending chromatic scale (all half-steps)
- User sings along or after
- Builds: Chromatic awareness, fine pitch control

**Whole-Step Version**: "Whole-Tone Steps"
- Play ascending/descending whole-tone scale (all whole-steps)
- User sings along or after
- Example: C-D-E-F#-G#-A#-C

### 7. **Interval Darts** (Game variant)
**Half-Step Version**: "Half-Step Darts"
- Target is 1 half-step away from reference
- Score based on accuracy hitting the target interval
- Like Tone Darts but interval-focused

**Whole-Step Version**: "Whole-Step Darts"
- Target is 1 whole-step away from reference
- Score based on accuracy hitting the target interval

### 8. **Scale Context**
**Half-Step Version**: "Leading Tone Resolution"
- Play scale degree 7 (leading tone)
- User sings the resolution up to the tonic (1 half-step)
- Introduces: Musical context for half-steps
- Example: B → C in C major

**Whole-Step Version**: "Major Second Steps"
- Play scale degree 1 (tonic)
- User sings up to degree 2 (1 whole-step)
- Introduces: Musical context for whole-steps
- Example: C → D in C major

---

## Recommended Implementation Order

**IMPORTANT**: Implement exercises in PAIRS - both Half-Step and Whole-Step versions together.

### Phase 1: Foundation (Start Here)
1. **Interval Recognition** (Half-Step + Whole-Step) - Easiest, pure listening
2. **Interval Direction** (Half-Step + Whole-Step) - Adds minimal complexity
3. **Interval Singing** (Half-Step + Whole-Step) - First active production

### Phase 2: Application
4. **Interval Match** (Half-Step + Whole-Step) - Combines listening + singing
5. **Scale Steps** (Half-Step + Whole-Step) - Multiple intervals in sequence

### Phase 3: Advanced
6. **Interval Memory** (Half-Step + Whole-Step) - Adds memory challenge
7. **Scale Context** (Half-Step + Whole-Step) - Musical context
8. **Interval Darts** (Half-Step + Whole-Step) - Gamification

---

## Design Principles

### Progressive Difficulty
- Start with recognition (passive)
- Move to production (active)
- Add memory/speed challenges
- Introduce musical context

### Immediate Feedback
- Visual indicators (color-coded)
- Audio confirmation
- Score/accuracy display
- Encouraging messages

### Variety
- Mix passive listening and active singing
- Include games and drills
- Offer different learning styles

### Musical Context
- Eventually connect semi-tones to music theory
- Show where they appear in scales
- Demonstrate their role in melody

---

## Technical Considerations

### Frequency Calculations
```javascript
// Half-step (semi-tone) = frequency ratio of 2^(1/12)
const HALFSTEP_RATIO = Math.pow(2, 1/12); // ≈ 1.059463

// Whole-step = 2 half-steps = frequency ratio of 2^(2/12)
const WHOLESTEP_RATIO = Math.pow(2, 2/12); // ≈ 1.122462

// From reference frequency:
// Half-steps:
const halfStepUp = referenceFreq * HALFSTEP_RATIO;
const halfStepDown = referenceFreq / HALFSTEP_RATIO;

// Whole-steps:
const wholeStepUp = referenceFreq * WHOLESTEP_RATIO;
const wholeStepDown = referenceFreq / WHOLESTEP_RATIO;
```

### Accuracy Tolerance
- Half-step = 100 cents
- Whole-step = 200 cents
- Quarter-tone = 50 cents

**Acceptable ranges:**
- Half-step exercises: ±25 cents for "correct"
- Whole-step exercises: ±35 cents for "correct"
- Display: How many cents off target interval

### Visual Feedback
- Two-note display showing interval
- Arrow indicating direction (up/down)
- Distance indicator (cents from target)
- Color coding: green (correct), yellow (close), red (wrong)

---

## User Flow Example: Interval Recognition

### Half-Step Recognition
```
1. Exercise starts
   "Listen to two notes. Are they the SAME or DIFFERENT?"

2. Play two notes (randomized):
   - 50% chance: same note twice
   - 50% chance: 1 half-step apart

3. User selects: [SAME] [DIFFERENT]

4. Feedback:
   ✅ Correct! The notes were 1 half-step apart.
   or
   ❌ Not quite. The notes were the same.

5. Stats update: 8/10 correct (80%)

6. Next round
```

### Whole-Step Recognition
```
1. Exercise starts
   "Listen to two notes. Are they the SAME or DIFFERENT?"

2. Play two notes (randomized):
   - 50% chance: same note twice
   - 50% chance: 1 whole-step apart

3. User selects: [SAME] [DIFFERENT]

4. Feedback:
   ✅ Correct! The notes were 1 whole-step (2 half-steps) apart.
   or
   ❌ Not quite. The notes were the same.

5. Stats update: 8/10 correct (80%)

6. Next round
```

---

## Integration with Existing App

### Usage Modes Compatibility
- **Headphone + Mic**: All exercises work
- **Speaker + Mic**: Recognition exercises work (no simultaneous audio)
- **Car Mode**: Recognition exercises can be adapted (voice feedback)

### Settings Integration
- Uses existing vocal range
- Respects pitch sensitivity settings
- Works with microphone gain settings

### UI Consistency
- Same card-based layout
- Standard exercise container
- Exit button in top-right
- Progress counter
- Settings button access

---

## Next Steps

1. **Choose First Exercise Pair**: Interval Recognition (simplest to implement)
2. **Create Shared Base Class**: `intervalExerciseBase.js` (DRY principle)
3. **Create Exercise Files**:
   - `halfStepRecognitionExercise.js`
   - `wholeStepRecognitionExercise.js`
4. **Design UI**: Similar to existing exercises
5. **Implement Logic**: Random note generation, user input, feedback
6. **Test Thoroughly**: Ensure interval detection is accurate
7. **Add to Index**: Update HTML with both exercise cards
8. **Deploy**: Add to deploy.sh
9. **Iterate**: Based on user feedback, then implement next pair

---

## Success Metrics

### Half-Step Exercises
- User can consistently identify half-step differences (>80% accuracy)
- User can sing half-steps with <25 cent error
- User reports "hearing" half-steps more clearly

### Whole-Step Exercises
- User can consistently identify whole-step differences (>80% accuracy)
- User can sing whole-steps with <35 cent error
- User can distinguish whole-steps from half-steps

### Overall
- Exercises are engaging (high completion rate)
- Progression feels natural (not too easy, not too hard)
- Users complete both categories to understand the relationship

---

## Educational Impact

### Half-Step Exercises
Users will:
- **Hear finer pitch distinctions** (crucial for intonation)
- **Understand chromatic movement** (foundation for music theory)
- **Sing more accurately** (half-step control = total control)
- **Recognize the smallest interval** (building block for all others)

**Why half-steps matter**: They're the atomic unit of Western music. Mastering them unlocks everything else.

### Whole-Step Exercises
Users will:
- **Understand major scale structure** (most intervals are whole-steps)
- **Hear common melodic motion** (whole-steps are everywhere in music)
- **Build interval vocabulary** (foundation for thirds, fourths, etc.)
- **Distinguish step sizes** (knowing both intervals deepens understanding)

**Why whole-steps matter**: They're the most common interval in melodies and scales. Combined with half-steps, they form the complete diatonic system.

### Combined Learning
By practicing BOTH intervals in parallel, users:
- **Develop comparative hearing** (half vs. whole)
- **Understand interval relationships** (2 halves = 1 whole)
- **Build complete foundation** (ready for larger intervals)
- **Gain musical context** (how scales are actually built)
