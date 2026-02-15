/**
 * Creature.js - Core entity for the AI Pet Sim virtual pet
 * 
 * DESIGN DECISIONS:
 * 
 * 1. STAT DECAY RATES (Tamagotchi-inspired):
 *    - Hunger increases 0.5/min (fastest - requires frequent feeding)
 *    - Happiness decreases 0.2/min (slow but steady decline)
 *    - Energy decreases 0.3/min (moderate - balanced with sleep)
 *    - Hygiene decreases 0.1/min (slowest - poop events accelerate this)
 *    
 *    Rationale: These rates create a compelling care loop where players must
 *    check on their pet multiple times per day without being overwhelming.
 *    The faster hunger decay ensures feeding is a primary activity.
 * 
 * 2. CARE MISTAKES SYSTEM:
 *    - 15-minute response window before a mistake is recorded
 *    - Physical mistakes: hunger, sickness, un-cleaned poop
 *    - Mental mistakes: happiness, missed praise calls
 *    - Mistakes carry over between evolutions (like vintage Tamagotchis)
 *    
 *    Rationale: Care mistakes are fundamental to Tamagotchi gameplay. They
 *    create consequences for neglect and determine evolution paths, making
 *    the pet feel alive and responsive to care quality.
 * 
 * 3. SICKNESS MECHANICS:
 *    - Multiple triggers: low hygiene, too many snacks, extreme stats
 *    - Requires medicine to cure
 *    - Untreated sickness can lead to death/run away
 *    
 *    Rationale: Sickness creates urgency and teaches consequences. It's
 *    also authentic to the original Tamagotchi experience.
 * 
 * 4. POOP SYSTEM:
 *    - Accumulates after feeding (50% chance per meal)
 *    - Max 4 poops before automatic sickness
 *    - Visual representation on canvas
 *    
 *    Rationale: Poop is iconic to Tamagotchi. It adds mess, responsibility,
 *    and humor while creating a visual indicator of neglect.
 * 
 * 5. SLEEP/WAKE CYCLE:
 *    - Pet sleeps 9PM-8AM (configurable)
 *    - Stats don't decay during sleep
 *    - Leaving lights on = care mistake
 *    
 *    Rationale: Creates natural downtime, teaches routine care, and
 *    prevents players from needing to care for pet 24/7.
 * 
 * 6. WEIGHT SYSTEM:
 *    - Increases with food (+5g meal, +2g snack)
 *    - Decreases with games (-3g per game)
 *    - Affects visual appearance (creature size)
 *    - Extreme weight affects health
 *    
 *    Rationale: Weight adds another dimension to care decisions and
 *    provides visual feedback on feeding habits.
 * 
 * 7. DISCIPLINE/TRAINING:
 *    - Random attention calls requiring response
 *    - Must choose: praise (good behavior) or scold (bad behavior)
 *    - Affects evolution outcomes
 *    
 *    Rationale: Discipline teaches boundaries and adds decision-making
 *    moments beyond simple feeding.
 * 
 * 8. EVOLUTION TIERS:
 *    - Serious: 0-1 care mistakes (best outcomes)
 *    - Normal: 2 care mistakes
 *    - Naughty: 2-3 mental mistakes only
 *    - Frail: 2-3 physical mistakes only
 *    - Stubborn: 4+ care mistakes (worst outcomes)
 *    
 *    Rationale: Multiple evolution paths based on care quality creates
 *    replayability and rewards good care.
 */

