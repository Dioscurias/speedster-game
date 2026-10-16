# Site intro implementation plan

**Goal:** Use the supplied manta-ray film as a skippable opening to the Manta Ray homepage.

**Architecture:** A native full-screen dialog sits above the existing homepage. It loads the film only for the first eligible visit in a tab, starts muted, and fades into the existing site when the film ends or is skipped. Existing design tokens, homepage sections and game routes stay intact.

**Tech stack:** Native HTML video and dialog, existing vanilla JavaScript/CSS and motion controls, FFmpeg for web encoding, Playwright for behavior verification.

## Behavior

- Preserve all 10 seconds and the full frame of the supplied film. Use H.264/AAC MP4 with fast-start metadata, plus a smaller 768px version for phones and a still poster.
- Show the film only on Home, once per tab. Direct section links, reduced motion and data-saving mode go straight to the site without downloading the film.
- Start muted, with Sound and Skip intro controls. Escape also skips. Use native modal focus behavior and restore focus after closing.
- Stop site scrolling while the film is open. On completion, fade out and resume site motion. Skip immediately if playback fails or cannot start. A timeout prevents a stalled connection from holding the site open.
- Keep video framing intact with object-fit: contain. Keep controls within mobile safe areas.
- Do not insert the intro into the Speedster play route or the live game preview.

## Tasks

1. Encode the supplied clip into `public/brand/manta-intro.mp4`, `manta-intro-mobile.mp4` and `manta-intro-poster.jpg`. Check duration, codecs, framing and file sizes.
2. Add `scripts/intro-browser-check.mjs` for first playback, audio control, skip, Escape, real video completion, session persistence, reduced motion, direct links, playback errors and phone controls. Run against the existing site to observe the missing intro.
3. Implement `src/lab/intro.js` and `src/lab/intro.css`. Render the closed dialog only on Home in `src/lab/pages.js`; mount and dispose its behavior from `src/lab/app.js`.
4. Update browser suite setup to dismiss the intro when checking the underlying homepage. Verify the new intro separately and run the existing release tests and build.
5. Review the scoped changes, publish only the verified files to GitHub and Vercel, and confirm actual playback on the public site. Preserve all unrelated pending mobile and physics changes.
