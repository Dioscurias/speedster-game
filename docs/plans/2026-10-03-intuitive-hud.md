# Intuitive HUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a restrained speedster interface with a translucent in-game minimap, less explanatory copy, and unique multiplayer suit colors that preserve skin tone.

**Architecture:** Move the existing minimap DOM into the game frame while keeping its current renderer and expand behavior. Add a vertex-color suit palette helper used by remote-player clones, leaving skin, gold, and dark regions unchanged. Consolidate the CSS palette through variables and remove redundant presentation blocks from HTML.

**Tech Stack:** Vite, Three.js, HTML, CSS, Node test runner, Playwright browser check.

---

### Task 1: Multiplayer suit identity

**Files:** Modify `src/superhero.js`, `src/multiplayer.js`, and `tests/superhero-effects.test.js`.

1. Write a failing test showing that suit red changes while skin and gold vertex colors remain unchanged.
2. Run the focused test and confirm failure.
3. Implement a stable palette selector and geometry-safe suit recoloring.
4. Use the helper when creating remote avatars and run the focused test.

### Task 2: Compact in-game HUD

**Files:** Modify `index.html` and `src/style.css`.

1. Move the existing minimap, street name, and expand button into the game frame.
2. Use translucent glass styling with legible road geometry and responsive positioning.
3. Keep health, online count, speed, energy, and map visible without overlap.

### Task 3: Reduce page explanation and update palette

**Files:** Modify `index.html` and `src/style.css`.

1. Remove redundant description, difficulty, tip, and control-strip content.
2. Replace lime-dominant accents with charcoal, ivory, and muted gold variables.
3. Reserve crimson for damage and small highlights.

### Task 4: Verify and publish

**Files:** Modify generated deployment only.

1. Run `npm test` and expect all tests to pass.
2. Run `npm run build` and expect a successful Vite build.
3. Run `npm run test:browser` with Chrome and expect no browser errors.
4. Commit, push to GitHub, and deploy production to Vercel.