class Creature {
  constructor(data = {}) {
    this.id = data.id || this.generateId();
    this.name = data.name || 'Unnamed';
    this.type = data.type || 'creature';
    this.stage = data.stage || 'baby';
    this.createdAt = data.createdAt || Date.now();
    this.lastInteracted = data.lastInteracted || Date.now();
    
    // Core stats (original 5 + new expanded stats)
    this.stats = {
      health: data.stats?.health ?? 100,
      energy: data.stats?.energy ?? 100,
      happiness: data.stats?.happiness ?? 50,
      hunger: data.stats?.hunger ?? 50,
      age: data.stats?.age ?? 0,
      
      // NEW: Weight system (Tamagotchi-inspired)
      weight: data.stats?.weight ?? 20, // Starting weight in grams
      
      // NEW: Hygiene/cleanliness (0-100, decreases with poop)
      hygiene: data.stats?.hygiene ?? 100,
      
      // NEW: Discipline/training meter (0-10 hearts)
      discipline: data.stats?.discipline ?? 0,
      
      // NEW: Hidden hearts system (can eat 2 meals beyond meter)
      hiddenHungerHearts: data.stats?.hiddenHungerHearts ?? 0,
      hiddenHappinessHearts: data.stats?.hiddenHappinessHearts ?? 0,
      
      // NEW: Snack tracking (15+ snacks = cavity/sickness)
      snacksEaten: data.stats?.snacksEaten ?? 0,
      
      // NEW: Sickness counter (multiple sicknesses = death)
      sicknessCount: data.stats?.sicknessCount ?? 0
    };
    
    // State flags
    this.state = {
      isSick: data.state?.isSick ?? false,
      isSleeping: data.state?.isSleeping ?? false,
      isDead: data.state?.isDead ?? false,
      lightsOn: data.state?.lightsOn ?? true,
      lastSickAt: data.state?.lastSickAt ?? null,
      diedAt: data.state?.diedAt ?? null
    };
    
    // Care mistakes tracking (determines evolution outcomes)
    this.careMistakes = {
      physical: data.careMistakes?.physical ?? [], // Array of { type, timestamp }
      mental: data.careMistakes?.mental ?? [],
      total: data.careMistakes?.total ?? 0
    };
    
    // Active attention calls (waiting for player response)
    this.attentionCalls = data.attentionCalls || [];
    
    // Poop on screen (max 4 before sickness)
    this.poops = data.poops || [];
    
    // Appearance configuration
    this.appearance = data.appearance || {
      baseColor: '#8B5CF6',
      glowColor: '#A78BFA',
      shape: 'blob',
      radius: 50,
      tentacles: 0,
      eyeCount: 2,
      specialFeatures: []
    };
    
    this.personality = data.personality || {
      traits: ['friendly'],
      mood: 'neutral'
    };
    
    this.evolutionHistory = data.evolutionHistory || [];
    
    // Sleep schedule (configurable, default 9PM-8AM)
    this.sleepSchedule = data.sleepSchedule || {
      sleepHour: 21, // 9 PM
      wakeHour: 8   // 8 AM
    };
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Main stat update loop - called every minute by GameLoop
   * Applies Tamagotchi-style stat decay and checks for attention needs
   */
  updateStats(deltaMinutes) {
    // Don't update if dead or sleeping
    if (this.state.isDead || this.state.isSleeping) {
      this.lastInteracted = Date.now();
      return;
    }

    // Check sleep schedule and update sleep state
    this.updateSleepState();
    
    // Don't decay stats while sleeping
    if (this.state.isSleeping) {
      // Recover energy while sleeping
      this.stats.energy = Math.min(100, this.stats.energy + (deltaMinutes * 2));
      this.lastInteracted = Date.now();
      return;
    }

    // Tamagotchi-inspired stat decay rates
    // Hunger increases fastest (0.5/min) - requires frequent feeding
    this.stats.hunger = Math.min(100, this.stats.hunger + (deltaMinutes * 0.5));
    
    // Happiness slowly decreases (0.2/min)
    this.stats.happiness = Math.max(0, this.stats.happiness - (deltaMinutes * 0.2));
    
    // Energy decreases (0.3/min)
    this.stats.energy = Math.max(0, this.stats.energy - (deltaMinutes * 0.3));
    
    // Hygiene slowly decreases (0.1/min)
    this.stats.hygiene = Math.max(0, this.stats.hygiene - (deltaMinutes * 0.1));

    // Health affected by hunger (sickness risk at >80 hunger)
    if (this.stats.hunger > 80) {
      this.stats.health = Math.max(0, this.stats.health - (deltaMinutes * 0.1));
    } else if (this.stats.hunger < 30 && this.stats.health < 100 && !this.state.isSick) {
      // Recover health when well-fed and not sick
      this.stats.health = Math.min(100, this.stats.health + (deltaMinutes * 0.05));
    }

    // Health affected by hygiene (sickness risk at <20 hygiene)
    if (this.stats.hygiene < 20) {
      this.stats.health = Math.max(0, this.stats.health - (deltaMinutes * 0.15));
    }

    // Age increases (convert minutes to days)
    this.stats.age += deltaMinutes / (24 * 60);

    // Check for sickness triggers
    this.checkSicknessTriggers();

    // Check for care mistakes (expired attention calls)
    this.checkExpiredAttentionCalls();

    // Random attention calls (discipline/training opportunities)
    this.maybeTriggerAttentionCall();

    this.lastInteracted = Date.now();
  }

  /**
   * Updates sleep state based on current time and schedule
   * Leaving lights on during sleep = care mistake
   */
  updateSleepState() {
    const now = new Date();
    const currentHour = now.getHours();
    const shouldBeAsleep = currentHour >= this.sleepSchedule.sleepHour || 
                           currentHour < this.sleepSchedule.wakeHour;
    
    if (shouldBeAsleep && !this.state.isSleeping) {
      // Pet should go to sleep
      this.state.isSleeping = true;
      
      // Care mistake if lights are left on
      if (this.state.lightsOn) {
        this.recordCareMistake('mental', 'lights_on');
      }
    } else if (!shouldBeAsleep && this.state.isSleeping) {
      // Pet should wake up
      this.state.isSleeping = false;
      this.state.lightsOn = true; // Auto-turn on lights
      
      // Trigger attention call when waking
      this.triggerAttentionCall('wake');
    }
  }

  /**
   * Toggle lights on/off
   * Important for sleep cycle - leaving lights on = care mistake
   */
  toggleLights() {
    this.state.lightsOn = !this.state.lightsOn;
    
    // If turning off lights while pet should be asleep, good care
    if (!this.state.lightsOn && this.state.isSleeping) {
      // Good - lights off during sleep
      return { success: true, message: 'Lights turned off. Sweet dreams!' };
    }
    
    return { 
      success: true, 
      lightsOn: this.state.lightsOn,
      message: this.state.lightsOn ? 'Lights on' : 'Lights off'
    };
  }

  /**
   * Feed the creature (meal)
   * Meals reduce hunger by 20, increase weight by 5g
   * Hidden hearts allow eating 2 meals beyond meter
   */
   async feed(amount = 20) {
     if (this.state.isSick) {
       return { success: false, message: `${this.name} is too sick to eat.` };
     }

     if (this.state.isSleeping) {
       return { success: false, message: `${this.name} is sleeping.` };
     }

     // Check for hidden hearts before feeding
     const canUseHiddenHearts = this.stats.hiddenHungerHearts > 0 && this.stats.hunger >= amount;

     if (canUseHiddenHearts) {
       this.stats.hiddenHungerHearts--;
       return { success: true, message: `${this.name} ate using a hidden heart!`, warning: 'Hidden hearts left: ' + this.stats.hiddenHungerHearts };
     }

     // Check if at max hunger (with hidden hearts)
     const maxHunger = 100 + (this.stats.hiddenHungerHearts * 10);
     if (this.stats.hunger <= 0) {
       return {
         success: false,
         message: `${this.name} is full!`,
         disciplineOpportunity: 'refuse_food',
         tip: 'Try playing with them first to increase happiness!' 
       };
     }

     // Reduce hunger
     const oldHunger = this.stats.hunger;
     this.stats.hunger = Math.max(0, this.stats.hunger - amount);
    
     // Increase weight (+5g per meal)
     this.stats.weight += 5;

     // Recover some health and energy
     const healthGain = Math.min(30, this.stats.hunger * 1);
     const energyGain = Math.min(20, this.stats.hunger * 0.4);
     
     this.stats.health = Math.min(100, this.stats.health + healthGain);
     this.stats.energy = Math.min(100, this.stats.energy + energyGain);
    
     // Random chance to poop after feeding (50%)
     if (Math.random() < 0.5) {
       this.addPoop();
     }

     const hungerChange = oldHunger - this.stats.hunger;
     const weightChange = 5;
     
     // Adjust health and energy based on hunger recovery rate
     const healthGain = Math.min(30, hungerChange * 1);
     const energyGain = Math.min(20, hungerChange * 0.4);
     
     this.lastInteracted = Date.now();

     return {
       message: `${this.name} ate happily!`,
       statChanges: { hunger: hungerChange, weight: weightChange, health: healthGain, energy: energyGain },
       success: true
     };
  }

  /**
   * Give snack
   * Increases happiness but also increases hunger slightly and weight
   * 15+ snacks = cavity/sickness
   */
  giveSnack() {
    if (this.state.isSick) {
      return { success: false, message: `${this.name} is too sick for snacks.` };
    }

    if (this.state.isSleeping) {
      return { success: false, message: `${this.name} is sleeping.` };
    }

    this.stats.snacksEaten++;
    
    // Snacks increase happiness (+15)
    this.stats.happiness = Math.min(100, this.stats.happiness + 15);
    
    // But also increase hunger slightly (+5)
    this.stats.hunger = Math.min(100, this.stats.hunger + 5);
    
    // And weight (+2g)
    this.stats.weight += 2;
    
    // 15+ snacks = sickness (cavity)
    if (this.stats.snacksEaten >= 15) {
      this.makeSick('too_many_snacks');
      return {
        message: `${this.name} got a cavity from too many snacks!`,
        statChanges: { happiness: 15, hunger: 5, weight: 2 },
        success: true,
        becameSick: true
      };
    }
    
    this.lastInteracted = Date.now();
    
    return {
      message: `${this.name} enjoyed the snack!`,
      statChanges: { happiness: 15, hunger: 5, weight: 2 },
      success: true
    };
  }

  /**
   * Play with creature (mini-game)
   * Costs energy but increases happiness and decreases weight
   */
  play(gameType = 'default') {
    if (this.state.isSick) {
      return { success: false, message: `${this.name} is too sick to play.` };
    }

    if (this.state.isSleeping) {
      return { success: false, message: `${this.name} is sleeping.` };
    }

    const energyCost = 15;
    const happinessGain = 20;
    
    if (this.stats.energy < energyCost) {
      return {
        success: false,
        message: `${this.name} is too tired to play.`,
        disciplineOpportunity: 'refuse_play'
      };
    }
    
    this.stats.energy -= energyCost;
    this.stats.happiness = Math.min(100, this.stats.happiness + happinessGain);
    this.stats.hunger = Math.min(100, this.stats.hunger + 8);
    
    // Playing decreases weight (-3g)
    this.stats.weight = Math.max(5, this.stats.weight - 3);
    
    this.lastInteracted = Date.now();
    
    return {
      message: `You played with ${this.name}! They look happier.`,
      statChanges: { energy: -energyCost, happiness: happinessGain, hunger: 8, weight: -3 },
      success: true
    };
  }

  /**
   * Sleep action (for forced naps)
   * Increases energy significantly
   */
  sleep() {
    if (!this.state.isSleeping) {
      return { success: false, message: `${this.name} isn't tired yet.` };
    }

    const energyGain = 50;
    const hungerIncrease = 10;
    
    this.stats.energy = Math.min(100, this.stats.energy + energyGain);
    this.stats.hunger = Math.min(100, this.stats.hunger + hungerIncrease);
    this.lastInteracted = Date.now();
    
    return {
      message: `${this.name} is sleeping peacefully.`,
      statChanges: { energy: energyGain, hunger: hungerIncrease }
    };
  }

  /**
   * Give medicine
   * Cures sickness
   */
  giveMedicine() {
    if (!this.state.isSick) {
      return { 
        success: false, 
        message: `${this.name} isn't sick.`,
        disciplineOpportunity: 'unnecessary_medicine'
      };
    }

    this.state.isSick = false;
    this.state.lastSickAt = null;
    this.stats.health = Math.min(100, this.stats.health + 30);
    
    this.lastInteracted = Date.now();
    
    return {
      message: `${this.name} feels better!`,
      statChanges: { health: 30 },
      success: true
    };
  }

  /**
   * Clean up poop
   * Restores hygiene
   */
  cleanPoop(poopIndex = null) {
    if (this.poops.length === 0) {
      return { 
        success: false, 
        message: 'Nothing to clean.',
        disciplineOpportunity: 'unnecessary_cleaning'
      };
    }

    if (poopIndex !== null && poopIndex >= 0 && poopIndex < this.poops.length) {
      this.poops.splice(poopIndex, 1);
    } else {
      // Clean all poop
      this.poops = [];
    }
    
    // Restore hygiene
    this.stats.hygiene = Math.min(100, this.stats.hygiene + (20 * this.poops.length));
    
    this.lastInteracted = Date.now();
    
    return {
      message: 'All clean!',
      statChanges: { hygiene: 20 },
      success: true
    };
  }

  /**
   * Add poop to the screen
   * Called randomly after feeding or when hygiene is very low
   */
  addPoop() {
    if (this.poops.length >= 4) {
      // 5th poop = automatic sickness
      this.makeSick('too_much_poop');
      return;
    }
    
    this.poops.push({
      id: this.generateId(),
      createdAt: Date.now(),
      x: 50 + Math.random() * 500, // Random position on canvas
      y: 400 + Math.random() * 50
    });
    
    // Poop reduces hygiene
    this.stats.hygiene = Math.max(0, this.stats.hygiene - 25);
  }

  /**
   * Praise the creature (discipline)
   * Use when creature did something good
   */
  praise() {
    const activeCall = this.getActiveAttentionCall();
    
    if (!activeCall) {
      return { 
        success: false, 
        message: `${this.name} isn't looking for attention right now.`,
        disciplineOpportunity: 'unnecessary_praise'
      };
    }

    // Check if praise was appropriate
    if (activeCall.type === 'good_behavior' || activeCall.type === 'wake') {
      // Good - praise was appropriate
      this.stats.discipline = Math.min(10, this.stats.discipline + 1);
      this.stats.happiness = Math.min(100, this.stats.happiness + 5);
      this.resolveAttentionCall(activeCall.id, true);
      
      return {
        message: `${this.name} looks happy! Good job praising them.`,
        statChanges: { discipline: 1, happiness: 5 },
        success: true
      };
    } else {
      // Bad - should have scolded instead
      this.recordCareMistake('mental', 'wrong_discipline');
      this.resolveAttentionCall(activeCall.id, false);
      
      return {
        message: `${this.name} looks confused...`,
        statChanges: {},
        success: false
      };
    }
  }

  /**
   * Scold the creature (discipline)
   * Use when creature did something bad
   */
  scold() {
    const activeCall = this.getActiveAttentionCall();
    
    if (!activeCall) {
      return { 
        success: false, 
        message: `${this.name} isn't doing anything wrong right now.`,
        disciplineOpportunity: 'unnecessary_scold'
      };
    }

    // Check if scolding was appropriate
    if (activeCall.type === 'bad_behavior' || activeCall.type === 'refuse_food' || activeCall.type === 'refuse_play') {
      // Good - scolding was appropriate
      this.stats.discipline = Math.min(10, this.stats.discipline + 1);
      this.resolveAttentionCall(activeCall.id, true);
      
      return {
        message: `${this.name} understood!`,
        statChanges: { discipline: 1 },
        success: true
      };
    } else {
      // Bad - should have praised instead
      this.recordCareMistake('mental', 'wrong_discipline');
      this.stats.happiness = Math.max(0, this.stats.happiness - 10);
      this.resolveAttentionCall(activeCall.id, false);
      
      return {
        message: `${this.name} looks sad...`,
        statChanges: { happiness: -10 },
        success: false
      };
    }
  }

  /**
   * Trigger an attention call (random discipline/training opportunity)
   */
  maybeTriggerAttentionCall() {
    // 5% chance per tick to trigger attention call
    if (Math.random() < 0.05 && this.attentionCalls.length === 0) {
      const types = ['good_behavior', 'bad_behavior'];
      const type = types[Math.floor(Math.random() * types.length)];
      this.triggerAttentionCall(type);
    }
  }

  /**
   * Create an attention call
   */
  triggerAttentionCall(type) {
    const call = {
      id: this.generateId(),
      type: type,
      triggeredAt: Date.now(),
      expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
    };
    
    this.attentionCalls.push(call);
  }

  /**
   * Get currently active attention call
   */
  getActiveAttentionCall() {
    const now = Date.now();
    return this.attentionCalls.find(call => call.expiresAt > now);
  }

  /**
   * Check for expired attention calls and record care mistakes
   */
  checkExpiredAttentionCalls() {
    const now = Date.now();
    const expired = this.attentionCalls.filter(call => call.expiresAt <= now);
    
    expired.forEach(call => {
      // Record care mistake for each expired call
      if (call.type === 'good_behavior' || call.type === 'wake') {
        this.recordCareMistake('mental', 'missed_praise');
      } else {
        this.recordCareMistake('mental', 'missed_scold');
      }
    });
    
    // Remove expired calls
    this.attentionCalls = this.attentionCalls.filter(call => call.expiresAt > now);
  }

  /**
   * Resolve an attention call (responded to by player)
   */
  resolveAttentionCall(callId, success) {
    this.attentionCalls = this.attentionCalls.filter(call => call.id !== callId);
  }

  /**
   * Record a care mistake
   * Types: 'physical' (hunger, sickness, poop) or 'mental' (happiness, discipline)
   */
  recordCareMistake(category, type) {
    const mistake = {
      type: type,
      timestamp: Date.now(),
      stage: this.stage
    };
    
    this.careMistakes[category].push(mistake);
    this.careMistakes.total++;
  }

  /**
   * Get care quality tier (determines evolution outcomes)
   * Serious (best) -> Normal -> Naughty -> Frail -> Stubborn (worst)
   */
  getCareQualityTier() {
    const physicalMistakes = this.careMistakes.physical.length;
    const mentalMistakes = this.careMistakes.mental.length;
    const total = physicalMistakes + mentalMistakes;
    
    if (total <= 1) return 'serious';
    if (total === 2) return 'normal';
    if (mentalMistakes >= 2 && physicalMistakes < 2) return 'naughty';
    if (physicalMistakes >= 2 && mentalMistakes < 2) return 'frail';
    return 'stubborn';
  }

  /**
   * Check for sickness triggers
   */
  checkSicknessTriggers() {
    if (this.state.isSick || this.state.isDead) return;

    // Trigger 1: Too hungry for too long
    if (this.stats.hunger > 90 && this.stats.health < 30) {
      this.makeSick('hunger');
      return;
    }

    // Trigger 2: Too unhappy for too long
    if (this.stats.happiness < 10 && this.stats.health < 40) {
      this.makeSick('depression');
      return;
    }

    // Trigger 3: Very poor hygiene
    if (this.stats.hygiene < 5) {
      this.makeSick('dirty');
      return;
    }
  }

  /**
   * Make creature sick
   */
  makeSick(reason) {
    this.state.isSick = true;
    this.state.lastSickAt = Date.now();
    this.stats.sicknessCount++;
    
    // Record physical care mistake
    this.recordCareMistake('physical', reason);
    
    // Too many sicknesses = death
    if (this.stats.sicknessCount >= 4) {
      this.die('sickness');
    }
  }

  /**
   * Creature dies
   */
  die(reason) {
    this.state.isDead = true;
    this.state.diedAt = Date.now();
    this.personality.mood = 'dead';
  }

  /**
   * Check if creature can evolve
   */
  checkEvolution() {
    if (this.state.isDead || this.state.isSick) return null;

    const stages = ['egg', 'baby', 'child', 'teen', 'adult', 'elder'];
    const currentIndex = stages.indexOf(this.stage);
    
    if (currentIndex >= stages.length - 1) return null;
    
    const nextStage = stages[currentIndex + 1];
    
    // Evolution requirements based on care quality tier
    const tier = this.getCareQualityTier();
    const requirements = {
      egg: { minAge: 0, minHappiness: 0 },
      baby: { 
        serious: { minAge: 0.1, minHappiness: 30, minDiscipline: 2 },
        normal: { minAge: 0.1, minHappiness: 30, minDiscipline: 1 },
        naughty: { minAge: 0.1, minHappiness: 20, minDiscipline: 0 },
        frail: { minAge: 0.1, minHappiness: 20, minDiscipline: 0 },
        stubborn: { minAge: 0.1, minHappiness: 10, minDiscipline: 0 }
      },
      child: { 
        serious: { minAge: 1, minHappiness: 50, minDiscipline: 4 },
        normal: { minAge: 1, minHappiness: 50, minDiscipline: 2 },
        naughty: { minAge: 1, minHappiness: 40, minDiscipline: 1 },
        frail: { minAge: 1, minHappiness: 40, minDiscipline: 1 },
        stubborn: { minAge: 1, minHappiness: 30, minDiscipline: 0 }
      },
      teen: { 
        serious: { minAge: 3, minHappiness: 60, minDiscipline: 6 },
        normal: { minAge: 3, minHappiness: 60, minDiscipline: 4 },
        naughty: { minAge: 3, minHappiness: 50, minDiscipline: 2 },
        frail: { minAge: 3, minHappiness: 50, minDiscipline: 2 },
        stubborn: { minAge: 3, minHappiness: 40, minDiscipline: 0 }
      },
      adult: { 
        serious: { minAge: 7, minHappiness: 70, minDiscipline: 8 },
        normal: { minAge: 7, minHappiness: 70, minDiscipline: 6 },
        naughty: { minAge: 7, minHappiness: 60, minDiscipline: 4 },
        frail: { minAge: 7, minHappiness: 60, minDiscipline: 4 },
        stubborn: { minAge: 7, minHappiness: 50, minDiscipline: 0 }
      }
    };
    
    const req = requirements[nextStage][tier];
    
    if (this.stats.age >= req.minAge && 
        this.stats.happiness >= req.minHappiness &&
        this.stats.discipline >= req.minDiscipline) {
      return { stage: nextStage, tier: tier };
    }
    
    return null;
  }

  /**
   * Evolve to next stage
   */
  evolve(evolution) {
    const { stage: newStage, tier } = evolution;
    const oldStage = this.stage;
    this.stage = newStage;
    
    this.evolutionHistory.push({
      from: oldStage,
      to: newStage,
      tier: tier,
      timestamp: Date.now()
    });
    
    // Reset care mistakes for next stage (optional - vintage Tamagotchis carried them over)
    // this.careMistakes = { physical: [], mental: [], total: 0 };
    
    return {
      message: `${this.name} evolved into a ${tier} ${newStage}!`,
      newStage: newStage,
      tier: tier
    };
  }

  /**
   * Get creature's current status for UI
   */
  getStatus() {
    if (this.state.isDead) return 'dead';
    if (this.state.isSick) return 'sick';
    if (this.state.isSleeping) return 'sleeping';
    if (this.stats.hunger > 80) return 'hungry';
    if (this.stats.happiness < 30) return 'unhappy';
    if (this.stats.hygiene < 30) return 'dirty';
    if (this.getActiveAttentionCall()) return 'attention';
    return 'happy';
  }

  /**
   * Serialize to JSON for storage
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      stage: this.stage,
      stats: { ...this.stats },
      state: { ...this.state },
      careMistakes: {
        physical: [...this.careMistakes.physical],
        mental: [...this.careMistakes.mental],
        total: this.careMistakes.total
      },
      attentionCalls: [...this.attentionCalls],
      poops: [...this.poops],
      appearance: { ...this.appearance },
      personality: { ...this.personality },
      createdAt: this.createdAt,
      lastInteracted: this.lastInteracted,
      evolutionHistory: [...this.evolutionHistory],
      sleepSchedule: { ...this.sleepSchedule }
    };
  }
}

module.exports = Creature;
