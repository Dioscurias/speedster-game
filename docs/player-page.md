# Player page and responsive HUD

`/play` (also the home page) presents Austin and The Last Household as map choices. Neither game is loaded before the user selects a map and presses Play. Play creates a same-origin iframe and starts the chosen map. Change map destroys the frame and returns to selection. Full screen expands the player section, including its toolbar and embedded game; browsers without Fullscreen API support show an inline message.

`player-page.js` owns selection and the player frame. `game-layout.js` arranges each game's existing DOM into a toolbar, canvas viewport, scrollable status rail, and wrapping controls row. Gameplay selectors remain intact. The status rail scrolls on small or short screens so its contents cannot cover the game or controls. Pause and completion menus overlay only the canvas. Parkour observes its canvas container to update the renderer and camera aspect ratio after resizing.

Direct embedded routes use `/?embed=1&map=austin` or `/?embed=1&map=parkour`. The parent adds `autoplay=1` after the player explicitly presses Play. Vercel rewrites `/play` to the application entry page.

Run `node scripts/player-browser-check.mjs` against the dev server to verify selection gating, both map launches, switching maps, fullscreen, and visible HUD bounds at desktop, phone, and landscape sizes. Existing Austin and parkour browser suites run against the embedded routes.
