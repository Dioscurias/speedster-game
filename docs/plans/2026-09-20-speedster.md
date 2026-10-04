# Speedster Implementation Plan

**Goal:** Build the approved 3D city checkpoint runner with online assets.
**Architecture:** Vite serves a Three.js scene and responsive HTML HUD. A pure simulation module handles race state independently of rendering. Downloaded assets live in public/assets with credits.
**Tech Stack:** JavaScript, Three.js, Vite, Node test runner, Playwright smoke verification.

## Approved design
Third-person city sprint. WASD moves, Space jumps, Shift boosts, E slows time. Dodge traffic, collect lightning energy, and reach five checkpoints before time expires. A polished launch panel explains controls; pause/retry and results complete the loop. Asset load errors show a useful message. Desktop keyboard and touch buttons are supported.

## Implementation
1. Source and download city/vehicle/character assets and record provenance.
2. Write failing race tests in tests/game.test.js for movement, energy, pause, checkpoint victory, timeout and collision. Implement src/game.js and run npm test.
3. Build index.html, src/style.css, src/main.js: responsive HUD, city scene, lighting, camera, animated runner, particles, obstacles, audio toggle and game loop.
4. Build production output; use a real browser to verify launch, movement, pause, restart, asset loading, mobile layout and console errors.
