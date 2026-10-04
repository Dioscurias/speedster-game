# Functional Game UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove ornamental interface treatments and leave a direct, readable game HUD.

**Architecture:** Simplify existing HTML copy and presentation without changing gameplay or HUD data bindings. Add a final CSS layer that removes blur, glow, gradients, excessive tracking, and redundant panel framing while preserving responsive controls.

**Tech Stack:** HTML, CSS, Vite, Three.js, Playwright.

---

### Task 1: Simplify interface language

**Files:** Modify `index.html`.

1. Replace promotional and technical-status copy with direct labels.
2. Remove decorative eyebrow text and footer slogans.
3. Preserve every ID used by the game runtime.

### Task 2: Flatten the visual system

**Files:** Modify `src/style.css`.

1. Remove blur, gradients, glow, and ornamental shadows.
2. Reduce borders and uppercase letter spacing.
3. Present the sidebar as an open statistic column and the map as a flat overlay.
4. Verify desktop and mobile layouts.

### Task 3: Verify and publish

1. Run unit tests, production build, and browser checks.
2. Commit and push the result.
3. Deploy the production build to Vercel.
