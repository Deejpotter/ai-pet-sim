/**
 * app.js - React-based renderer for AI Pet Sim
 * 
 * DESIGN DECISIONS:
 * 
 * 1. COMPONENT ARCHITECTURE:
 *    - Functional components with React hooks
 *    - Separation of concerns: PixiApp (graphics), UI components (React)
 *    - State lifted to App component for shared access
 *    
 *    Rationale: React handles UI state efficiently, PixiJS handles
 *    graphics. Separating them keeps both clean and performant.
 * 
 * 2. PIXIJS INTEGRATION:
 *    - PixiApp class wraps PixiJS Application
 *    - Draws creature based on appearance data
 *    - Handles animations via ticker
 *    
 *    Rationale: PixiApp is a thin wrapper that translates creature
 *    state to visual representation. Animation logic lives here.
 * 
 * 3. STATE MANAGEMENT:
 *    - Local React state for UI (creature, loading, cooldowns)
 *    - Electron IPC for persistent state (creature saved to disk)
 *    - Real-time updates via IPC events from main process
 *    
 *    Rationale: React state for responsive UI, IPC for persistence.
 *    Events allow background updates to reflect immediately in UI.
 * 
 * 4. COOLDOWN SYSTEM:
 *    - Visual cooldown indicators on action buttons
 *    - Prevents spam while allowing strategic timing
 *    
 *    Rationale: Cooldowns create pacing and prevent players from
 *    just spamming actions. Makes care feel more deliberate.
 * 
 * 5. MINI-GAMES:
 *    - Modal overlay for games
 *    - Simple guessing games (Tamagotchi-inspired)
 *    - Rewards affect creature stats
 *    
 *    Rationale: Mini-games provide active engagement and break up
 *    the routine care loop. Simple games fit the Tamagotchi aesthetic.
 */

const { useState, useEffect, useRef } = React;

// ==========================================
// PIXIJS GRAPHICS WRAPPER
// ==========================================

