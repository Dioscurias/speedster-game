# Speedster Game

Independent source repository and Vercel deployment.

Run `npm ci`, then `npm run dev`. Use `npm test`, `npm run build`, and `npm run preview` for validation.

Speedster owns both game maps, HUD, physics, game assets and multiplayer. The root `/` starts the game directly. Manta Ray is maintained in its own repository and hosting project. Configure `VITE_MANTA_ORIGIN` to authorize a different lab host for embedded map changes and resume messages.

Production: https://speedster-game.vercel.app

Repository: https://github.com/Dioscurias/speedster-game

## Characters and controls

Select a character before joining, or change in the pause menu. Speedster retains speed, phase and slow time in Austin, and blink / hand blast in parkour. Atlas is an original flying powerhouse with superstrength, blue-and-gold suit, boosted flight pose and sonic wakes.

| Control | Action |
| --- | --- |
| WASD / arrows | Move / turn camera |
| Space | Jump; ascend during flight |
| R | Toggle Atlas flight |
| C | Descend during flight |
| Shift | Speed or flight boost; consumes energy |
| V | Atlas punch (within 4.8 m of a facade) |
| X | Atlas dive / ground slam |
| M / radar | Live map |
| Escape | Pause / change character |

Atlas also has touch buttons. Takeoffs and landings emit shockwaves and debris; reduced-motion settings suppress camera shake. Heavy landings and wall punches leave shared craters. This is bounded **surface damage**, not structural building destruction or traversable holes. Up to 64 recent scars are retained in a room for 15 minutes; particles and rings are short-lived. Rooftops include mapped-footprint HVAC units and helipads. Austin's live map supports pan, zoom and recenter; parkour has its own course overview and player radar.

## Multiplayer hosting

The frontend stays on Vercel. A Cloudflare Worker (`speedster-rooms`) routes each map and room to a SQLite-backed Durable Object. Hibernating WebSockets retain connection attachments; SQLite stores recent impact events. This replaces the unreliable Vercel in-memory room fallback. The two maps have independent rooms, capped at 20 concurrent connections. WebSocket snapshots are sent at 10 Hz, interpolated in world coordinates, and extrapolated for at most 180 ms. Disconnects remove players, stale presences expire, and clients reconnect with backoff. Server-issued session IDs prevent duplicated browser tabs from sharing an identity. Austin retains collision damage; parkour presence is cooperative.

- Default endpoint: `wss://speedster-rooms.argus-global.workers.dev` (public service address, not a secret).
- Set `VITE_ROOM_URL` at frontend build time to override it. For local rooms: `VITE_ROOM_URL=ws://127.0.0.1:8787 npm run dev`, alongside `npm run dev:rooms`.
- Add `?room=friends` to use another room; share the same URL and map. There is no password or access control on room names.
- `npm run deploy:rooms` deploys through your authenticated Wrangler account. `worker/wrangler.jsonc` pins the runtime date supported by the tested installation and declares the binding/migration.
- The origin allowlist accepts Speedster Vercel deployments and localhost. Add any custom game domain to `worker/rooms.js` before switching domains.

Movement is client simulated for casual play; this is not a competitive anti-cheat server. The server sanitizes snapshots, assigns identity/color, enforces capacity and message cadence, validates impact range and caps damage history. Parkour progress, moving-platform timing, pickups and hand-blast targets remain local to each player's run; multiplayer shares presence and impact scars. Cloudflare usage is subject to the account's plan and quotas; no paid plan was enabled by this change.

## Verification

`npm test` checks physics, maps, animation, snapshots and reconnect logic. `npm run test:rooms` runs real WebSockets and SQLite in the local Cloudflare runtime (presence, room isolation, impacts, late joins, departures and 20-player cap). `npm run test:browser` checks both maps and responsive navigation. `node scripts/powerhouse-browser-check.mjs` exercises two independent browser sessions against the shared room service, flight/boost/punch, live maps and disconnects. Use `TEST_URL` and `CHROME_PATH` to override the frontend URL and Chrome executable. Development-only positioning diagnostics are removed from production builds.
