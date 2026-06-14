/**
 * Main Process - Electron main entry point for AI Pet Sim
 * 
 * DESIGN DECISIONS:
 * 
 * 1. IPC HANDLER STRUCTURE:
 *    - Separated by domain: AI operations, Game operations, Mini-games, Settings
 *    - All game actions return creature.toJSON() for UI consistency
 *    - Error handling with try-catch in each handler
 *    
 *    Rationale: Clean separation of concerns makes the code maintainable
 *    and allows for easy addition of new actions.
 * 
 * 2. ACTION ROUTING:
 *    - Single 'game:perform-action' channel with action parameter
 *    - Supports: feed, snack, play, medicine, clean, lights, praise, scold
 *    - Each action maps to Creature method
 *    
 *    Rationale: Reduces IPC channel proliferation. One channel with
 *    action types is cleaner than separate channels for each action.
 * 
 * 3. MINI-GAMES:
 *    - Separate IPC channel 'game:play-mini-game'
 *    - Games run entirely in main process (logic)
 *    - Results affect creature stats
 *    
 *    Rationale: Mini-games need to modify creature state, so they
 *    must run in main process where Creature instances live.
 * 
 * 4. SYSTEM TRAY:
 *    - App minimizes to tray instead of closing
 *    - Background game loop continues running
 *    - System notifications for important events
 *    
 *    Rationale: Tamagotchi pets should live even when window is hidden.
 *    Tray allows players to "pocket" their pet like a real device.
 * 
 * 5. WINDOW MANAGEMENT:
 *    - ContextIsolation enabled for security
 *    - Preload script bridges main/renderer
 *    - Window hides on close (doesn't quit)
 *    
 *    Rationale: Security best practice (ContextIsolation) plus
 *    user experience (don't kill pet when closing window).
 */

// Suppress EPIPE errors when stdout/stderr has no terminal attached (common on Windows)
process.stdout.on('error', (err) => { if (err.code !== 'EPIPE') throw err; });
process.stderr.on('error', (err) => { if (err.code !== 'EPIPE') throw err; });

const { app, BrowserWindow, Tray, Menu, ipcMain, Notification } = require('electron');
const path = require('path');
const LMStudioService = require('./services/LMStudioService');
const CreatureManager = require('./game/CreatureManager');
const FileStorage = require('./storage/FileStorage');
const GameLoop = require('./game/GameLoop');

class MainProcess {
  constructor() {
    this.mainWindow = null;
    this.tray = null;
    this.lmStudio = new LMStudioService();
    this.storage = new FileStorage();
    this.creatureManager = new CreatureManager(this.storage);
    this.gameLoop = new GameLoop(this.creatureManager);
  }

