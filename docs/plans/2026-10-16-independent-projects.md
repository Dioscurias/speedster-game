# Independent Manta Ray and Speedster projects

Goal: two sibling folders, two GitHub repositories and two Vercel projects, with Speedster still accessible from Manta.

Architecture: extract the existing app sources into self-contained project roots. Copy the required UI code and fonts into each project so neither reads files from its sibling. Keep the existing Speedster repository history, game domain and multiplayer API. Publish Manta in Dioscurias/manta-ray with its own Vercel project. Manta retains its Play route and embeds Speedster cross-origin using explicit allowed origins and source validation. No game or design rewrite.

1. Back up the current tracked tree and pending edits. Write failing independent-root and origin validation tests.
2. Extract two clean releases with local src, public, tests, package files and Vite configurations. Scope dependencies and keep media in its owning repository.
3. Update the cross-origin Play bridge, map preview URLs, canonical URLs and legacy redirects. Validate incoming messages against both the expected origin and iframe window.
4. Run each app's unit tests, install and build independently, then test real browsers across separate local origins. Verify HUD, names, maps, cancel/resume, leave, intro, responsive pages and direct game access.
5. Review. Create the new Manta Git repository, commit the game-only extraction to the existing repository, connect separate Vercel projects and deploy. Preserve pending native and physics work locally without publishing it.
6. Check both live hosts and cross-origin Play flow. Report folder paths, repositories and hosting URLs.
