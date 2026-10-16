# Active game assets

## Austin map
© OpenStreetMap contributors. Open Database License (ODbL) 1.0.
- Attribution/license: https://www.openstreetmap.org/copyright
- Source map API: https://api.openstreetmap.org/api/0.6/map?bbox=-97.752,30.259,-97.735,30.281
- Lady Bird Lake relation: https://api.openstreetmap.org/api/0.6/relation/32671/full
- Local original snapshots: austin/osm-source.osm and austin/lady-bird-lake.osm
- Derived database: austin/map.json, distributed under ODbL 1.0.
- Mapped trees, benches, lamps, crossings, signals, fountains and named places are preserved from the same snapshot. Extra boulevard trees are generated and labeled as such in the prepared runtime map. Curb widths, fixture shapes, facade styling and bridge rails are generalized. Base terrain has no surveyed elevation model.
- Conversion code: scripts/prepare-austin.py. Coordinates projected to local meters. Untagged building heights are estimated from a default three floors. Rendered facades and the Capitol dome are generalized.

## Animated superhero
Quaternius, Universal Base Characters (Superhero Male) and Universal Animation Library, CC0 1.0.
- Creator/model: https://quaternius.com/packs/universalbasecharacters.html
- Original model download: https://quaternius.itch.io/universal-base-characters
- Animations: https://quaternius.itch.io/universal-animation-library
- Model source: Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf
- Animation source: Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb
- Downloaded September 23, 2026. Original licenses: human/QUATERNIUS-LICENSE.txt and human/ANIMATION-LICENSE.txt.
- Local package: human/Superhero.glb. Original mesh and skeleton, selected Idle/Walk/Sprint rotations adjusted to the hero reference pose; source joint lengths preserved. Red/gold suit, cowl, emblem, ear fins and emissive eyes applied by the game.
- Rebuild: python3 scripts/prepare-superhero.py /path/to/model-pack.zip /path/to/animation-pack.zip
- Earlier Soldier.glb retained for reference but no longer loaded: Adobe Mixamo via https://threejs.org/examples/webgl_animation_multiple.html .

## Detailed vehicle
Ferrari 458 Italia by vicent091036.
- Original author page: https://sketchfab.com/3d-models/ferrari-458-italia-57bf6cc56931426e87494f554df1dab6
- Official source/attribution: https://threejs.org/examples/webgl_materials_car.html
- Download: https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/ferrari.glb
Body colors varied in-game. Not represented as CC0.

## Textures
Poly Haven, CC0.
- Asphalt 02: https://polyhaven.com/a/asphalt_02 — diffuse and OpenGL normal, 1K.
- Concrete Floor 02: https://polyhaven.com/a/concrete_floor_02 — diffuse, 1K.
- Brick Wall 001: https://polyhaven.com/a/brick_wall_001 — diffuse and OpenGL normal, 1K, CC0.
- Aerial Grass Rock: https://polyhaven.com/a/aerial_grass_rock — diffuse and OpenGL normal, 1K, CC0.
Concrete colors are neutralized by the game material shader.

## Runtime libraries
Three.js: MIT. Draco decoder files supplied by Three.js (Google Draco, Apache-2.0).

## Earlier prototype assets (retained but no longer loaded)
Kenney City Kit (Commercial), Car Kit and Blocky Characters are CC0. Their original license files remain in city/, cars/ and runner/.

Superhero suit normal map: T_Superhero_Male_Normal.png from the original Quaternius Universal Base Characters Standard pack (CC0), reused with custom suit coloring.
