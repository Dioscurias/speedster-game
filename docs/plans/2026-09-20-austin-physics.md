# Austin Physics Upgrade

**Goal:** Human character, less blocky scenery, momentum-based speedster physics, arrow-key camera controls, and a playable real Austin map.
**Architecture:** Cache OpenStreetMap geometry locally, project longitude/latitude to meters around downtown Austin, and render the same road and building polygons used for collisions and the minimap. Fixed-step velocity integration, gravity, traction limits, braking and collision impulses replace direct position movement. Keep high speed as the intentional superhero ability.

## Scope
Downtown Austin snapshot (reduced to fit the source API limits) (30.259–30.281 N, -97.752–-97.735 W), not an invented grid or a claim to a complete photogrammetric city. Real road names, building outlines, mapped heights where present and estimated heights otherwise. Detailed animated human and car models downloaded online; CC0 asphalt/concrete textures. WASD movement; arrow left/right camera yaw; arrow up/down camera elevation; equivalent visible buttons. No mouse camera movement.

## Validation
Tests first: finite acceleration/braking, inertia through turns/reversal, airborne control, 9.81 m/s² gravity, jump arc, polygon collision and high-speed tunneling, pause, map projection and spawn clearance. Browser checks: asset loading, Austin names and geometry, human animation, arrow-only camera, independent WASD, collisions, pause and mobile controls. Build and final review.
