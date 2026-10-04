# Speedster Game Multiplayer and Publishing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename the game, add online player presence with speed-based crash damage and respawning, then publish it to GitHub and Vercel.

**Architecture:** A Vercel API route stores room presence and authoritative health in Upstash Redis, with an in-memory fallback for local development. The browser sends compact snapshots, interpolates remote superhero avatars, and accepts health/death/respawn state from the API.

**Tech Stack:** Vite, Three.js, Node test runner, Vercel Functions, Upstash Redis.

---

### Task 1: Multiplayer rules

**Files:** Create `src/multiplayer-rules.js`; create `tests/multiplayer-rules.test.js`.

1. Write failing tests for speed-based damage, phasing immunity, lethal crashes, sanitization, and three-second respawn.
2. Run the focused test and confirm the module is missing.
3. Implement the smallest pure rules module that passes.
4. Run the focused and full test suites.

### Task 2: Room API

**Files:** Create `api/room.js`; create `tests/room.test.js`; modify `package.json`.

1. Test room joins, stale-player removal, damage cooldown, death, and respawn.
2. Implement a room store with Redis and local fallback.
3. Return authoritative self state and nearby player snapshots.

### Task 3: Client and presentation

**Files:** Create `src/multiplayer.js`; modify `src/main.js`, `index.html`, and `src/style.css`.

1. Add multiplayer health, online count, connection state, death overlay, and remote superhero clones.
2. Poll the room API and interpolate snapshots between updates.
3. Disable movement while dead and restore the player at the Austin spawn after three seconds.

### Task 4: Rename and deploy

**Files:** Modify `package.json`, `README.md`, `index.html`; create `vercel.json`.

1. Rename all visible and package identity to Speedster Game.
2. Run unit, build, and browser checks.
3. Initialize a focused repository, commit, create and push the GitHub repository.
4. Link Upstash Redis and deploy production on Vercel.
