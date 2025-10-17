# Tone Darts Sound Mapping System

## Sound Files Used

1. **706968__gridmaw__darts-impacting-dart-board.wav** (14.43 seconds)
   - Contains multiple dart impact sounds with varying tonal qualities
   - Used for hits on the dartboard (0-50 cents accuracy)

2. **587252__beetlemuse__dats-right.wav**
   - Currently loaded but not used (reserved for future features)

3. **471427__juaner__23_miss_hit.wav**
   - Used for complete misses (>100 cents off target)

---

## Sound Quality Rankings

The dartboard wav file has been analyzed and segmented into 9 distinct impact sounds, ranked by quality:

### **Cleanest Sounds** (0-10 cents accuracy)
Used for **Bullseye and Excellent hits**

| Timestamp | Duration | Description |
|-----------|----------|-------------|
| 0.0s | 0.35s | Very clean thud - pure impact |
| 1.8s | 0.35s | Clean impact - solid hit |
| 3.5s | 0.35s | Solid clean sound - satisfying |

**Characteristics:** Deep, muffled thud with minimal ring or resonance. Sounds like hitting dense material.

---

### **Moderate Sounds** (10-30 cents accuracy)
Used for **Good to Very Good hits**

| Timestamp | Duration | Description |
|-----------|----------|-------------|
| 5.2s | 0.35s | Slight ring - balanced tone |
| 6.8s | 0.35s | Balanced sound - neutral quality |
| 8.4s | 0.35s | Medium tone - some resonance |

**Characteristics:** Mix of impact and slight metallic ring. Still pleasant but with audible resonance.

---

### **Metallic Sounds** (30-50 cents accuracy)
Used for **Edge hits and Outer ring**

| Timestamp | Duration | Description |
|-----------|----------|-------------|
| 10.0s | 0.35s | More metallic - clear ring |
| 11.5s | 0.35s | Ringing sound - sustained tone |
| 13.0s | 0.35s | Most metallic - longest ring |

**Characteristics:** Sharp metallic ring with sustained resonance. Sounds like hitting thin metal or wire frame.

---

## Accuracy-to-Sound Mapping

```javascript
Cents Difference → Sound Quality → User Experience
─────────────────────────────────────────────────
0-1 cents    → Clean (random)  → Bullseye! Deep satisfying thud
1-10 cents   → Clean (random)  → Excellent! Solid clean hit
10-20 cents  → Moderate        → Very Good! Balanced sound
20-30 cents  → Moderate        → Good! Some ring audible
30-40 cents  → Metallic        → Okay. Noticeable metallic ring
40-50 cents  → Metallic        → Marginal. Sharp metallic tone
50-100 cents → (No sound)      → Black ring, 0 points
>100 cents   → Miss sound      → Off board! Complete miss
```

---

## Implementation Details

### Sound Selection Algorithm

```javascript
playHitSound(centsDiff) {
    if (centsDiff <= 10) {
        // Bullseye/Excellent → Pick random from 3 clean sounds
        // Provides variety while maintaining quality feedback
    }
    else if (centsDiff <= 30) {
        // Good → Pick random from 3 moderate sounds
        // Subtle audio cue that hit was less accurate
    }
    else {
        // Edge/Outer → Pick random from 3 metallic sounds
        // Clear audio feedback that hit was on the edge
    }
}
```

### Why This Mapping Works

1. **Intuitive Feedback**: Cleaner sound = better accuracy
2. **Subconscious Learning**: Users naturally associate "good sound" with "good hit"
3. **Variety**: 3 sounds per tier prevents repetition fatigue
4. **Audio Cues**: Even without looking, users know how accurate they were
5. **Satisfying Progression**: Hitting bullseye feels better (sounds better)

---

## Audio Psychology

### Clean Sounds (Center Hits)
- **Psychological Effect**: Satisfaction, achievement, confidence
- **Physical Sensation**: Solid impact, "meaty" feel
- **Reinforcement**: Encourages precision

### Moderate Sounds (Good Hits)
- **Psychological Effect**: Progress, "close enough"
- **Physical Sensation**: Acceptable but room for improvement
- **Reinforcement**: Motivates further refinement

### Metallic Sounds (Edge Hits)
- **Psychological Effect**: "Almost missed", lucky hit
- **Physical Sensation**: Harsh, unstable, on the edge
- **Reinforcement**: Strong signal to improve accuracy

### Miss Sound (Off Board)
- **Psychological Effect**: Clear failure signal
- **Physical Sensation**: Distinct from any hit sound
- **Reinforcement**: Unambiguous feedback to try again

---

## Future Enhancements

### Potential Additions:
1. **Combo sounds**: Chain clean hits together for special audio reward
2. **Volume mapping**: Closer to center = louder sound (more confidence)
3. **Pitch shifting**: Vary pitch based on target frequency (higher target = higher sound)
4. **Stereo panning**: Left/right position based on where dart lands on board
5. **Reverb amount**: More reverb for edge hits, dry sound for bullseye

### A/B Testing Ideas:
- Test if sound mapping improves learning speed
- Compare against random sound selection
- Measure user satisfaction with different mappings

---

## Technical Notes

- All sounds play at 50% volume (0.5 gain)
- Segment duration: 0.35 seconds (captures full impact + decay)
- Random selection within quality tier prevents pattern recognition
- Sound loads once at initialization for performance
- Uses Web Audio API for precise timing and playback control

---

## User Experience Goals

✅ **Immediate Feedback**: Sound plays instantly when dart lands
✅ **Audio Clarity**: Each hit sounds distinct and recognizable
✅ **Progressive Difficulty**: Sound quality rewards precision
✅ **Motivation**: Clean sounds are satisfying to achieve
✅ **Accessibility**: Audio-only feedback works for car mode