class PixiApp {
  constructor(container) {
    this.app = new PIXI.Application({
      width: 600,
      height: 500,
      backgroundColor: 0x1a1a2e,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    
    container.appendChild(this.app.view);
    
    // Create main container for creature
    this.creatureContainer = new PIXI.Container();
    this.creatureContainer.x = 300;
    this.creatureContainer.y = 250;
    this.app.stage.addChild(this.creatureContainer);
    
    // Poop container (separate so poop stays on ground)
    this.poopContainer = new PIXI.Container();
    this.app.stage.addChild(this.poopContainer);
    
    // Animation ticker
    this.time = 0;
    this.app.ticker.add((delta) => {
      this.time += 0.05 * delta;
      this.updateAnimations();
    });
    
    this.creatureGraphics = null;
    this.creatureData = null;
    this.statusEffects = {};
  }

  /**
   * Draw creature based on appearance data and current state
   */
  drawCreature(data) {
    this.creatureData = data;
    this.creatureContainer.removeChildren();
    this.poopContainer.removeChildren();
    
    const { appearance, state, stats, poops } = data;
    const baseColor = parseInt(appearance.baseColor.replace('#', ''), 16);
    const glowColor = parseInt(appearance.glowColor.replace('#', ''), 16);
    
    // Create container for creature parts
    const container = new PIXI.Container();
    
    // Draw poop on screen
    if (poops && poops.length > 0) {
      poops.forEach((poop, index) => {
        this.drawPoop(poop, index);
      });
    }
    
    // Sleep effect (dimmed if sleeping)
    if (state.isSleeping) {
      container.alpha = 0.6;
    }
    
    // Sickness effect (grayed out, X_X eyes)
    if (state.isSick) {
      container.alpha = 0.7;
    }
    
    // Glow effect (using multiple circles with blur)
    if (!state.isSick && !state.isDead) {
      const glow = new PIXI.Graphics();
      glow.beginFill(glowColor, 0.3);
      
      // Size based on weight
      const radiusMultiplier = 1 + (stats.weight / 100);
      glow.drawCircle(0, 0, appearance.radius * 1.5 * radiusMultiplier);
      glow.endFill();
      glow.filters = [new PIXI.filters.BlurFilter(20)];
      container.addChild(glow);
    }
    
    // Main body
    const body = new PIXI.Graphics();
    
    // Color adjustments for state
    let bodyColor = baseColor;
    if (state.isSick) bodyColor = 0x888888; // Gray when sick
    if (state.isDead) bodyColor = 0x444444; // Dark gray when dead
    
    body.beginFill(bodyColor);
    
    // Size based on weight
    const radiusMultiplier = 1 + (stats.weight / 100);
    const radius = appearance.radius * radiusMultiplier;
    
    if (appearance.shape === 'circle') {
      body.drawCircle(0, 0, radius);
    } else if (appearance.shape === 'blob') {
      this.drawBlob(body, radius);
    } else {
      body.drawEllipse(0, 0, radius, radius * 0.8);
    }
    
    body.endFill();
    container.addChild(body);
    
    // Draw eyes (X_X if sick/dead, normal otherwise)
    if (appearance.eyeCount > 0) {
      const eyeSpacing = radius * 0.4;
      const startX = -(appearance.eyeCount - 1) * eyeSpacing / 2;
      
      for (let i = 0; i < appearance.eyeCount; i++) {
        const eyeX = startX + i * eyeSpacing;
        const eyeY = -radius * 0.2;
        
        if (state.isSick || state.isDead) {
          // X_X eyes for sick/dead
          this.drawDeadEyes(container, eyeX, eyeY);
        } else {
          // Normal eyes
          this.drawNormalEyes(container, eyeX, eyeY);
        }
      }
    }
    
    // Draw tentacles
    if (appearance.tentacles > 0 && !state.isDead) {
      for (let i = 0; i < appearance.tentacles; i++) {
        const angle = (i / appearance.tentacles) * Math.PI * 2;
        const tentacle = this.createTentacle(angle, radius, baseColor);
        container.addChild(tentacle);
      }
    }
    
    // Status icons above creature
    this.drawStatusIcons(container, data, radius);
    
    this.creatureContainer.addChild(container);
    this.creatureGraphics = container;
  }

  drawPoop(poopData, index) {
    const poop = new PIXI.Graphics();
    poop.beginFill(0x8B4513); // Brown
    
    // Draw poop emoji-like shape
    const x = poopData.x || (50 + index * 100);
    const y = poopData.y || 450;
    
    poop.drawCircle(x, y, 15);
    poop.drawCircle(x + 5, y - 10, 12);
    poop.drawCircle(x + 3, y - 18, 10);
    poop.endFill();
    
    // Detail lines
    poop.lineStyle(2, 0x5D3A1A);
    poop.moveTo(x - 5, y + 5);
    poop.lineTo(x + 5, y + 5);
    
    this.poopContainer.addChild(poop);
  }

  drawNormalEyes(container, x, y) {
    const eye = new PIXI.Graphics();
    eye.beginFill(0xFFFFFF);
    eye.drawCircle(x, y, 8);
    eye.endFill();
    
    // Pupil
    eye.beginFill(0x000000);
    eye.drawCircle(x, y, 4);
    eye.endFill();
    
    container.addChild(eye);
  }

  drawDeadEyes(container, x, y) {
    const eyeContainer = new PIXI.Container();
    
    // White of eye
    const white = new PIXI.Graphics();
    white.beginFill(0xFFFFFF);
    white.drawCircle(x, y, 8);
    white.endFill();
    eyeContainer.addChild(white);
    
    // X shape
    const xShape = new PIXI.Graphics();
    xShape.lineStyle(2, 0x000000);
    xShape.moveTo(x - 4, y - 4);
    xShape.lineTo(x + 4, y + 4);
    xShape.moveTo(x + 4, y - 4);
    xShape.lineTo(x - 4, y + 4);
    eyeContainer.addChild(xShape);
    
    container.addChild(eyeContainer);
  }

  drawStatusIcons(container, data, radius) {
    const { state, attentionCalls } = data;
    let iconY = -radius - 40;
    
    // Sleeping Zzz
    if (state.isSleeping) {
      this.drawZzz(container, 0, iconY);
      iconY -= 25;
    }
    
    // Sick skull
    if (state.isSick) {
      this.drawSkull(container, 0, iconY);
      iconY -= 25;
    }
    
    // Attention icon
    if (attentionCalls && attentionCalls.length > 0) {
      this.drawAttentionIcon(container, 0, iconY);
      iconY -= 25;
    }
    
    // Lights indicator
    if (state.isSleeping && state.lightsOn) {
      this.drawLightBulb(container, 0, iconY, true);
    }
  }

  drawZzz(container, x, y) {
    const text = new PIXI.Text('Zzz', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0x88CCFF
    });
    text.x = x - 15;
    text.y = y;
    container.addChild(text);
  }

  drawSkull(container, x, y) {
    const skull = new PIXI.Graphics();
    skull.beginFill(0xFFFFFF);
    skull.drawCircle(x, y + 10, 12);
    skull.endFill();
    
    // Eyes
    skull.beginFill(0x000000);
    skull.drawCircle(x - 4, y + 8, 3);
    skull.drawCircle(x + 4, y + 8, 3);
    skull.endFill();
    
    container.addChild(skull);
  }

  drawAttentionIcon(container, x, y) {
    const icon = new PIXI.Graphics();
    icon.beginFill(0xFFAA00);
    icon.drawCircle(x, y + 10, 15);
    icon.endFill();
    
    // Exclamation mark
    const text = new PIXI.Text('!', {
      fontFamily: 'Arial',
      fontSize: 20,
      fill: 0x000000,
      fontWeight: 'bold'
    });
    text.x = x - 4;
    text.y = y;
    
    container.addChild(icon);
    container.addChild(text);
  }

  drawLightBulb(container, x, y, isOn) {
    const bulb = new PIXI.Graphics();
    bulb.beginFill(isOn ? 0xFFFF00 : 0x666666);
    bulb.drawCircle(x, y + 10, 10);
    bulb.endFill();
    container.addChild(bulb);
  }

  drawBlob(graphics, radius) {
    const points = [];
    const segments = 12;
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const variation = 0.9 + Math.random() * 0.2;
      const r = radius * variation;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      points.push({ x, y });
    }
    
    graphics.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      graphics.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    
    graphics.closePath();
  }

