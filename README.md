# AI Pet Sim 🧬

A fully-featured Tamagotchi-style desktop pet simulator that uses local AI (LM Studio) to generate unique creatures. Features authentic Tamagotchi mechanics including care mistakes, sickness, poop cleaning, discipline, and evolution paths based on care quality.

## ✨ Features

### Core Tamagotchi Mechanics

- **🎮 Authentic Tamagotchi Experience**: Complete care system with stats that decay over time
- **🤖 AI-Generated Creatures**: Each creature is uniquely created by AI with distinct appearances and personalities
- **⚡ Real-Time Evolution**: Creatures evolve through 6 life stages based on your care quality
- **📊 7 Core Stats**: Health, Happiness, Hunger, Energy, Hygiene, Weight, and Discipline
- **🎨 Dynamic Visuals**: Creature appearance changes based on weight, health, and state
- **💾 Persistent World**: Your creature lives 24/7, even when the app is minimized to system tray

### Advanced Care Systems

- **⚠️ Care Mistakes**: Missed care calls are tracked and affect evolution outcomes
- **🤒 Sickness System**: Creatures get sick from neglect, too many snacks, or poor hygiene
- **💩 Poop Cleaning**: Clean up after your pet (max 4 before sickness!)
- **🎓 Discipline & Training**: Praise good behavior, scold bad behavior (affects evolution)
- **🌙 Sleep/Wake Cycle**: Pet sleeps 9PM-8AM; leaving lights on = care mistake
- **🍪 Snack System**: 15+ snacks = cavity/sickness
- **⚖️ Weight Management**: Affects appearance and health

### Evolution System

Creatures evolve through stages with outcomes based on care quality:

```
Egg → Baby → Child → Teen → Adult → Elder
```

**Care Quality Tiers** (determine evolution paths):
- **⭐ Serious** (0-1 mistakes): Best evolution outcomes
- **✓ Normal** (2 mistakes): Standard outcomes  
- **😈 Naughty** (2-3 mental mistakes): Mischievous forms
- **🤕 Frail** (2-3 physical mistakes): Weak forms
- **💀 Stubborn** (4+ mistakes): Unhealthy forms

### Mini-Games

- **🎯 Guess the Direction**: Pet jumps left or right - guess correctly for rewards
- **🎲 High or Low**: Guess if next number is higher or lower
- **🏆 Rewards**: Happiness boost and weight loss

### Visual Features

- **🎨 PixiJS Rendering**: Hardware-accelerated 2D graphics
- **😊 Dynamic Expressions**: Eyes change based on state (happy, sick, dead)
- **✨ Status Effects**: Visual indicators for sleep (Zzz), sickness (skull), attention (!)
- **📈 Real-time Animations**: Breathing, bouncing, size changes based on weight
- **🎭 Appearance Changes**: Creatures visually get larger with weight, dim when sleeping

## 🚀 Quick Start

### Prerequisites

1. **Install LM Studio** (if not already installed)
   - Download from: https://lmstudio.ai/
   - Available for Windows, macOS, and Linux

2. **Download and Load a Model**
   - Open LM Studio
   - Download `mistralai/ministral-3-3b` (or any 3B+ model)
   - Click "Start Server" button
   - Verify it's running on `http://localhost:1234`

### Installation

