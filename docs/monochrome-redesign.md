# Manta Ray monochrome redesign

The existing renderer, routes, project data flow, and same-origin game player are retained. The site now uses black and white, self-hosted Inter Tight and IBM Plex Mono, real Speedster gameplay media, and large project tiles. The intro now plays the supplied ten-second manta film in a full-screen view, once per session. Skip is always available. Use `/?intro=1` to replay it. Visitors who saw the former logo-only intro can see the restored film on their next visit.

## Verification

- `npm test`: 113 passed, zero failures.
- `npm run build`: passed. The existing Three.js game chunk size warning remains; the lab does not load that chunk.
- `scripts/lab-browser-check.mjs`: all lab routes, static metadata, conditional fields, video failure fallback, reduced motion, mobile navigation, and 360, 844, 1440, and 2560 pixel widths passed.
- `scripts/intro-browser-check.mjs`: supplied film playback and completion, visible Skip, Escape, session persistence, explicit replay, focus restoration, mobile framing, autoplay recovery, reduced motion, data saving, and direct links passed.
- `scripts/manta-browser-check.mjs`: both game maps, full-screen viewport, HUD bounds, pause, Guide, map changes, movement, phase, and touch controls passed. Actual loaded game frames also pass neutral text, background, border, and token assertions.
- Favicon and all generated social image pixels checked as monochrome.
- No new dependencies.

Mobile Lighthouse measurements from the monochrome redesign before the opening film was restored:

| Template | Performance | Accessibility |
| --- | ---: | ---: |
| home | 95 | 100 |
| projects | 96 | 100 |
| about | 99 | 100 |
| project | 99 | 100 |

After restoring the supplied opening film, the homepage measured 97 for mobile performance and 100 for accessibility on the local production preview.

Scores are measurements of the lab templates, not a performance claim about the running 3D game.

## Unprovided content

Email and social links remain unset in `src/data/site.ts` and create no visible rows. Unknown project statuses and stages remain null. Burkit, OpenClaw, and orny.ai use the supplied white manta silhouette until project imagery is provided. No dates, metrics, customers, team details, or project statuses were invented.

The game world and multiplayer suit identity colors remain functional. Site imagery and the shared UI are monochrome. Unrelated pending mobile and physics changes were preserved and excluded from this release.

## Files changed

- `docs/monochrome-redesign.md`
- `docs/plans/2026-10-16-monochrome-redesign.md`
- `index.html`
- `public/brand/manta-ray-mark.png`
- `public/brand/speedster-gameplay-mobile.mp4`
- `public/brand/speedster-gameplay.mp4`
- `public/brand/speedster-poster.jpg`
- `public/favicon.png`
- `public/fonts/ibm-plex-mono-OFL.txt`
- `public/fonts/ibm-plex-mono-latin.woff2`
- `public/fonts/inter-tight-OFL.txt`
- `public/fonts/inter-tight-latin.woff2`
- `scripts/fonts/ibm-plex-mono-regular.ttf`
- `scripts/fonts/inter-tight-variable.ttf`
- `scripts/intro-browser-check.mjs`
- `scripts/lab-browser-check.mjs`
- `scripts/manta-browser-check.mjs`
- `src/bootstrap.js`
- `src/data/projects.ts`
- `src/data/site.ts`
- `src/hud/manta-hud.css`
- `src/lab/app.js`
- `src/lab/components.js`
- `src/lab/intro.css`
- `src/lab/intro.js`
- `src/lab/lab.css`
- `src/lab/motion.js`
- `src/lab/pages.js`
- `src/lab/project-model.js`
- `src/lab/seo.js`
- `src/manta-layout.css`
- `src/manta-layout.js`
- `src/ui/brand.js`
- `src/ui/components.js`
- `src/ui/tokens.css`
- `tests/lab-projects.test.js`
- `vite.config.js`