  createTentacle(angle, radius, color) {
    const tentacle = new PIXI.Graphics();
    const length = radius * 0.8;
    const startX = Math.cos(angle) * radius;
    const startY = Math.sin(angle) * radius;
    const endX = Math.cos(angle) * (radius + length);
    const endY = Math.sin(angle) * (radius + length);
    
    tentacle.lineStyle(6, color, 0.8);
    tentacle.moveTo(startX, startY);
    tentacle.lineTo(endX, endY);
    
    tentacle.baseAngle = angle;
    
    return tentacle;
  }

  updateAnimations() {
    if (!this.creatureGraphics || !this.creatureData) return;
    
    const { state } = this.creatureData;
    
    if (state.isDead) {
      // No animation when dead
      return;
    }
    
    if (state.isSick) {
      // Slow, weak animation when sick
      const scale = 1 + Math.sin(this.time * 0.3) * 0.01;
      this.creatureGraphics.scale.set(scale);
      return;
    }
    
    if (state.isSleeping) {
      // Gentle breathing when sleeping
      const scale = 1 + Math.sin(this.time * 0.2) * 0.02;
      this.creatureGraphics.scale.set(scale);
      return;
    }
    
    // Normal happy bouncing
    const scale = 1 + Math.sin(this.time) * 0.03;
    this.creatureGraphics.scale.set(scale);
    this.creatureGraphics.y = Math.sin(this.time * 0.5) * 5;
  }

  destroy() {
    this.app.destroy(true);
  }
}

// ==========================================
// UI COMPONENTS
// ==========================================

