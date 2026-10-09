# Parkour abilities, HUD, and living course

Implemented in the Three.js parkour map (`/play` → The Last Household). Austin keeps its own movement and UI. All new visuals are procedural; the existing Superhero.glb is the only character asset.

## 1. Teleport and blast mechanics

`src/parkour-abilities.js` contains the complete timer/teleport implementation and the `ABILITY` configuration at the top:

| Parameter | Starting value | Feel adjustment |
|---|---:|---|
| teleportDistance | 8 units | Increase for longer skips; unsafe endpoints are still rejected |
| teleportCharges | 3 | More charges make recovery easier |
| teleportWindow | 10 seconds | Shorten for more frequent use |
| damage | 80 | Amber targets have 60 health |
| force | 18 | Increase to throw targets farther |
| chargeTime | 1.2 seconds | Shorten for faster combat |
| cooldown | 2.5 seconds | Increase to demand deliberate shots |
| minimumCharge | .2 seconds | Prevents accidental taps from firing |
| projectileSpeed | 45 units/s | Higher values remain swept-ray tested |
| projectileRange | 120 units | Limits projectile lifetime and aim range |

Press E / Blink to teleport horizontally in the facing direction. While aiming, use camera yaw instead. Destination support must fit the character radius, remain within 2.4 units upward / 4 downward, and belong to an active platform. A swept upright volume checks the path and endpoint against the course, scenery (including gate posts), and combat props. Blocked/off-platform attempts consume no charge. Each successful use occupies its own HUD pip for exactly ten active-play seconds; charges do not refill in batches. Timers pause with the game and are independent of optional apex slow motion. Death preserves spent charges and cooldowns; restarting the course resets them.

Hold F or the right mouse button to aim; release to fire. Touch users hold Aim / fire and release it. Drag the viewport / use arrow keys to change camera direction. A center-camera ray finds the first target; the projectile launches from the animated right hand toward that point. Partial charges scale damage and force. Full charge is shown by a bright reticle and hand glow. Cooldown begins on release. Pausing or losing focus cancels aiming without firing.

`src/parkour-combat.js` provides projectiles, swept hit raycasts, hand glow, aim line, trails, impact particles, blink bursts, and camera impulses. Amber cubes break when their health is depleted; blue cubes are pushed without breaking. Targets fall and settle onto course support. They are demonstration props, not required objectives.

## 2. Deterministic moving world

`src/parkour-course.js` exports `WORLD_MOTION.speed = 1` and a 12-second period. The pause/start menu has a World motion slider from 0 to 2. Zero freezes the environment; changes integrate into a motion clock without teleporting platforms to a different phase.

- Platform 5 slides ±.6 units along X.
- Platform 8 rotates ±.055 radians around its center.
- Platform 11 rises and sinks ±.35 units.
- Platform 12 sinks up to .6 units and returns.
- Platform 14 is stable for eight seconds, warns amber/red for two, then drops and returns over two seconds. Wait on the stable preceding checkpoint platform for the next safe interval.
- Background books slowly tilt/drift; the giant roof floats and tilts.

A grounded player's position is stored relative to their support each fixed step and transformed with its new translation/rotation. Their feet follow support height. When the crumbling section becomes inactive, attachment ends and gravity resumes. Collision polygons are rebuilt from the same platform transforms used for rendering. The initial platform and checkpoint platforms remain stable.

The moving-route regression test searches launch phases in a full loop and verifies that every transition has a reachable launch window at the standard 10-unit/s approach. This verifies the default course, not all possible edited amplitudes/speeds. Keep lateral amplitudes small compared with landing width; retain a stable waiting platform before each hazard.

## 3. HUD and feedback

`src/parkour-hud.js` and `.css` render the live speed number/bar, three independently refilling pips, charge/cooldown bar, aiming reticle, and canvas-edge speed streaks. Speed shifts from sandstone to amber to blue as it approaches 10 units/s. Streaks begin at 75% speed and remain inside the canvas. The ability panel occupies its own region in the existing scrollable HUD rail; menus remain confined to the game viewport. Reduced motion removes streaks and camera impulses.

`src/parkour.js` integrates controls, independent ability time, fixed-step platform motion, rendering, pause/respawn/reset handling, and HUD updates. `src/parkour-map.js` renders the animated course and provides scenery clearance checks.

## Verification

- `npm test`: rolling-window boundaries, stable pip slots, blocked teleports, blast charging/cooldown, damage/force, projectile tunnelling, moving/rotating platform attachment, deterministic motion, falling-platform detachment, and reachable moving-course transitions.
- `node scripts/abilities-browser-check.mjs`: three blinks, refill, aim/charge/release, cooldown, pause timers, moving scenery, and mobile HUD.
- `node scripts/player-browser-check.mjs`: map selection, embedded/fullscreen play, and visible HUD separation at desktop, portrait, and landscape sizes.
- `node scripts/parkour-browser-check.mjs`: existing jumping, landing, movement, restart, and pause behavior.
