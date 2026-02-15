---
applyTo: "src/main/game/**,src/renderer/**"
---

# Testing — AI Pet Sim (guidance for code and agents)

- Where to test:
  - Unit tests: `src/main/game/Creature.js`, `CreatureManager.js`, `GameLoop.js` (core game rules)
  - Renderer snapshot/behavior tests: `src/renderer/*` (Pixi rendering logic separated in `PixiApp`)
  - Integration: IPC handlers in `src/main/index.js` (mock `CreatureManager`/`FileStorage`)

- Recommended tools:
  - Jest for unit tests; place tests next to code in `__tests__` or `*.test.js` under same folder.

- Important test patterns (examples):
  - Creature unit test: assert `updateStats(deltaMinutes)` changes `hunger`, `hygiene`, `health` as expected and triggers attention calls.
  - Evolution branch tests: set `careMistakes` and assert `checkEvolution()` returns expected tier.
  - IPC handler tests: mock `CreatureManager.getCurrentCreature()` and assert `game:perform-action` returns `creature.toJSON()` and calls `saveCreature()`.

- Mocks & fixtures:
  - Mock `app.getPath('userData')` or `FileStorage` for file I/O tests.
  - For LM Studio tests, mock HTTP responses for `LMStudioService.generateCreatureFromEgg()`.

- Add a `test` script to `package.json` when introducing CI.

- Keep tests small and deterministic — prefer faking time (mock Date.now) rather than sleeping.