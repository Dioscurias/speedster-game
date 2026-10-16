# Manta Ray

Manta Ray is the lab. Speedster is MR-001, one project in its index. The existing visual system and full game HUD are retained. No simulation, physics, WebGL engine or networking changes are part of this restructuring.

## 1. Tokens

`src/ui/tokens.css` is unchanged: the near-black, white, blue, ice and low-health danger colors; Inter and Barlow Condensed; shared buttons, focus styles and motion preference rules.

`src/lab/lab.css` adds `--mono` and a self-hosted JetBrains Mono face, used only for codes, dates and metadata. Font files and licenses are in `public/fonts/`. Build-only Inter and JetBrains TTF files are in `scripts/fonts/` for PNG social previews. The existing license files cover those font families too.

## 2. Shared components

- `src/ui/brand.js`: the supplied manta artwork in `public/brand/manta-ray.png`, shared by lab pages, loading and the OG template through a luminance mask. The same unchanged PNG is the favicon. The viewBox trims the surrounding empty space without editing the source image.
- `src/ui/icons.js`: the existing Phosphor SVG markup, now usable by the browser and static renderer.
- `src/ui/components.js`: Button, Segmented, Keycap, SpeedRing, Minimap wrapper, Header and Dialog. The header links to Projects, About, Contact and the Speedster play page.

## 3. New pieces

All new render functions are in `src/lab/components.js`:

| Component | Purpose |
| --- | --- |
| `ProjectRow` | Number, code, name, description, category, status and year; expands to a specimen preview on hover or keyboard focus. Touch devices show a compact preview. |
| `StageTrack` | Idea, Prototype, Beta and Live columns. Unknown stages stay in a separate muted pending lane. |
| `StatusChip` | Live uses blue-hi and a small glow. Beta uses ink. Prototype, Research and unknown values stay muted. |
| `SpecimenFrame` | Image or looping video with four corner ticks. Missing media shows a visible placeholder, never a fabricated preview. |
| `FilterSegmented` | Status filtering with a sliding thumb, native buttons and keyboard navigation. |
| `LogEntry` | One factual project note with its code and an unknown date tag. No invented release dates or milestones. |
| `ProjectPage` | Hero media, title, metadata, tags, summary, facts, Problem / Build / Result, gallery and next-project link. Missing case-study content stays a placeholder. |
| `LabRings` | Decorative layered rings and the manta mark in Contact. This is not a gameplay HUD. |

## 4. Page sections

`src/lab/pages.js` renders the complete Home, Projects, About, project detail, Speedster play and not-found pages. Home order is hero, manifesto, project index, pipeline, featured project, lab log, contact and footer.

`src/lab/app.js` binds the static markup to filters, native navigation, clipboard, live preview and the game player. `src/lab/motion.js` retains Lenis and GSAP ScrollTrigger for rolling copy, word opacity, hairlines, dots and the pinned feature. `src/lab/particles.js` supplies slow blue particles with capped density and pixel ratio. Its animation stops offscreen, in a hidden tab and under reduced motion. The large manta drifts only a few pixels. Grain is applied to lab surfaces and does not cover the WebGL preview or game canvas.

Headline options:

1. **Build what comes next.** Used, with Build / Explore / Test / Shape rolling vertically.
2. From an idea to something real.
3. A place for the next idea.

## 5. Wiring checklist

- **Project data:** Edit only `src/data/projects.ts` to add a project. The required shape is `slug`, `code`, `name`, `tagline`, `category`, `status`, `stage`, `year`, `summary`, `stack[]`, `links[{label,url}]`, `media{cover,video}` and `featured`. Use a unique, URL-safe slug and code.
- **Unknown values:** `PLACEHOLDER` is the single missing-value constant in that file. All unspecified statuses, stages, years, stack, external links, media, dates, email and socials use it. No projects have been assigned an inferred release state. The known internal Play link is supplied for Speedster.
- **Routes:** `/`, `/projects`, `/projects/speedster`, `/projects/burkit`, `/projects/openclaw`, `/projects/orny-ai`, `/about` and `/projects/speedster/play`. `/play` redirects to the new play path. Adding one project entry generates its index row, pipeline dot, detail route, next-project relationship, metadata, social PNG and sitemap entry.
- **SEO:** `src/lab/seo.js` supplies titles, descriptions, canonical URLs and a shared 1200 × 630 OG image template. `vite.config.js` writes real route HTML and PNGs, plus a sitemap, robots file and 404 page. Organization JSON-LD includes only `@context`, `@type` and the name Manta Ray. Set `SITE_ORIGIN` there if the domain changes.
- **Contact:** Fill `contact.email` and `contact.socials` in the same data file. The copy button is disabled while the email is unknown. It copies only a real configured address. Unknown links have no fake destination.
- **Log:** `labLog` derives 3–5 notes from the known project entries. Dates stay unknown until supplied; no project milestones or outcomes have been invented.
- **Featured preview:** `src/lab/app.js` lazily creates a same-origin preview iframe only near the featured section. `src/game/preview.js` exposes only the existing live WebGL canvas. The world stays ready, so the existing multiplayer client does not join a room. The preview is removed offscreen and has no HUD or manta mark.
- **Game play:** `src/game/player.js` mounts the existing game at `/projects/speedster/play`. The header hides during play. Map switching uses the existing maps and a dialog. Leaving the game returns to the Speedster project page. All messages check origin and iframe source.
- **Game branding:** `src/bootstrap.js`, `src/manta-layout.js` and `src/hud/manta-hud.js` give the game its Speedster title. The radar's large marker is a neutral heading arrow. The manta belongs to the lab. The HUD model, layout CSS, colors, stats, controls and behavior are unchanged.
- **Engine bindings:** `src/game/game-shell.html` retains the original DOM IDs required by the engine. `src/bootstrap.js` loads that shell only for the embedded play or preview route. Lab pages never mount the HUD.
- **Responsive and motion:** Native links work without JavaScript. The pinned feature falls back to normal document flow on small screens and under reduced motion. All shared focus and dialog behavior is retained.
- **Opening film:** `src/lab/intro.js` and `intro.css` add the supplied film only to Home. It plays once per tab, starts muted, and closes on completion, Skip or Escape. Direct section links, reduced motion and data saving bypass it without fetching a video. Desktop and mobile H.264/AAC versions plus a poster are in `public/brand/`. The native dialog releases focus and scrolling when playback fails. Run `TEST_URL=http://127.0.0.1:5188 node scripts/intro-browser-check.mjs` against the production preview to verify playback and fallback behavior. The once-per-tab flag is `manta-ray:intro-seen:v1` in session storage.

## Verification

Run `npm test` and `npm run build`. With the preview running, run `npm run test:browser`. For the built site, use `TEST_STATIC=1 TEST_URL=http://127.0.0.1:5188 npm run test:browser`; this also checks actual PNG responses. The suite covers all project routes and initial HTML, four widths from 360 to 2560, placeholders, filters, mobile navigation, the HUD-free preview, and the full game HUD on both maps, including touch input.

The source archive contains complete files and required local assets. Existing game assets remain in the project. The build uses `@resvg/resvg-js`; no external font or icon CDN is required.
