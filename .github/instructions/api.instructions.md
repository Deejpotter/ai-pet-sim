---
applyTo: "src/main/**,src/preload/**"
---

# Main process & API — rules for changes

- IPC conventions:
  - Prefer `ipcMain.handle('game:perform-action', ...)` for game actions (see `src/main/index.js`).
  - Add new action by extending the `switch` in `game:perform-action` and **always** `saveCreature()` afterward.
  - Return `creature.toJSON()` (renderer depends on this shape).
- Preload layer:
  - Expose a simple wrapper in `src/preload/preload.js` for **every** new IPC handler.
  - Keep `contextIsolation: true` and only expose minimal APIs.
- LM Studio integration:
  - Use `LM_STUDIO_URL` env var (default `http://localhost:1234`) and strict `json_schema` responses (`src/main/services/LMStudioService.js`).
  - Validate AI output before passing to `CreatureManager`.
- Persistence:
  - Use `FileStorage` for reads/writes; files live in `app.getPath('userData')` (see `src/main/storage/FileStorage.js`).
  - Backups are created automatically; keep key names consistent (`creature`, `settings`, `history`).
- Safety & errors:
  - Wrap IPC handlers in try/catch and throw user-friendly errors (see `ai:generate-from-egg`).

Quick example: to add `wash` action — add case in `game:perform-action`, call `creature.clean()`, `await creatureManager.saveCreature(creature)`, and expose `performAction('wash')` in preload.