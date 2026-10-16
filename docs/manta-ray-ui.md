# Manta Ray UI

The existing Vite / vanilla JavaScript application now uses the Manta Ray shell and a DOM/SVG HUD. Game simulation, physics, WebGL rendering and multiplayer code were left unchanged during this rebrand. Existing pending work in those files was preserved.

## Assumptions

- The workspace supplies the framework, two-map list and state accessors missing from the pasted brief.
- No logo attachment was supplied. Replace the path inside the single `symbol#manta` definition in `src/ui/components.js`. Update `public/manta.svg` with the same mark for the favicon.
- Existing gameplay screenshots are used for the hero and map previews.
- Parkour exposes Blink (E) and Hand blast (F), rather than Austin's Boost (Shift), Phase (Q) and Slow time (E). Unsupported Phase/HQ controls remain visibly disabled on that map. Its braking distance is not exposed, so the HUD displays a dash rather than inventing a measurement.

## Files, in integration order

1. **Tokens:** `src/ui/tokens.css`. All specified color variables, locally hosted Inter / Barlow Condensed, typography, focus, grain and reduced-motion rules. Font binaries and licenses live in `public/fonts/`.
2. **Shared components:** `src/ui/components.js`. `button`, `segmented`, `keycap`, `speedRing`, `minimap`, `header`, `dialog` and `wireDialog`, plus the replaceable manta symbol. Phosphor icons are bundled SVGs rather than a remote icon font.
3. **Page sections:** `src/site-page.js`, `src/site-page.css` and `src/ui/site-motion.js`. Hero, scroll manifesto, numbered map rows, pinned four-step guide, Play section, footer, mobile navigation and Change map dialog. Lenis and GSAP are isolated to the website, never the engine. The guide becomes a normal document on smaller screens and under reduced motion.
4. **HUD:** `src/hud/manta-hud.js`, `src/hud/manta-hud.css`, `src/hud/hud-model.js`, and the existing `HudFeed` export in `src/hud/hud-overlay.js`. `mountMantaHUD(container, options)` returns `update(values, time)`, `event(text)`, `reset()` and `destroy()`.
5. **Wiring and menus:** `src/manta-layout.js`, `src/manta-layout.css`. `src/bootstrap.js` selects the new UI. `index.html` supplies the metadata, favicon and font preload while retaining engine-required elements.

## Headlines

1. **Run through Austin.** Used, with Run / Glide / Vault / Phase rotating vertically.
2. The city is your circuit.
3. Move at another speed.

## Wiring checklist

The adapter samples the already exposed `window.__velocity.getState()` or `window.__parkour.getState()` in requestAnimationFrame. The HUD's numeric text changes only when the displayed value changes, at most every 80 ms. Only transform and opacity receive motion animations. Ring stroke lengths follow live values without CSS transitions.

| Game value | HUD prop / CSS variable | Source / units |
| --- | --- | --- |
| Speed | `speed`, `--speed` | `world.speed * 3.6`, km/h; normalized to 936 Austin / 36 parkour |
| Top speed | `topSpeed` | `world.topSpeed * 3.6`, km/h |
| Energy | `energy`, `--energy` | `world.energy`, 0–100 converted to 0–1 |
| Health | `health`, `--health` | Existing `#health-value`, 0–100 converted to 0–1; danger below 25 |
| Heading | `heading`, `--hud-radar-angle` | `world.heading`, radians clockwise from north |
| Ring motion | `--ring-angle`, `--spin-duration` | Speed controls angular velocity; reduced motion stops rotation |
| Map / street | static map name, `street` | Existing map list and `#street-name` / parkour `#zone` |
| Players / connection | `players`, `connection` | Existing `#online-count` and `#network-state` |
| Distance / Bolts | `distance`, `bolts` | `world.distance` in meters; `world.collected` |
| Braking | `braking` | Existing `#braking`, meters; no second physics calculation |
| Boost / Phase | `boosting`, `phasing` | Existing world flags |
| State | `status` | `ready`, `running`, `paused`, `dead`, `complete` |
| Events | `event(text)` | Existing `speedster:event`; bolt increments also flash the ring |

- The Austin radar keeps the existing square high-density canvas and 1.5 km span. Its manta marker is 32 CSS pixels, independent of map zoom. The compass ticks and north marker follow heading. Expanded map uses the existing map button.
- HUD controls call the existing buttons. Phase sends the existing Q key while held. No new abilities or graphics settings were implemented.
- Desktop arrows are hidden. On coarse pointers, the existing touch handlers remain attached to their controls, with a separate camera pad. Key hints dim when idle, disappear during active movement, and light while pressed.
- The website and game communicate only through same-origin, source-checked messages for map changes, cancel/resume and leaving the game. Native dialogs provide focus containment and Escape handling.
- Grain is limited to the website and HUD surfaces. The fixed website grain hides during play, and the WebGL canvas has no grain filter.
- Change map does not create another dashboard or title bar. A selected map launches a full-viewport same-origin iframe.
- No game values are saved in React state. The UI has no React dependency.

## Validation

Run `npm test`, `npm run build`, and `npm run test:browser` with the local preview running. Set `TEST_URL` to use a production preview. The browser check covers both maps, 360–2560 widths, real input, radar dimensions, HUD collisions, pause, Guide, HQ, fullscreen, map change/cancel, touch and reduced motion.

Dependencies: Lenis, GSAP and Phosphor Core are in `package.json`. Fonts and existing gameplay previews are local assets. No external font CDN is needed.
