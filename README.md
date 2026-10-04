# Speedster Game — Austin Multiplayer

Free-roam exploration of downtown Austin using locally bundled OpenStreetMap streets, building footprints, parks and Lady Bird Lake shoreline. The playable extract is approximately 1.6 × 2.4 km (30.259–30.281 N, -97.752–-97.735 W). Spawn is on Congress Avenue near Sixth Street.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173 in a browser with WebGL.

## Controls

- **WASD:** camera-relative movement, including diagonals. Release to brake; momentum takes time to dissipate.
- **Left/right arrows:** rotate the camera. **Up/down arrows:** raise/lower it. Mouse dragging does not control the view.
- **Shift:** superhero acceleration/boost, up to 936 km/h; normal running caps at 324 km/h.
- **Space:** jump; **E:** slow time; **Escape:** pause/resume.
- On mobile, W/A/S/D buttons move and separate arrow buttons control the camera. Power buttons provide jump, slow time and boost.

## Responsive animation

The character blends the original Idle, Walk and Run clips by speed. Input anticipation, acceleration and steering drive body lean; boost increases lean and cadence; braking shifts weight backward. Takeoff, airborne knee tuck, landing compression and impact reactions are layered onto the skeleton. Animation uses simulation time, so slow motion and pause also affect the poses. Movement physics and camera controls remain unchanged.

## Physics and map scope

Movement integrates velocity at a fixed 120 Hz with finite acceleration, braking and turning. Jumps use 9.81 m/s² gravity and retain horizontal momentum, with limited air control. Short collision substeps prevent tunneling through building polygons at speed; wall impacts remove normal momentum and preserve tangential movement. Traffic collisions apply an impulse. A HUD estimate shows ground stopping distance.

This is a superhero game, not a fully realistic simulation: top speed, acceleration and slow time are intentional fictional abilities. The Austin terrain is flat. Building footprints and tagged heights come from OSM; untagged heights are estimated. Textured facades and the Capitol dome are generalized, not photogrammetric replicas. The finite map boundary is shown in the HUD when approached; water is blocked except along mapped bridges. There is no race timer or finish line.

## Verify

```sh
npm test
npm run build
npm run preview
```

With the dev server running, install Playwright Chromium (`npx playwright install chromium`) and run `npm run test:browser`. Alternatively set `CHROME_PATH` to an existing Chrome executable. `TEST_URL` can point at a production preview. Browser screenshots are saved under `/tmp/velocity-austin-*.png`.

## Assets and map data

- Human and animations: Adobe Mixamo Soldier model from the official Three.js examples.
- Detailed vehicle: Ferrari 458 Italia by vicent091036, via Three.js examples.
- Asphalt and concrete textures: Poly Haven, CC0.
- Streets, buildings, water and parks: © OpenStreetMap contributors, ODbL 1.0.

See `public/assets/CREDITS.md`. The raw OSM snapshot, lake relation, and derived map are included in `public/assets/austin/`. Rebuild the derived JSON with:

```sh
python3 scripts/prepare-austin.py public/assets/austin/osm-source.osm public/assets/austin/lady-bird-lake.osm
```

All active models, textures, map data and Draco decoding files are served locally. Google Fonts load online with system fallbacks. `dist/` can be deployed to static hosting.

### Phasing and wall running
Hold **Q** or the on-screen **Q · PHASE** button to pass through buildings and traffic. Release in open space; releasing inside a building returns you to the last clear position. Water and map boundaries remain solid.

Jump toward a building at speed and keep pressing toward it to run up its wall. **Space** pushes away. Reach the top to run onto the roof; stepping off resumes gravity. Wall running uses the running animation with the character oriented against the wall.

### Superhero visuals
The active character is Quaternius’s CC0 Superhero Male, wearing a custom red-and-gold speedster suit, with compatible Idle/Walk/Sprint clips. Hold Q to visibly vibrate and shimmer. Branching lightning attaches to animated hands, feet and torso; its short fading wake follows the actual path through turns, jumps and wall runs. Effects use simulation time and freeze when paused. Asset sources and licenses are listed in `public/assets/CREDITS.md`.

### Responsive physics and detailed Austin streets
Steering now separates finite turning speed from forward acceleration: a 90-degree turn settles in roughly 0.2 seconds on pavement. Braking, reversal, air control, grip, step height, jump buffering and ledge grace are centralized in `PHYSICS` in `src/game.js`. Releasing boost decelerates without snapping to the normal speed cap. Road/sidewalk/grass/gravel queries share the map geometry; small curbs step up and ledges resume gravity. Trees and large fixtures have collision shapes and cannot trigger wall runs.

The OSM converter now preserves 3,683 mapped street features. The scene adds raised sidewalks, zebra crossings, street signs, traffic signal fixtures, benches, bins, bicycle racks, fountains, park trees, bridge rails, textured grass, varied brick/stone facades, roof caps and cornices. Additional boulevard trees are generated where the map is sparse. **M** or **Expand** opens a detailed street map with zoom, drag-to-pan and selectable landmarks. Base terrain remains flat; this is a generalized playable reconstruction, not photogrammetry or surveyed architecture.

### Visual polish and jump control
The superhero uses the original CC0 sculpted normal map, a woven suit shader, contrasting panels and metallic trim. Softer sunlight, refined glass and pavement materials, and irregular tree canopies improve the streetscape. Hold Space for a full jump or release early for a shorter hop. Air steering redirects existing momentum; descent gravity is 1.45× takeoff gravity, and landing compression scales with impact.
