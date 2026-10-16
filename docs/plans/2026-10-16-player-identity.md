# Player identity implementation plan

**Goal:** Each Austin player has one suit color on every screen and a chosen, saved display name.

**Architecture:** Keep room-assigned color indices authoritative. Apply the same index to the local runner and remote clones. Preserve a fabric mask so recoloring an already colored character remains correct. Share one bounded name sanitizer between the room API and the browser. Store the chosen name locally, send it with presence updates, and render the server-returned name as canvas text.

**Tech stack:** Existing vanilla JavaScript, Three.js, Vercel room API, native forms, Node tests and Playwright.

## Design

- Add a Player name field to the existing Austin loading screen before first entry. Returning players can launch automatically using their saved name. Empty names use Speedster. Names have a 20-character limit and strip control characters.
- Add a Player name action to the pause menu, using the existing dialog and visual tokens. Typing must not trigger game keys. No new always-visible HUD controls.
- Existing room state owns suit colors. Every response updates the local runner and any peer whose assigned color changed. Changing a name does not change color, health or position.
- The renderer uses canvas text, not HTML, for peer names. Names and colors survive room serialization and active-session refreshes. Preview mode stays outside multiplayer.
- Keep unrelated pending mobile and physics changes out of the published release.

## Tasks

1. Write regression tests for recoloring a colored clone, repeated local recoloring, room name propagation, bounded names and persisted room identities. Run them and observe the missing behavior.
2. Add `src/player-profile.js` for name normalization and resilient local storage. Extend `src/room-engine.js` and `api/room.js` to accept and return sanitized names. Run room and profile tests.
3. Update `src/superhero.js` to retain the original fabric mask and isolate each character's geometry. Apply room colors to the local runner and remote avatars in `src/multiplayer.js`. Show each peer's chosen name. Run identity tests.
4. Add the loading-screen field and pause-menu edit form in `src/manta-layout.js`, with small styles in `src/manta-layout.css`. Ensure form keys do not reach the engine and saved names skip the initial prompt. Update browser checks to enter a name.
5. Run all tests, build an exact scoped release, and test two independent clients against the room API. Check matching local and remote colors, names, movement, rename propagation, refresh persistence and phone-sized forms. Publish the verified scope to GitHub and Vercel, then repeat the two-player check live.
