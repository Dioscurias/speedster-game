# Speedster HUD overlay

The complete reusable component is `hud-overlay.html`, `hud-overlay.css`, and `hud-overlay.js`. It has no framework or package dependencies. The download also includes the existing Austin `minimap.js` renderer. The existing Speedster Game integration is in `src/game-layout.js`.

Include the CSS, paste the HTML fragment beside your existing canvas, and initialize the controller:

```html
<link rel="stylesheet" href="./hud-overlay.css">
<div id="game-stage" style="position:fixed;inset:0;overflow:hidden">
  <canvas id="game-canvas" style="display:block;width:100%;height:100%"></canvas>
  <!-- Paste the entire hud-overlay.html fragment here. -->
</div>
```

```js
import {createSpeedsterHUD} from './hud-overlay.js';
import {createMinimapRenderer} from './minimap.js';

// `map` is the Austin geometry already prepared by your existing game.
const drawMap = createMinimapRenderer(map);
const hud = createSpeedsterHUD(document.querySelector('.speedster-hud'), {
  drawRadar: (canvas, state) => drawMap(canvas, state, {
    headingUp: true, north: false, scaleLegend: false, background: 'transparent'
  })
});

// Call from your game update. Speed is km/h; distance is meters; heading is radians.
hud.update({
  health: 100, energy: 100, speed: 324, topSpeed: 936,
  distance: 1200, bolts: 3, heading: Math.PI / 2,
  boosting: false, status: 'running', x: player.x, z: player.z
});

hud.event('Bolt collected +1'); // Optional custom events; bolt/record events are automatic.
hud.reset();                  // On a new session.
// hud.destroy();             // When removing the component.
```

The radar button can use your existing map action:

```js
document.querySelector('.hud-radar').addEventListener('click', openMap);
```

Adjust colors and padding through the variables at the top of `hud-overlay.css`. Existing DM Sans and Barlow Condensed fonts are used when available; standard sans-serif fallbacks are provided. The radar renderer should draw on a transparent background, omit its own N label, and keep a square retina backing canvas. The existing Austin renderer uses `headingUp: true`, `north: false`, `scaleLegend: false`, and `background: 'transparent'` for this overlay.

Health becomes red below 25. Energy pulses when full or boosting, with reduced-motion support. Speed scales gently above 300 km/h. Events are limited to four, coalesce repeated records, and fade after 3.5 seconds before disappearing at 4.5 seconds. The start hint fades away after 3.8 seconds. The overlay does not intercept gameplay clicks except on the radar, and places nothing at screen center.

Escape, pause/resume, graphics settings, fullscreen, map switching and controls are wired to the existing game by `src/game-layout.js`; the reusable component does not replace your game input or pause logic.
