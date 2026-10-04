# Minimap Clarity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render a sharp, correctly proportioned, wider-view circular minimap with a prominent player marker.

**Architecture:** Move minimap display sizing into a small exported helper so backing dimensions and world scale can be tested independently. The existing city map renderer will consume those metrics before every draw, then render the larger player marker above the city layers.

**Tech Stack:** JavaScript, Canvas 2D, CSS, Node test runner, Playwright browser check.

---

### Task 1: Add testable minimap display metrics

**Files:**
- Create: `src/minimap.js`
- Create: `tests/minimap.test.js`

**Step 1:** Write tests asserting square high-density backing dimensions, capped pixel ratio, and a wider fixed world scale.

**Step 2:** Run `node --test tests/minimap.test.js` and verify it fails before the helper exists.

**Step 3:** Implement `minimapMetrics(cssSize, pixelRatio)` with square backing dimensions and the approved stable zoom.

**Step 4:** Run `node --test tests/minimap.test.js` and verify it passes.

### Task 2: Apply metrics and improve the player marker

**Files:**
- Modify: `index.html`
- Modify: `src/city.js`
- Modify: `src/style.css`

**Step 1:** Change the minimap HTML fallback dimensions to square dimensions.

**Step 2:** Resize the backing canvas from its displayed bounds before drawing, use the wider projection scale, and draw a larger outlined and glowing player arrow.

**Step 3:** Preserve the circular mask and explicitly keep the canvas square on desktop and mobile.

### Task 3: Verify and publish

**Files:**
- Verify: `tests/minimap.test.js`
- Verify: `scripts/browser-check.mjs`

**Step 1:** Run `npm test` and expect all tests to pass.

**Step 2:** Run `npm run build` and expect a successful Vite production build.

**Step 3:** Run the browser check, inspect the generated screenshot, and confirm the map geometry is undistorted and the player marker remains obvious.

**Step 4:** Commit, push to GitHub, and deploy with `vercel --prod --yes`.
