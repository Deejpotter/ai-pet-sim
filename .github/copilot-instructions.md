# GitHub Copilot instructions — AI Pet Sim

## Project overview
- AI Pet Sim is an Electron + React + PixiJS desktop Tamagotchi-style app that uses a local LM Studio model to generate creatures. Core game logic runs in the main process; renderer handles UI and graphics.

## Tech stack
- Electron (main process + preload bridge)
- React + PixiJS (renderer graphics)
- LM Studio (local AI; JSON schema output)
- File-based JSON persistence (app.getPath('userData'))

## Coding guidelines (project‑specific)
- IPC: prefer a single `game:perform-action` handler for new game actions (see `src/main/index.js`). Add action → save via `CreatureManager.saveCreature()` → return `creature.toJSON()`.
- Renderer ↔ Main: always call exposed APIs on `window.electronAPI` (see `src/preload/preload.js`). Register/cleanup listeners with `useEffect`.
- LM Studio: use JSON schema responses (see `src/main/services/LMStudioService.js`). If you change schema, update both service and renderer expectations.
- Persistence: use `FileStorage` (backups kept, stored at `app.getPath('userData')`) — avoid ad‑hoc file writes.
- Visual changes: update `PixiApp.drawCreature()` (`src/renderer/app.js`) when adding appearance fields; keep rendering logic pure.
- Time logic: Game loop uses `lastInteracted` + delta minutes (1‑minute ticks). When changing timing, validate sleep/evolution behavior in `GameLoop.js`.

## Project structure (quick map)
- `src/main/` — Electron main process, IPC handlers, GameLoop, Creature classes
- `src/preload/preload.js` — secure IPC bridge (exposes `electronAPI`)
- `src/renderer/` — UI (React) + `PixiApp` graphics
- `src/main/services/LMStudioService.js` — AI integration (env: `LM_STUDIO_URL`)
- `src/main/storage/FileStorage.js` — JSON persistence + backups

## Developer workflows & commands
- Dev run: `npm install` → `npm start` (Electron)
- Debug main: `npm run dev` (runs `electron . --inspect=5858`) — attach debugger to 5858
- Build/package: `npm run build` / `npm run dist` / `npm run dist:win`
- Data files: look in OS `userData` folder (`creature.json`, `settings.json`, `backups/`)

## Key integration points to check when changing behavior
- IPC channels: `ai:generate-from-egg`, `ai:check-connection`, `game:load`, `game:save`, `game:perform-action`, `game:play-mini-game`, `settings:*` (see `src/preload` + `src/main/index.js`).
- LM Studio expectations: `http://localhost:1234` by default; uses strict `json_schema` output.
- Auto-save & tick timing: `CreatureManager` auto-saves every 5 minutes; `GameLoop` ticks every 1 minute.

## Resources
- Start/Debug: `npm start`, `npm run dev`
- Important files: `src/main/game/Creature.js`, `src/main/index.js`, `src/preload/preload.js`, `src/main/services/LMStudioService.js`, `src/renderer/app.js`, `src/main/storage/FileStorage.js`.

---
If anything in this guide is unclear or you want additional path-specific rules, tell me which area to expand. I can iterate quickly.