  async initialize() {
    await app.whenReady();
    // Setup IPC handlers FIRST before creating window
    // so they're ready when renderer loads
    this.setupIPC();
    this.createWindow();
    this.createTray();
    this.gameLoop.start();
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        enableRemoteModule: false
      }
    });

    this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    this.mainWindow.on('close', (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        this.mainWindow.hide();
      }
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  /**
   * Create system tray icon and menu
   */
  createTray() {
    try {
      const iconPath = path.join(__dirname, '../../assets/icon.png');
      this.tray = new Tray(iconPath);

      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Show App',
          click: () => {
            if (this.mainWindow) {
              this.mainWindow.show();
            }
          }
        },
        {
          label: 'Quit',
          click: () => {
            app.isQuiting = true;
            app.quit();
          }
        }
      ]);

      this.tray.setToolTip('AI Pet Sim');
      this.tray.setContextMenu(contextMenu);

      this.tray.on('click', () => {
        if (this.mainWindow) {
          this.mainWindow.isVisible() ? this.mainWindow.hide() : this.mainWindow.show();
        }
      });
    } catch (error) {
      console.warn('Failed to create tray icon:', error.message);
      console.log('Continuing without system tray...');
    }
  }

  setupIPC() {
    // AI OPERATIONS
    // ============= 

    /**
     * Generate creature from egg type using LM Studio AI
     */
    ipcMain.handle('ai:generate-from-egg', async (event, eggType) => {
      try {
        return await this.lmStudio.generateCreatureFromEgg(eggType);
      } catch (error) {
        console.error('Failed to generate creature from egg:', error.message);

        // Provide user-friendly error message
        const errorMessage = error.message.includes('LM Studio') ?
          'Could not connect to AI service. Please check LM Studio is running.' :
          'Error generating your pet. Try again later.';

        throw new Error(errorMessage);
      }
    });

    /**
     * Check LM Studio connection status
     */
    ipcMain.handle('ai:check-connection', async () => {
      try {
        return await this.lmStudio.checkConnection();
      } catch (error) {
        console.error('Failed to check LM Studio connection:', error.message);

        // Provide user-friendly error message
        throw new Error('Could not connect to AI service. Please ensure LM Studio is running.');
      }
    });

    // GAME OPERATIONS
    // ===============

    /**
     * Save creature data to storage
     */
    ipcMain.handle('game:save', async (event, creatureData) => {
      return await this.creatureManager.saveCreature(creatureData);
    });

    /**
     * Load current creature from storage
     */
    ipcMain.handle('game:load', async () => {
      const creature = await this.creatureManager.getCurrentCreature();
      return creature ? creature.toJSON() : null;
    });

    /**
     * Perform game actions on creature
     * Actions: create, feed, snack, play, medicine, clean, lights, praise, scold
     */
    ipcMain.handle('game:perform-action', async (event, action, params) => {
      try {
        // Handle create action first (doesn't require existing creature)
        if (action === 'create') {
          const creature = await this.creatureManager.createCreature(params);
          return creature.toJSON();
        }

        const creature = await this.creatureManager.getCurrentCreature();
        if (!creature) return null;

        let result;

        switch (action) {
          // FEEDING
          case 'feed':
            result = creature.feed(params?.amount || 20);
            break;

          case 'snack':
            result = creature.giveSnack();
            break;

          // PLAYING
          case 'play':
            result = creature.play(params?.gameType);
            break;

          // CARE
          case 'medicine':
            result = creature.giveMedicine();
            break;

          case 'clean':
            result = creature.cleanPoop(params?.poopIndex);
            break;

          case 'lights':
            result = creature.toggleLights();
            break;

          // DISCIPLINE
          case 'praise':
            result = creature.praise();
            break;

          case 'scold':
            result = creature.scold();
            break;

          default:
            console.warn('Unknown action:', action);
            return null;
        }

        // Save creature after action
        await this.creatureManager.saveCreature(creature);

        // Return updated creature with action result
        return {
          ...creature.toJSON(),
          actionResult: result
        };
      } catch (error) {
        console.error('Action failed:', error);
        throw error;
      }
    });

    // MINI-GAMES
    // ==========

    /**
     * Play a mini-game and return results
     * Games: 'guess-direction', 'high-low'
     */
    ipcMain.handle('game:play-mini-game', async (event, gameType, playerInput) => {
      try {
        const creature = await this.creatureManager.getCurrentCreature();
        if (!creature) return null;

        let gameResult;

        switch (gameType) {
          case 'guess-direction':
            gameResult = this.playGuessDirectionGame(creature, playerInput);
            break;

          case 'high-low':
            gameResult = this.playHighLowGame(creature, playerInput);
            break;

          default:
            return { success: false, message: 'Unknown game type' };
        }

        // Apply game results to creature
        if (gameResult.success) {
          creature.stats.happiness = Math.min(100, creature.stats.happiness + gameResult.happinessGain);
          creature.stats.weight = Math.max(5, creature.stats.weight + gameResult.weightChange);
          creature.stats.hunger = Math.min(100, creature.stats.hunger + 5);
          creature.lastInteracted = Date.now();

          await this.creatureManager.saveCreature(creature);
        }

        return {
          ...gameResult,
          creature: creature.toJSON()
        };
      } catch (error) {
        console.error('Mini-game error:', error);
        throw error;
      }
    });

    // SETTINGS
    // ========

    ipcMain.handle('settings:get', async () => {
      return await this.storage.read('settings') || {};
    });

    ipcMain.handle('settings:set', async (event, settings) => {
      await this.storage.write('settings', settings);
      return settings;
    });
  }

  /**
   * Mini-Game: Guess the Direction
   * Pet jumps left or right, player guesses
   */
  playGuessDirectionGame(creature, playerGuess) {
    // Pet randomly chooses left or right
    const directions = ['left', 'right'];
    const petChoice = directions[Math.floor(Math.random() * directions.length)];

    const success = playerGuess === petChoice;

    return {
      success: success,
      petChoice: petChoice,
      message: success ?
        `Correct! ${creature.name} jumped ${petChoice}!` :
        `Wrong! ${creature.name} jumped ${petChoice}!`,
      happinessGain: success ? 15 : 5,
      weightChange: -3, // Playing decreases weight
    };
  }

  /**
   * Mini-Game: High or Low
   * Guess if next number is higher or lower than current
   */
  playHighLowGame(creature, playerGuess) {
    // Generate random numbers 1-10
    const currentNumber = Math.floor(Math.random() * 10) + 1;
    const nextNumber = Math.floor(Math.random() * 10) + 1;

    // Determine actual result
    const actualResult = nextNumber > currentNumber ? 'high' : 'low';

    const success = playerGuess === actualResult;

    return {
      success: success,
      currentNumber: currentNumber,
      nextNumber: nextNumber,
      message: success ?
        `Correct! ${currentNumber} → ${nextNumber} is ${actualResult}!` :
        `Wrong! ${currentNumber} → ${nextNumber} is ${actualResult}!`,
      happinessGain: success ? 20 : 5,
      weightChange: -3,
    };
  }
}

const mainProcess = new MainProcess();
mainProcess.initialize();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainProcess.mainWindow === null) {
    mainProcess.createWindow();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
  if (mainProcess.gameLoop) {
    mainProcess.gameLoop.stop();
  }
});
