---
applyTo: "package.json,**/build/**"
---

# Deployment & packaging

- Packaging is handled by `electron-builder` (see `package.json` scripts).
- Common commands:
  - `npm run build` — create production build
  - `npm run dist` / `npm run dist:win` — create platform installers (artifacts in `dist/`)
- Before releasing:
  - Verify `build.appId` and `productName` in `package.json`.
  - Update icons under `build/` (`icon.icns`, `icon.ico`).
  - Test the installer on target OS (VM or CI matrix).
- CI recommendations:
  - Use platform runners (win/mac/linux) to build artifacts.
  - Upload `dist/` artifacts to release pipeline.
- Debugging packaged app: run the generated AppImage / installer and inspect logs under the user data directory.

Note: there is no auto CI in repo yet — add `build` pipeline that runs `npm ci && npm run build`.