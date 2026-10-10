# Map selector visual refresh

**Goal:** Restyle the browser map selector in the restrained, image-led direction requested by the user, using Anduril as a reference.

**Design:** Keep the existing DM Sans and Space Grotesk typefaces. Use near-black, warm white, neutral grays, thin rules and square corners. Replace decorative building illustrations with locally captured gameplay views of Austin and The Last Household. Keep map names and multiplayer/single-player metadata; remove promotional headings, descriptions and repeated instructions. Selected maps receive an explicit text/check indicator and white edge; a white Play action launches the existing embedded player.

**Implementation:** Modify only `src/player-page.js`, `src/player-page.css`, the document metadata in `index.html`, and local preview assets. Preserve game physics, map content, touch work, and existing uncommitted changes. The layout remains two columns on desktop and one column on phones. Keep semantic native radios and visible keyboard focus.

**Validation:** Check the selector at desktop, phone portrait and landscape sizes, radio keyboard selection, disabled launch behavior, both maps starting, map switching, and fullscreen. Run the existing player browser checks, unit suite and production build. Inspect final screenshots for image crop, spacing, typography and contrast.

**Alternatives considered:** A full-screen carousel would hide the second map; text-only rows would lose the strong imagery of the reference. Two image panels retain the existing quick comparison and selection flow.