function EggSelection({ onSelectEgg, loading, connected }) {
  const eggs = [
    { id: 'mystic', name: 'Mystic Egg', color: '#8B5CF6', description: 'Ancient and mysterious' },
    { id: 'nature', name: 'Nature Egg', color: '#22C55E', description: 'Life and growth' },
    { id: 'fire', name: 'Fire Egg', color: '#EF4444', description: 'Passion and energy' },
    { id: 'water', name: 'Water Egg', color: '#3B82F6', description: 'Fluid and adaptive' },
    { id: 'shadow', name: 'Shadow Egg', color: '#6B7280', description: 'Dark and enigmatic' },
    { id: 'light', name: 'Light Egg', color: '#EAB308', description: 'Bright and pure' }
  ];

  return (
    <div className="welcome-screen">
      <h2>Choose Your Egg</h2>
      <p>Select an egg to hatch your creature!</p>
      
      <div className="egg-grid">
        {eggs.map((egg) => (
          <button
            key={egg.id}
            className="egg-card"
            onClick={() => onSelectEgg(egg)}
            disabled={loading || !connected}
            style={{ '--egg-color': egg.color }}
          >
            <div className="egg-visual">
              <div className="egg-shape" style={{ background: egg.color }} />
            </div>
            <div className="egg-name">{egg.name}</div>
            <div className="egg-description">{egg.description}</div>
          </button>
        ))}
      </div>
      
      {loading && (
        <div className="loading-overlay">
          <span className="loading">
            <span className="spinner" />
            Hatching egg...
          </span>
        </div>
      )}
      
      {!connected && (
        <p className="connection-message">
          Please start LM Studio and load a model first.
        </p>
      )}
    </div>
  );
}

