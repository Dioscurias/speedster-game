# Character power assignment fix

Atlas owns flight, strength punch/slam impacts, parkour Blink and charged hand blast. Speedster keeps running/boost, jump/agility and Austin phase/slow time. Atlas ground physics cannot inherit phase/slow input. Extra powers are checked inside the ability controller as well as input handling; changing character cancels charged blasts and clears pending input, flight, phase and wall states. Parkour HUD, touch buttons, picker and guide reflect the assignments.

Visibility: switching out of phase recovers the last safe position before clearing phase, so switching to Atlas cannot leave an opaque character embedded inside a wall. Animation resets on character change. Dev-only visual inspection checks mesh count, finite matrices/bounds and camera-frustum intersection. No character is intentionally hidden by Blink or blast.

Verification: full unit suite, production build, existing both-map responsive browser regression, and scripts/hero-powers-check.mjs. The latter tests Speedster denial, Atlas boosted flight, charged blast, successful Blink, slam and switching on both maps, with finite/visible/in-view mesh checks. Punch hit targeting and collision behavior are covered by existing physics tests. This is client gameplay verification; shared room backend was not changed.

Work started from origin/main in an isolated checkout. Existing uncommitted edits in the original Speedster Game folder were preserved.

## Post-Atlas audit

Reproduced and fixed:
- Atlas pose application reset Speedster's wall-run rotation and jump squash. Speedster rendering now retains its own transforms.
- Atlas's ground controller could enter Speedster wall-running. A physics capability flag blocks it for Atlas.
- Fast X taps could disappear between render/physics ticks. Slam requests are now queued and consumed once.
- Character switches and parkour respawns retained transient power state. Clear flight banking, queued slam/punch, phase and held input; reset peer model transforms when their character changes.
- Network snapshots permitted Atlas phasing and Speedster punch state, dropped banking/slam poses and clamped below-ground parkour positions to zero. Sanitization now follows character identity and retains valid flight state.
- Shared impact validation accepted Speedster launch/landing craters. Strength impacts now require Atlas in the room worker.
- Atlas's parkour ability HUD lived in the hidden legacy container. Move it into the active shell and provide on-screen Blink and hold-to-blast buttons.
- Parkour cooldowns used uncapped wall-clock frame gaps. Advance them with active simulation frame time.
- Repeated zero-timestep pose application could layer offsets without a fresh animation sample. Apply Atlas poses only after a nonzero animation step.

Validation: 131 unit tests; production build; existing both-map responsive browser regression; updated hero-powers browser check using actual pause-menu character selection, on-screen blast button, quick-tap slam, Blink and mesh visibility; Miniflare runtime WebSocket room tests. Local input/visual tests and worker tests are distinct from live multi-client verification.

## Atlas handling pass

Added B air brake (also available on the Atlas action bar), more responsive movement release, boost exhaustion latch until Shift is released, and a distinct committed slam pose. Slam suppresses lateral steering and clears horizontal momentum on landing. Atlas status reports flight/braking/slam/grounded or the exhausted-boost release instruction. Braking state is replicated for other players' flight poses. Regression tests exercise stopping boosted flight, safe slam landing and boost recovery.
