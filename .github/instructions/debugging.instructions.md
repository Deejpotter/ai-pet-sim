---
applyTo: "src/**"
---

# Debugging — practical tips for this repo

- Main process (quick):
  - Run `npm run dev` (launches Electron with `--inspect=5858`).
  - Attach VS Code Node debugger to port **5858** to step through `src/main/*`.
- Renderer (UI):
  - Open DevTools in the app window (View → Toggle Developer Tools) to inspect React state and Pixi canvas.
  - Use `console` logs in `src/renderer/app.js` for quick checks; prefer small, focused logs.
- Faster game-loop testing:
  - Temporarily instantiate `new GameLoop(creatureManager, 1000)` or call `tick()` manually to simulate minutes.
  - Use mocked `lastInteracted` values on Creature instances to simulate elapsed time.
- LM Studio / AI errors:
  - Confirm LM Studio is running at `LM_STUDIO_URL` (default `http://localhost:1234`).
  - Inspect `src/main/services/LMStudioService.js` for retry and schema behavior.
- Persistent data troubleshooting:
  - Check files in `app.getPath('userData')` (`creature.json`, `settings.json`, `backups/`).
  - Use logs from `FileStorage` on write/read failures.

Keep changes small and run `npm start` frequently to validate main↔renderer contracts (IPC + JSON shapes).