# Full-Screen Racing HUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the presentation as a full-screen racing game with compact telemetry overlays.

**Architecture:** Preserve the existing game DOM and runtime IDs, then use a final responsive CSS layout to place the world and telemetry across the viewport. Simplify pause and start copy in HTML while leaving physics, multiplayer, and map rendering intact.

**Tech Stack:** HTML, CSS, Vite, Three.js, Playwright.

---

### Task 1: Full-screen game shell

Modify `src/style.css` to make the game viewport fill `100dvh`, remove surrounding website chrome, and position the stats panel over the canvas.

### Task 2: Racing telemetry

Move the circular minimap to the top right, retain player health at the top left, and anchor speed and energy to the bottom right. Keep mobile touch controls unobstructed.

### Task 3: Direct overlay copy

Modify `index.html` so start, pause, and death states use short action labels.

### Task 4: Verification and publishing

Run tests, production build, and desktop/mobile browser checks. Visually inspect screenshots, push to GitHub, and deploy to Vercel.
