# AI Pet Sim - Tamagotchi Mechanics Implementation Plan

## Research Summary

Based on extensive research of Tamagotchi mechanics, virtual pet game design, and modern implementations, I've identified key features that make virtual pets engaging and meaningful.

### Core Tamagotchi Mechanics Discovered:

**1. Care Mistakes System**
- Physical care mistakes: Missed hunger calls, missed scolding, not curing sickness
- Mental care mistakes: Missed happiness calls, missed praising, leaving lights on
- 15-minute response window before care mistake is recorded
- Care mistakes determine evolution paths (better care = better characters)

**2. Stat System**
- Hunger: Increases over time (0.5/min), decreases with feeding
- Happiness: Can be filled with games, snacks, or care
- Health: Affected by hunger levels, cleanliness, sickness
- Hidden "hearts" allow overfeeding by 2 meals beyond meter
- Weight: Increases with food, decreases with games

**3. Life Stages & Evolution**
- Egg → Baby → Child → Teen → Adult → Elder
- Evolution timing based on care quality, not just age
- Some evolutions require specific care mistake counts
- Better care = healthier, more desirable adults

**4. Daily Care Activities**
- Feeding (meals and snacks)
- Cleaning poop (hygiene)
- Discipline/Training (scolding bad behavior, praising good)
- Playing games
- Turning lights off for sleep

**5. Sickness & Health**
- Can get sick from: missed care, too much poop, too many snacks, extreme temperatures
- Sickness requires medicine to cure
- Multiple sicknesses can lead to death

**6. Mini-Games**
- Improve happiness and intelligence
- Provide rewards (food, items)
- Strengthen bond with pet

---

## Implementation Plan

### Phase 8: Core Tamagotchi Mechanics Enhancement

#### 8.1 Care Mistakes System
**Purpose**: Create meaningful consequences for neglect that affect evolution
- **8.1.1**: Add `careMistakes` tracking to Creature class
  - Track physical mistakes (hunger, sickness)
  - Track mental mistakes (happiness, praise calls)
  - Add timestamp of when mistake occurred
  - Display care quality score in UI
  
- **8.1.2**: Implement 15-minute response window
  - Track when attention icon is triggered
  - Start countdown timer
  - Record care mistake if timer expires
  - Cancel timer when player responds

- **8.1.3**: Add evolution impact
  - Use care mistakes in evolution calculations
  - Better care = better character outcomes
  - Persist care history across stages

**Why**: Care mistakes are fundamental to Tamagotchi. They create tension, teach responsibility, and make the pet feel alive.

#### 8.2 Expanded Stat System

- **8.2.1**: Add Weight stat
  - Increases with feeding (+5g per meal, +2g per snack)
  - Decreases with games (-3g per game)
  - Affects appearance (creature gets visually larger)
  - Extreme weight affects health
  
- **8.2.2**: Add Hygiene/Cleanliness stat
  - Decreases over time
  - Poop events reduce hygiene significantly
  - Low hygiene = sickness risk
  - Visual indicator (creature looks dirty)
  
- **8.2.3**: Add Discipline/Training stat
  - Track successful discipline actions
  - Pet calls for attention randomly
  - Player must choose: praise (good behavior) or scold (bad behavior)
  - Affects evolution outcomes

- **8.2.4**: Enhance existing stats
  - Hunger: Add hidden hearts (can eat 2 meals beyond meter)
  - Happiness: Cap at 50% before adulthood (like modern Tamagotchis)
  - Health: More granular, affects visual appearance

**Why**: More stats = deeper simulation, more care activities, longer engagement.

#### 8.3 Sickness System

- **8.3.1**: Add sickness triggers
  - Low hygiene for extended period
  - Too many snacks (>15 in succession = cavity)
  - Extreme stat values (very hungry, very unhappy)
  - Missed care calls
  
- **8.3.2**: Add sickness states
  - Sick: Creature displays "X_X" eyes, lays down
  - Requires medicine action
  - Multiple untreated sicknesses = death/run away
  
- **8.3.3**: Add visual indicators
  - Skull icon above creature when sick
  - Creature stops moving/animating
  - Darkened color palette

**Why**: Sickness creates urgency and teaches consequences of neglect.

#### 8.4 Poop System

- **8.4.1**: Add poop events
  - Random poop generation after feeding
  - Poop accumulates on screen
  - Each poop reduces hygiene stat
  - Multiple poops = sickness trigger
  
- **8.4.2**: Add clean action
  - Click poop to clean it
  - Cleaning restores hygiene
  - Visual poop sprites on canvas
  
- **8.4.3**: Poop mechanics
  - Max 4 poops on screen
  - 5th+ poop = automatic sickness
  - Poop removed automatically after cleaning

**Why**: Poop is iconic to Tamagotchi. It adds mess, responsibility, and humor.

#### 8.5 Discipline/Training System

- **8.5.1**: Add attention calls
  - Pet beeps and shows attention icon randomly
  - Player has 15 minutes to respond
  - Must choose appropriate action
  
- **8.5.2**: Add behavior types
  - Good behavior: Pet is happy, praising increases discipline
  - Bad behavior: Pet is misbehaving, scolding increases discipline
  - Refusal: Pet refuses food/play, needs discipline
  
