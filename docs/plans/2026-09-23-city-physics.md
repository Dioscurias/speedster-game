# Austin streets and physics upgrade

Goal: Responsive speedster steering and a detailed, traversable downtown map.

Design: Separate speed acceleration from finite-rate directional steering. Centralize tuning and incorporate surface grip, small automatic step-up, jump buffering/coyote time, and landing feedback. Preserve phasing, wall runs and rooftop gravity. Use the existing attributed OSM snapshot to retain mapped trees, benches, lamps, crossings, signals, fountains, business/landmark names, road surfaces and building types. Build spatial terrain queries shared with visible roads/sidewalks, and render instanced street furniture, trees, curbs, crossings, storefronts and roof details. Keep generalized architecture and terrain explicitly described; this is not a surveyed elevation or photogrammetry map.

1. Add regression tests for rapid turning/reversal, finite acceleration, timestep consistency, surface grip and step handling.
2. Implement centralized steering and ground support upgrades; verify existing abilities.
3. Expand OSM conversion, spatial surface/feature queries and tests for mapped details.
4. Build road/intersection and environment details with batching and visibility limits; align surface heights.
5. Update controls/guide/map HUD, inspect browser views and performance, run unit/browser/build verification.
