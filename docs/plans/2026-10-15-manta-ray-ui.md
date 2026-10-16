# Manta Ray UI implementation plan

**Goal:** Apply the supplied Manta Ray design to the site, menus and DOM/SVG HUD without changing simulation, WebGL rendering or networking.

**Architecture:** Retain the Vite shell and same-origin game iframe. Read existing `__velocity` / `__parkour` snapshots and legacy UI values in a UI-only requestAnimationFrame adapter. Existing engine buttons and touch handlers remain the action targets. Keep the existing staged FPS work and unrelated mobile/parkour changes intact.

**Tech stack:** Vanilla HTML/CSS/JS, local Inter and Barlow Condensed, Phosphor SVGs, Lenis, GSAP ScrollTrigger, native dialog.

## Design and assumptions

The attached brief supplies the visual design and interaction requirements. Use the current two maps, existing gameplay screenshots and exposed state. No logo file was attached: provide one replaceable `symbol# manta` (actual ID `manta`) and derive the favicon from that same silhouette. Keep gameplay terminology. Hero headline options: (1) Run through Austin. (2) The city is your circuit. (3) Move at another speed. Use option 1 with rolling Run / Glide / Vault / Phase.

## Steps

1. Add behavior tests for UI value normalization, speed/energy ring variables, heading and the real per-map ability labels. Run and observe failures.
2. Add tokens and shared Button, Segmented, Keycap, SpeedRing, Minimap, Header and Dialog helpers. Self-host Inter with its license.
3. Replace the map selector shell with hero, scroll manifesto, numbered maps, pinned four-step guide, play section and footer. Use native dialogs for navigation and map changes; preserve same-origin iframe messages and query links.
4. Replace the HUD overlay and menu styles. Adapt existing values with read-only snapshots, keep desktop arrows hidden, retain touch controls. Preserve loading, death, restart, settings and Guide behavior. Add reduced-motion handling and lifecycle cleanup.
5. Run unit tests and build. Use real Chrome to check both games, all required stats, actions, pause, map changes, touch and 360 / 844 / 1440 / 2560 layouts. Compare engine file hashes to the pre-change baseline. Package complete UI files and a short wiring guide.
6. Publish the scoped UI after verification using the already authorized GitHub/Vercel workflow, excluding unrelated pending work.
