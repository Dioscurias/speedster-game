# The Last Household

Open `/?map=parkour` or choose Parkour in the Austin navigation. This is a standalone single-player course. WASD moves, Space jumps (release for a short hop), arrow keys or pointer dragging change the camera, and Escape pauses. Touch movement/jump buttons are available on coarse-pointer devices. Reduced motion disables mesh deformation and camera impulses. The optional apex beat slows the entire simulation to 65% for 60 ms and defaults off.

## Movement and jump tuning

`src/game.js` exports PARKOUR; Austin retains PHYSICS defaults. The new optional fifth argument to stepWorld selects the configuration.

- Character height 1.86, collision radius .38 units.
- Speed 10, acceleration 34, braking 90 units/s².
- Jump velocity 6.8, gravity 9.81, falling multiplier 1.65.
- Jump release cap 3.8, coyote time .11 s, buffer .12 s.
- Air acceleration 14 and turn rate 2.4. Increase air acceleration for easier recovery.
- Held jump apex approximately 2.36 units, level flight duration approximately 1.23 s. Reach depends on approach speed; tests simulate every gap at a 10-unit/s approach.

`src/jump-fx.js` provides 35 ms launch compression, 75 ms takeoff stretch (Y 1.12), apex silhouette, descent extension, 220 ms landing recovery, red dust, a fading ground shadow, a 230 ms blue particle trail, +2° jump FOV kick, .07-unit landing dip, and .018-unit shake. Mesh deformation never changes collision dimensions. Particle count is capped at 96. Increase stretch or trail lifetime for a more stylized feel. Lower camera amplitudes for comfort.

`src/animation.js` adds knee compression at launch and a readable apex tuck on top of existing bone animation. No input delay is introduced for anticipation. Existing coyote time, buffering and variable jump height remain in place.

## Course

The course travels toward negative Z. Platforms extend to Y=-60. Width is along X, depth along Z; gaps are edge-to-edge. Five checkpoint rings activate in order. Falling below Y=-15 respawns at the last checkpoint with zero velocity; collected orbs persist. Reach the final doorway after all five checkpoints to complete. All 15 orbs earn a perfect clear but are optional.

| Section | Count | Width × depth | Gap | Rise per platform |
|---|---:|---|---:|---:|
| Start | 1 | 14 × 18 | — | 0 |
| Salt Steps | 3 | 10 × 14 | 2 | 0 |
| Chair Foundations | 3 | 8 × 14 | 3 | .4 |
| Fallen Books | 3 | 6 × 14 | 4 | .6 |
| Canyon Teeth | 3 | 4.5 × 14 | 4.5 | -.4 |
| The Threshold | 3 | 3.2 × 14 | 5.5 | .5 |
| Finish | 1 | 14 × 18 | 3 | 0 |

The warm red canyon, apricot fog, limestone landing surfaces, giant chair (140 × 180 × 140), books (16 × 110 × 75), and concrete tower (280 × 420 × 180) contrast with the electric-blue runner and amber orbs. Large scenery is decorative and sits outside the playable platforms. Platform dimensions and progression are defined in `parkour-course.js`; scenery is in `parkour-map.js`.

No new downloaded assets: the existing Superhero.glb, procedural geometry, and generated radial particle texture are sufficient. Optional production polish: concrete/sand textures and landing/wind audio.

## Verification

`npm test` includes speed-cap, all-gap reachability, checkpoint respawn and ordered completion checks. `node scripts/parkour-browser-check.mjs` checks character loading, jumping, landing, pause, movement, restart and mobile layout against the dev server. Set CHROME_PATH if needed. Existing Austin browser coverage remains in `npm run test:browser`.
