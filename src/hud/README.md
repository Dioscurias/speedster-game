# Hero Roam HUD

`manta-hud.js` mounts the instruments once. `manta-layout.js` feeds it a view of the current game, network, and parkour ability state. `hud-model.js` normalizes values and selects the active character’s ability readouts. Adjust sizes and colors in `manta-hud.css`.

The radar is heading-up. The CSS north marker rotates with heading, and the canvas renderer draws the local arrow and nearby points.