function StatBar({ label, value, max = 100, color, icon }) {
  const percentage = (value / max) * 100;
  
  return (
    <div className="stat-bar">
      <div className="stat-label">
        <span>{icon} {label}</span>
        <span>{Math.round(value)}{max !== 100 && `/${max}`}</span>
      </div>
      <div className="stat-track">
        <div 
          className="stat-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
}

function ActionButton({ onClick, disabled, icon, label, cooldown, variant = 'primary' }) {
  return (
    <button 
      className={`action-btn ${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon} {label}
      {cooldown > 0 && (
        <span className="cooldown-overlay" style={{ width: `${cooldown}%` }} />
      )}
    </button>
  );
}

function MiniGameModal({ game, onPlay, onClose, creature }) {
  const [result, setResult] = useState(null);
  
  const handlePlay = async (input) => {
    const gameResult = await window.electronAPI.playMiniGame(game, input);
    setResult(gameResult);
    
    if (gameResult.creature) {
      onPlay(gameResult.creature);
    }
  };
  
  if (result) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h3>{result.success ? 'Correct!' : 'Wrong!'}</h3>
          <p>{result.message}</p>
          {result.success && (
            <p className="reward">
              +{result.happinessGain} happiness, {result.weightChange}g weight
            </p>
          )}
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{game === 'guess-direction' ? 'Guess the Direction!' : 'High or Low?'}</h3>
        <p>
          {game === 'guess-direction' 
            ? 'Which way will ' + creature?.name + ' jump?'
            : 'Is the next number higher or lower?'
          }
        </p>
        <div className="game-buttons">
          {game === 'guess-direction' ? (
            <>
              <button onClick={() => handlePlay('left')}>← Left</button>
              <button onClick={() => handlePlay('right')}>Right →</button>
            </>
          ) : (
            <>
              <button onClick={() => handlePlay('low')}>↓ Low</button>
              <button onClick={() => handlePlay('high')}>High ↑</button>
            </>
          )}
        </div>
        <button onClick={onClose} className="cancel-btn">Cancel</button>
      </div>
    </div>
  );
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================

function App() {
  const [creature, setCreature] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [cooldowns, setCooldowns] = useState({ 
    feed: 0, snack: 0, play: 0, medicine: 0, clean: 0 
  });
  const [activeMiniGame, setActiveMiniGame] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const canvasRef = useRef(null);
  const pixiAppRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && !pixiAppRef.current) {
      pixiAppRef.current = new PixiApp(canvasRef.current);
    }

    checkConnection();
    loadCreature();

    if (window.electronAPI) {
      // Listen for creature updates
      window.electronAPI.onCreatureUpdate((updatedCreature) => {
        setCreature(updatedCreature);
        if (pixiAppRef.current) {
          pixiAppRef.current.drawCreature(updatedCreature);
        }
      });
      
      // Listen for evolution events
      window.electronAPI.onCreatureEvolution((data) => {
        showNotification('Evolution!', data.result.message);
      });
      
      // Listen for death events
      window.electronAPI.onCreatureDeath((data) => {
        showNotification('R.I.P.', `${data.creature.name} has passed away...`);
      });
      
      // Listen for attention calls
      window.electronAPI.onCreatureAttention((data) => {
        showNotification('Attention!', `${data.creature.name} wants your attention!`);
      });
    }

    return () => {
      if (pixiAppRef.current) {
        pixiAppRef.current.destroy();
      }
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners();
      }
    };
  }, []);

  useEffect(() => {
    if (creature && pixiAppRef.current) {
      pixiAppRef.current.drawCreature(creature);
    }
  }, [creature]);

  const showNotification = (title, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const checkConnection = async () => {
    if (window.electronAPI) {
      try {
        const status = await window.electronAPI.checkLMStudio();
        setConnected(status.connected);
      } catch (error) {
        setConnected(false);
      }
    }
  };

  const loadCreature = async () => {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.loadCreature();
        if (data) {
          setCreature(data);
        }
      } catch (error) {
        console.error('Failed to load creature:', error);
      }
    }
  };

  const handleEggSelect = async (egg) => {
    setLoading(true);
    
    try {
      const creatureData = await window.electronAPI.generateCreatureFromEgg(egg.id);
      const result = await window.electronAPI.performAction('create', creatureData);
      setCreature(result);
    } catch (error) {
      alert('Failed to hatch egg: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, params = {}) => {
    if (cooldowns[action] > 0) return;

    try {
      const result = await window.electronAPI.performAction(action, params);
      
      if (result) {
        setCreature(result);
        
        if (result.actionResult?.message) {
          showNotification(action, result.actionResult.message);
        }
        
        // Set cooldown
        const cooldownDuration = 
          action === 'feed' ? 5 :
          action === 'snack' ? 3 :
          action === 'play' ? 10 :
          action === 'medicine' ? 30 :
          action === 'clean' ? 2 : 5;
          
        setCooldowns(prev => ({ ...prev, [action]: cooldownDuration }));
        
        // Countdown cooldown
        const interval = setInterval(() => {
          setCooldowns(prev => {
            const newValue = prev[action] - 1;
            if (newValue <= 0) {
              clearInterval(interval);
              return { ...prev, [action]: 0 };
            }
            return { ...prev, [action]: newValue };
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Action failed:', error);
      showNotification('Error', error.message);
    }
  };

  const handleMiniGameResult = (updatedCreature) => {
    setCreature(updatedCreature);
  };

  if (!creature) {
    return (
      <div className="app">
        <header className="header">
          <h1>AI Pet Sim</h1>
          <div className="connection-status">
            <div className={`status-dot ${connected ? 'connected' : ''}`} />
            <span>{connected ? 'LM Studio Connected' : 'LM Studio Offline'}</span>
          </div>
        </header>
        <div className="main-content">
          <div ref={canvasRef} id="creature-canvas" />
          <EggSelection 
            onSelectEgg={handleEggSelect}
            loading={loading}
            connected={connected}
          />
        </div>
      </div>
    );
  }

  const isDead = creature.state?.isDead;
  const isSick = creature.state?.isSick;
  const isSleeping = creature.state?.isSleeping;
  const hasPoops = creature.poops?.length > 0;
  const activeAttention = creature.attentionCalls?.length > 0;

  return (
    <div className="app">
      <header className="header">
        <h1>AI Pet Sim</h1>
        <div className="connection-status">
          <div className={`status-dot ${connected ? 'connected' : ''}`} />
          <span>{connected ? 'LM Studio Connected' : 'LM Studio Offline'}</span>
        </div>
      </header>

      <div className="main-content">
        <div className="game-area">
          <div ref={canvasRef} id="creature-canvas" />
          
          {isDead && (
            <div className="death-overlay">
              <h2>R.I.P.</h2>
              <p>{creature.name} has passed away...</p>
              <button onClick={() => setCreature(null)}>Start New</button>
            </div>
          )}
        </div>

        <div className="sidebar">
          <div className="creature-info">
            <div className="creature-name">{creature.name}</div>
            <div className="creature-type">{creature.type}</div>
            <div className="creature-stage">{creature.stage} • {creature.careMistakes?.total || 0} care mistakes</div>
          </div>

          <div className="stats-section">
            <h3>Stats</h3>
            
            <StatBar label="Health" value={creature.stats.health} color="#ef4444" icon="❤️" />
            <StatBar label="Happiness" value={creature.stats.happiness} color="#eab308" icon="😊" />
            <StatBar label="Hunger" value={creature.stats.hunger} color="#f97316" icon="🍖" />
            <StatBar label="Energy" value={creature.stats.energy} color="#3b82f6" icon="⚡" />
            <StatBar label="Hygiene" value={creature.stats.hygiene} color="#22c55e" icon="✨" />
            <StatBar label="Weight" value={creature.stats.weight} max={100} color="#a855f7" icon="⚖️" />
            <StatBar label="Discipline" value={creature.stats.discipline} max={10} color="#ec4899" icon="🎓" />
          </div>

          {!isDead && (
            <div className="actions-section">
              <h3>Care</h3>
              <div className="action-buttons">
                <ActionButton 
                  onClick={() => handleAction('feed')}
                  disabled={isSleeping || cooldowns.feed > 0}
                  icon="🍖"
                  label="Feed"
                  cooldown={(cooldowns.feed / 5) * 100}
                />
                <ActionButton 
                  onClick={() => handleAction('snack')}
                  disabled={isSleeping || cooldowns.snack > 0}
                  icon="🍪"
                  label="Snack"
                  cooldown={(cooldowns.snack / 3) * 100}
                  variant="secondary"
                />
                <ActionButton 
                  onClick={() => handleAction('medicine')}
                  disabled={!isSick || cooldowns.medicine > 0}
                  icon="💊"
                  label="Medicine"
                  cooldown={(cooldowns.medicine / 30) * 100}
                  variant={isSick ? 'urgent' : 'primary'}
                />
                <ActionButton 
                  onClick={() => handleAction('clean')}
                  disabled={!hasPoops || cooldowns.clean > 0}
                  icon="🧹"
                  label="Clean"
                  cooldown={(cooldowns.clean / 2) * 100}
                  variant={hasPoops ? 'urgent' : 'primary'}
                />
              </div>

              <h3>Play</h3>
              <div className="action-buttons">
                <ActionButton 
                  onClick={() => setActiveMiniGame('guess-direction')}
                  disabled={isSleeping || isSick}
                  icon="🎮"
                  label="Direction Game"
                />
                <ActionButton 
                  onClick={() => setActiveMiniGame('high-low')}
                  disabled={isSleeping || isSick}
                  icon="🎲"
                  label="High/Low Game"
                />
              </div>

              <h3>Discipline</h3>
              <div className="action-buttons">
                <ActionButton 
                  onClick={() => handleAction('praise')}
                  disabled={!activeAttention}
                  icon="👍"
                  label="Praise"
                  variant="success"
                />
                <ActionButton 
                  onClick={() => handleAction('scold')}
                  disabled={!activeAttention}
                  icon="👎"
                  label="Scold"
                  variant="danger"
                />
              </div>

              <h3>Environment</h3>
              <div className="action-buttons">
                <ActionButton 
                  onClick={() => handleAction('lights')}
                  disabled={false}
                  icon={creature.state?.lightsOn ? '🌙' : '☀️'}
                  label={creature.state?.lightsOn ? 'Lights Off' : 'Lights On'}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="notifications">
        {notifications.map(n => (
          <div key={n.id} className="notification">
            <strong>{n.title}</strong>
            <p>{n.message}</p>
          </div>
        ))}
      </div>

      {/* Mini-game modal */}
      {activeMiniGame && (
        <MiniGameModal
          game={activeMiniGame}
          onPlay={handleMiniGameResult}
          onClose={() => setActiveMiniGame(null)}
          creature={creature}
        />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
