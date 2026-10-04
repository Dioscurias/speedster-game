# Minimap Clarity Design

The circular HUD map will use a square canvas whose backing resolution follows its rendered size and the device pixel ratio. This removes the current distortion caused by stretching a 240 × 118 drawing into a circle and keeps road edges sharp on high-density displays.

The map projection will show a wider, stable area around the player. The player remains centered, with a larger gold directional arrow, dark outline, and restrained glow so it stays readable against roads and buildings. World geometry stays correctly proportioned and the existing circular HUD placement remains unchanged.

Validation will cover the canvas sizing calculation with a unit test and use the existing browser smoke test plus a rendered screenshot to confirm the map is sharp, zoomed out, and readable.