- **8.5.3**: Discipline meter
  - Track successful discipline actions
  - Required for certain evolution paths
  - Visual meter in UI

**Why**: Discipline teaches boundaries and creates decision-making moments.

#### 8.6 Enhanced Evolution System

- **8.6.1**: Evolution requirements
  - Minimum age per stage (e.g., baby→child at 1 day)
  - Care quality thresholds
  - Stat minimums (happiness, discipline)
  
- **8.6.2**: Evolution outcomes
  - Multiple possible outcomes per stage
  - Care mistakes determine which outcome
  - Better care = rarer, better characters
  
- **8.6.3**: Evolution ceremony
  - Special animation when evolving
  - Display new character name and type
  - Show evolution history

**Why**: Evolution is the reward loop. Better care = better outcomes creates motivation.

#### 8.7 Mini-Games System

- **8.7.1**: Create mini-game framework
  - Modal overlay for games
  - Score tracking
  - Rewards system
  
- **8.7.2**: Implement "Guess the Direction"
  - Pet jumps left or right
  - Player guesses direction
  - Correct guess = happiness + weight loss
  
- **8.7.3**: Implement "High/Low Number"
  - Guess if next number is higher or lower
  - Success = rewards
  
- **8.7.4**: Game rewards
  - Happiness increase
  - Weight decrease
  - Occasional special items

**Why**: Games provide active engagement, break up routine care, and reward skill.

#### 8.8 Sleep/Wake Cycle

- **8.8.1**: Add day/night cycle
  - Pet sleeps at set times (9 PM - 8 AM default)
  - Can't interact while sleeping
  - Must turn off "lights" (toggle in UI)
  
- **8.8.2**: Sleep mechanics
  - Leaving lights on = care mistake
  - Pet recovers energy while sleeping
  - Stats don't decrease during sleep
  
- **8.8.3**: Wake cycle
  - Pet wakes automatically at set time
  - Stats resume decreasing
  - Attention call when waking

**Why**: Sleep creates natural downtime and teaches routine care.

---

### Phase 9: UI/UX Enhancements

#### 9.1 Enhanced Stats Panel

- **9.1.1**: Expand stats display
  - Show all 6+ stats with icons
  - Visual bars with color coding
  - Numeric values
  
- **9.1.2**: Add attention system
  - Icon appears when pet needs care
  - Blinking indicator
  - Click to jump to needed action
  
- **9.1.3**: Add status indicators
  - Sleeping icon
  - Sick icon
  - Dirty icon
  - Attention needed icon

#### 9.2 Action Panel Redesign

- **9.2.1**: Organize actions
  - Care: Feed, Clean, Medicine
  - Play: Games, Praise
  - Discipline: Scold
  - Environment: Lights toggle
  
- **9.2.2**: Add action feedback
  - Visual feedback on action
  - Sound effects (if enabled)
  - Creature reaction animation

#### 9.3 Evolution Display

- **9.3.1**: Evolution history
  - Show all past evolutions
  - Timestamps
  - Character images/names
  
- **9.3.2**: Current status
  - Progress to next evolution
  - Requirements display
  - Time until next stage

---

### Phase 10: Polish & Refinement

#### 10.1 Visual Enhancements

- **10.1.1**: Creature visual states
  - Happy (bouncing, bright colors)
  - Hungry (slow movement, sad face)
  - Sick (X_X eyes, dark colors)
  - Sleeping (Zzz animation, dimmed)
  - Dirty (brown spots, flies)
  
- **10.1.2**: Environmental effects
  - Day/night lighting
  - Weather effects (optional)
  - Background themes

#### 10.2 Audio System

- **10.2.1**: Add @pixi/sound integration
  - Background music (calm, ambient)
  - Action sounds (feed, play, etc.)
  - Attention beeps
  - Evolution fanfare
  
- **10.2.2**: Volume controls
  - Master volume
  - Music volume
  - SFX volume
  - Mute toggle

#### 10.3 Settings & Customization

- **10.3.1**: Game settings
  - Sleep/wake times
  - Stat decrease rates
  - Notification preferences
  
- **10.3.2**: Visual settings
  - Theme selection
  - Animation speed
  - Particle effects toggle

---

## Implementation Order

1. **Week 1**: Core Mechanics
   - Care mistakes system
   - Expanded stats (weight, hygiene, discipline)
   - Poop system
   - Sickness system

2. **Week 2**: Systems Integration
   - Sleep/wake cycle
   - Discipline/training
   - Enhanced evolution
   - Mini-games framework

3. **Week 3**: UI/UX
   - Enhanced stats panel
   - Redesigned action panel
   - Visual state changes
   - Evolution display

4. **Week 4**: Polish
   - Audio system
   - Settings panel
   - Final testing
   - Documentation

---

## Success Metrics

- Player interacts with pet 5+ times per session
- Average creature lifespan > 7 days
- Players experience 2+ evolution stages
- Care mistakes affect evolution outcomes
- Mini-games played 3+ times per day

---

**Research Date**: 2026-02-15
**Plan Version**: 2.0
**Status**: Ready for Implementation
