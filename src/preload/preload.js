/**
 * Preload Script - Secure bridge between main and renderer processes
 * 
 * DESIGN DECISIONS:
 * 
 * 1. CONTEXT ISOLATION:
 *    - Uses contextBridge to expose APIs to renderer
 *    - Renderer cannot access Node.js or Electron directly
 *    - Only whitelisted functions are available
 *    
 *    Rationale: Security best practice. Prevents renderer from
 *    accessing dangerous APIs while still allowing communication.
 * 
 * 2. API EXPOSURE:
 *    - Grouped by domain: AI, Game, Mini-games, Settings
 *    - Simple function signatures that wrap IPC calls
 *    - Event listeners for server-push notifications
 *    
 *    Rationale: Clean API surface that's easy to use in renderer.
 *    Event listeners allow main process to push updates without polling.
 * 
 * 3. ACTION TYPES:
 *    - feed, snack: Feeding actions
 *    - play: General play (and mini-games via separate API)
 *    - medicine, clean, lights: Care actions
 *    - praise, scold: Discipline actions
 *    
 *    Rationale: These map directly to Creature class methods
 *    and cover all Tamagotchi care activities.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // AI OPERATIONS
  // =============
  generateCreatureFromEgg: (eggType) => ipcRenderer.invoke('ai:generate-from-egg', eggType),
  checkLMStudio: () => ipcRenderer.invoke('ai:check-connection'),
  
  // GAME OPERATIONS
  // ===============
  saveCreature: (creature) => ipcRenderer.invoke('game:save', creature),
  loadCreature: () => ipcRenderer.invoke('game:load'),
  performAction: (action, params) => ipcRenderer.invoke('game:perform-action', action, params),
  
  // MINI-GAMES
  // ==========
  playMiniGame: (gameType, playerInput) => ipcRenderer.invoke('game:play-mini-game', gameType, playerInput),
  
  // SETTINGS
  // ========
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (settings) => ipcRenderer.invoke('settings:set', settings),
  
  // EVENT LISTENERS (Server-push notifications)
  // ===========================================
  
  /**
   * Listen for creature stat updates
   */
  onCreatureUpdate: (callback) => {
    ipcRenderer.on('creature:update', (event, creature) => callback(creature));
  },
  
  /**
   * Listen for evolution events
   */
  onCreatureEvolution: (callback) => {
    ipcRenderer.on('creature:evolution', (event, data) => callback(data));
  },
  
  /**
   * Listen for death events
   */
  onCreatureDeath: (callback) => {
    ipcRenderer.on('creature:death', (event, data) => callback(data));
  },
  
  /**
   * Listen for attention calls (discipline/training opportunities)
   */
  onCreatureAttention: (callback) => {
    ipcRenderer.on('creature:attention', (event, data) => callback(data));
  },
  
  /**
   * Remove all listeners (cleanup)
   */
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('creature:update');
    ipcRenderer.removeAllListeners('creature:evolution');
    ipcRenderer.removeAllListeners('creature:death');
    ipcRenderer.removeAllListeners('creature:attention');
  }
});
