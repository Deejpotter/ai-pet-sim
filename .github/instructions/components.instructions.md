---
applyTo: "src/renderer/**"
---

# Renderer / Components — actionable rules

- Use `window.electronAPI` for all IPC (see `src/preload/preload.js`). Do NOT call Electron APIs directly from renderer.
- Register event listeners with `useEffect` and always clean up with `removeAllListeners()` (see `src/renderer/app.js`).
- Graphics: update `PixiApp.drawCreature()` when adding or renaming any `appearance` fields (size, color, tentacles, eyes).
- UI → Main flow when adding an action button:
  1. Add button UI in `src/renderer/index.html` / `app.js`.
  2. Call `window.electronAPI.performAction('<action>', params)`.
  3. Use IPC events (`creature:update`, `creature:evolution`) to refresh UI.
- Keep Pixi rendering pure — do not perform game logic inside `PixiApp`.
- Follow existing styling / CSS class names (action buttons use `.action-btn` + `.cooldown-overlay`).

Example: feed button should call `window.electronAPI.performAction('feed', {amount: 20})` and display cooldown using existing state.