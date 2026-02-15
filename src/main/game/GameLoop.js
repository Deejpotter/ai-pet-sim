/**
 * GameLoop.js - Background game loop for continuous creature updates
 * 
 * DESIGN DECISIONS:
 * 
 * 1. TICK INTERVAL (1 minute):
 *    - Runs every minute to update creature stats
 *    - Fast enough to feel responsive, slow enough for performance
 *    - Tamagotchi-style stat decay happens per-minute
 *    
 *    Rationale: Balances real-time feel with resource usage.
 *    Shorter intervals would be unnecessary; longer would feel unresponsive.
 * 
 * 2. DELTA TIME CALCULATION:
 *    - Calculates actual minutes since last interaction
 *    - Handles app being minimized or computer sleeping
 *    - Applies stat decay based on real elapsed time
 *    
 *    Rationale: Ensures creature continues to live even when app
 *    is not visible. This is core to the Tamagotchi concept of
 *    "always-on" virtual pets.
 * 
 * 3. EVOLUTION CHECKS:
 *    - Checks evolution eligibility on every tick
 *    - Uses care quality tier from Creature class
 *    - Sends system notification on evolution
 *    
 *    Rationale: Evolutions should happen as soon as requirements
 *    are met, not at fixed intervals. Care quality makes evolution
 *    feel earned.
 * 
 * 4. NOTIFICATION SYSTEM:
 *    - System notifications for major events (evolution, death)
 *    - IPC messages to renderer for UI updates
 *    - Handles multiple windows
 *    
 *    Rationale: Players need to know about important events even
 *    when app is minimized to system tray.
 * 
 * 5. ERROR HANDLING:
 *    - Try-catch around entire tick
 *    - Continues running even if one tick fails
 *    - Logs errors for debugging
 *    
 *    Rationale: Background loop must be resilient. One bad tick
 *    shouldn't crash the entire game.
 */

const { BrowserWindow, Notification } = require('electron');

class GameLoop {
  constructor(creatureManager, interval = 60000) {
    this.creatureManager = creatureManager;
    this.interval = interval; // 1 minute default
    this.intervalId = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.tick(); // Run immediately

    this.intervalId = setInterval(() => {
      this.tick();
    }, this.interval);

    console.log('Game loop started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Game loop stopped');
  }

  async tick() {
    try {
      const creature = await this.creatureManager.getCurrentCreature();
      if (!creature) return;

      const now = Date.now();
      const deltaMs = now - creature.lastInteracted;
      const deltaMinutes = deltaMs / (1000 * 60);

      // Only update if at least 1 minute has passed
      if (deltaMinutes >= 1) {
        // Update creature stats (includes sleep state, sickness checks, etc.)
        creature.updateStats(deltaMinutes);

        // Check for evolution
        const evolution = creature.checkEvolution();
        if (evolution) {
          const result = creature.evolve(evolution);
          this.notifyEvolution(creature, result);
        }

        // Check for death
        if (creature.state.isDead && !creature.notifiedDeath) {
          creature.notifiedDeath = true;
          this.notifyDeath(creature);
        }

        // Check for attention calls that need player response
        const activeCall = creature.getActiveAttentionCall();
        if (activeCall && !creature.notifiedAttention) {
          creature.notifiedAttention = true;
          this.notifyAttention(creature, activeCall);
        } else if (!activeCall) {
          creature.notifiedAttention = false;
        }

        // Save creature state
        await this.creatureManager.saveCreature(creature);
        
        // Notify renderer of update
        this.notifyRenderer('creature:update', creature.toJSON());
      }
    } catch (error) {
      console.error('Game loop error:', error);
    }
  }

  /**
   * Send system notification for evolution event
   */
  notifyEvolution(creature, result) {
    const notification = new Notification({
      title: 'Evolution!',
      body: result.message,
      icon: './assets/icon.png'
    });

    notification.show();
    
    // Also notify renderer
    this.notifyRenderer('creature:evolution', {
      creature: creature.toJSON(),
      result: result
    });
  }

  /**
   * Send system notification for death event
   */
  notifyDeath(creature) {
    const notification = new Notification({
      title: 'R.I.P.',
      body: `${creature.name} has passed away...`,
      icon: './assets/icon.png'
    });

    notification.show();
    
    this.notifyRenderer('creature:death', {
      creature: creature.toJSON()
    });
  }

  /**
   * Send system notification for attention call
   */
  notifyAttention(creature, call) {
    let body = `${creature.name} wants your attention!`;
    
    if (call.type === 'good_behavior') {
      body = `${creature.name} did something good! Praise them?`;
    } else if (call.type === 'bad_behavior') {
      body = `${creature.name} is misbehaving! Scold them?`;
    } else if (call.type === 'wake') {
      body = `${creature.name} woke up!`;
    }

    const notification = new Notification({
      title: 'Attention!',
      body: body,
      icon: './assets/icon.png'
    });

    notification.show();
    notification.on('click', () => {
      // Show main window when notification clicked
      const windows = BrowserWindow.getAllWindows();
      windows.forEach(window => {
        if (!window.isDestroyed()) {
          window.show();
          window.focus();
        }
      });
    });
    
    this.notifyRenderer('creature:attention', {
      creature: creature.toJSON(),
      call: call
    });
  }

  /**
   * Send message to all renderer windows
   */
  notifyRenderer(channel, data) {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.webContents.send(channel, data);
      }
    });
  }
}

module.exports = GameLoop;