1. **Download the latest release** from the [Releases](https://github.com/yourusername/ai-pet-sim/releases) page

2. **Run the installer** for your platform:
   - Windows: `AI-Pet-Sim-Setup.exe`
   - macOS: `AI-Pet-Sim.dmg`
   - Linux: `AI-Pet-Sim.AppImage`

3. **Launch the app** and start creating creatures!

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-pet-sim.git
cd ai-pet-sim

# Install dependencies
npm install

# Start the app
npm start
```

## 🎮 How to Play

### Creating Your First Creature

1. Start the app and ensure LM Studio is running
2. Choose an egg type (Mystic, Nature, Fire, Water, Shadow, or Light)
3. AI will generate a unique baby creature
4. Start caring for your new pet!

### Daily Care Activities

#### Feeding
- **🍖 Feed Meal**: Reduces hunger (+5g weight, restores health/energy)
- **🍪 Give Snack**: Increases happiness but adds weight and hunger
  - ⚠️ Warning: 15+ snacks causes cavities/sickness!
- **💚 Hidden Hearts**: Can eat 2 extra meals beyond the hunger meter

#### Care
- **💊 Medicine**: Cure sickness (only when sick)
- **🧹 Clean Poop**: Remove poop to restore hygiene
  - Maximum 4 poops before automatic sickness
  - Poop appears randomly after feeding
- **🌙 Toggle Lights**: Turn off when pet sleeps (9PM-8AM)
  - Leaving lights on during sleep = care mistake

#### Play
- **🎮 Mini-Games**: Play games to boost happiness and lose weight
- **⚡ Energy Cost**: Playing costs 15 energy

#### Discipline
- **👍 Praise**: Use when pet behaves well (attention call + good behavior)
- **👎 Scold**: Use when pet misbehaves (attention call + bad behavior)
- **⏰ Response Window**: 15 minutes to respond to attention calls
- **📊 Discipline Meter**: 0-10 hearts, affects evolution outcomes

### Understanding Stats

| Stat | Decay Rate | Critical Level | Effect |
|------|-----------|----------------|---------|
| **Health** | Varies | < 30% | Sickness risk |
| **Hunger** | +0.5/min | > 80% | Health loss |
| **Happiness** | -0.2/min | < 30% | Poor evolution |
| **Energy** | -0.3/min | < 15 | Can't play |
| **Hygiene** | -0.1/min | < 20% | Sickness risk |
| **Weight** | +5g meal, +2g snack | > 80g | Health issues |
| **Discipline** | N/A | Varies | Evolution requirement |

### Sleep Cycle

- **Sleep Time**: 9:00 PM - 8:00 AM (configurable)
- **During Sleep**: Stats don't decay, energy recovers
- **⚠️ Care Mistake**: Leaving lights on while pet sleeps
- **Wake Up**: Pet triggers attention call

### Sickness

**Causes:**
- Hunger > 90 + Health < 30
- Happiness < 10 + Health < 40
- Hygiene < 5
- 4+ poops on screen
- 15+ snacks eaten

**Symptoms:**
- X_X eyes
- Gray color
- Lying down
- No animation

**Treatment:**
- Give medicine immediately
- Multiple sicknesses can lead to death (4+ = fatal)

### Evolution Guide

Evolution happens automatically when requirements are met. Better care = better outcomes!

**Requirements by Stage:**

| Stage | Min Age | Min Happiness | Min Discipline |
|-------|---------|---------------|----------------|
| Baby→Child | 0.1 days | 30 | 0-2 |
| Child→Teen | 1 day | 50 | 1-6 |
| Teen→Adult | 3 days | 60 | 2-8 |
| Adult→Elder | 7 days | 70 | 4-10 |

*Requirements vary by care quality tier (Serious requires highest, Stubborn lowest)*

### Care Mistakes

**Physical Mistakes:**
- Missed hunger calls
- Not curing sickness
- Leaving poop uncleaned

**Mental Mistakes:**
- Missed happiness calls
- Missed praise/scold calls
- Leaving lights on during sleep

**Consequences:**
- Recorded permanently (affects all future evolutions)
- Determine evolution tier
- Too many mistakes = death

## 🏗 Architecture

### Tech Stack

- **Electron**: Cross-platform desktop app with system tray
- **PixiJS**: Hardware-accelerated 2D graphics rendering
- **React**: UI components and state management
- **LM Studio**: Local AI hosting with structured JSON output
- **JSON File Storage**: Simple, portable data persistence

### Project Structure

```
src/
├── main/                     # Electron main process
│   ├── index.js             # App entry point, IPC handlers
│   ├── services/
│   │   └── LMStudioService.js  # AI integration with JSON schemas
│   ├── game/
│   │   ├── Creature.js      # Complete creature model with all systems
│   │   ├── CreatureManager.js  # CRUD and persistence
│   │   └── GameLoop.js      # Background stat updates (1min ticks)
│   └── storage/
│       └── FileStorage.js   # JSON file storage with backups
├── preload/                 # Secure IPC bridge
│   └── preload.js          # Exposes API to renderer
└── renderer/               # UI layer
    ├── index.html          # App shell with styles
    └── app.js              # React + PixiJS integration
```

### Key Design Decisions

1. **1-Minute Game Ticks**: Balance between responsiveness and performance
2. **Real-Time Stat Decay**: Tamagotchi-style decay rates (hunger fastest)
3. **15-Minute Response Windows**: Authentic care mistake timing
4. **Care Mistake Persistence**: Vintage Tamagotchi-style (mistakes carry over)
5. **Sleep Cycle**: Natural downtime, prevents 24/7 obligation
6. **JSON Schema Output**: LM Studio structured output eliminates parsing errors

### Data Storage

Creature data is stored in:
- **Windows**: `%APPDATA%/ai-pet-sim/`
- **macOS**: `~/Library/Application Support/ai-pet-sim/`
- **Linux**: `~/.config/ai-pet-sim/`

Files:
- `creature.json`: Current creature with all stats, state, history
- `settings.json`: User preferences
- `backups/`: Automatic backups (last 10 saves)

## ⚙️ Configuration

### LM Studio Settings

Default URL: `http://localhost:1234`

To use a different port:
1. Open Settings in the app
2. Update "LM Studio URL"
3. Click "Test Connection"

### Sleep Schedule

Default: 9:00 PM - 8:00 AM

To customize:
1. Open Settings
2. Adjust "Sleep Time" and "Wake Time"
3. Changes apply next sleep cycle

## 🐛 Troubleshooting

### "LM Studio Not Connected"

1. Ensure LM Studio is running
2. Click "Start Server" in LM Studio's Developer tab
3. Verify the server is on port 1234
4. Check that a model is loaded

### "Failed to Parse AI Response"

1. Ensure LM Studio model supports JSON schema output
2. Try a different model (Mistral-based recommended)
3. Check LM Studio server logs

### Creature Died Too Fast

This is authentic Tamagotchi gameplay! Tips:
- Check on pet every few hours
- Clean poop immediately
- Don't overfeed snacks
- Respond to attention calls within 15 minutes
- Turn off lights at bedtime

### App Won't Start

1. Check that Node.js is installed (for dev builds)
2. Delete `node_modules` and run `npm install` again
3. Check the console for error messages

### Data Not Saving

1. Check write permissions in the app data directory
2. Verify disk space is available
3. Check for any antivirus blocking file writes

## 📚 Research & References

This implementation is based on research of:
- Original Tamagotchi (1996) mechanics
- Tamagotchi Connection series care systems
- Modern Tamagotchi (Pix, Smart, Uni) features
- Virtual pet game design best practices

Key references:
- [Tamagotchi Wiki - Care](https://tamagotchi.fandom.com/wiki/Care)
- [Tamagotchi Wiki - Evolution](https://tamagotchi.fandom.com/wiki/Evolution)
- Virtual pet design patterns and game loops

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build

# Package for distribution
npm run dist
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- **Bandai** for creating Tamagotchi and inspiring generations
- **PixiJS** for amazing 2D graphics
- **LM Studio** for democratizing local AI
- **Electron** for cross-platform desktop apps
- **Mistral AI** for open language models

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-pet-sim/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-pet-sim/discussions)

---

**Made with ❤️ and AI**

*Remember: Take good care of your pet, or face the consequences!* 🧬✨
