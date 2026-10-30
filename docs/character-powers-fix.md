# Character power assignment fix

Atlas owns flight, strength punch/slam impacts, parkour Blink and charged hand blast. Speedster keeps running/boost, jump/agility and Austin phase/slow time. Atlas ground physics cannot inherit phase/slow input. Extra powers are checked inside the ability controller as well as input handling; changing character cancels charged blasts and clears pending input, flight, phase and wall states. Parkour HUD, touch buttons, picker and guide reflect the assignments.

Visibility: switching out of phase recovers the last safe position before clearing phase, so switching to Atlas cannot leave an opaque character embedded inside a wall. Animation resets on character change. Dev-only visual inspection checks mesh count, finite matrices/bounds and camera-frustum intersection. No character is intentionally hidden by Blink or blast.

Verification: full unit suite, production build, existing both-map responsive browser regression, and scripts/hero-powers-check.mjs. The latter tests Speedster denial, Atlas boosted flight, charged blast, successful Blink, slam and switching on both maps, with finite/visible/in-view mesh checks. Punch hit targeting and collision behavior are covered by existing physics tests. This is client gameplay verification; shared room backend was not changed.

Work started from origin/main in an isolated checkout. Existing uncommitted edits in the original Speedster Game folder were preserved.
