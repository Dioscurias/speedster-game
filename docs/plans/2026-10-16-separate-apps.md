# Separate Manta Ray and Speedster

Goal: Give the lab and game separate application folders, entry points, assets, and development/build commands while preserving access through Manta Ray.

Architecture: Keep one repository and one composed Vercel deployment. `apps/manta` owns lab pages, project data, branding, intro and promotional media. `apps/speedster` owns both game modes, HUD, physics, models, city data and multiplayer implementation. `packages/ui` owns the existing shared styles and controls. `packages/game-bridge` owns route constants, map metadata and the map-picker shared by the host and standalone game. The root API is a deployment adapter.

The Manta play page embeds `/speedster/`. Existing `/projects/speedster/play` links stay valid, and legacy `?embed=1` links redirect to the game entry. Default development serves both applications on one origin; each app also has its own development and build command.

1. Add tests for separate entries, client dependency boundaries, route compatibility and asset ownership. Observe failure before implementation.
2. Snapshot the existing pending files. Run the same path migration on the working tree and a clean HEAD archive, preserving pending changes only in the working tree.
3. Move application files and assets, rewrite imports and test references, and extract the shared UI and integration contract.
4. Add independent Vite configurations, a composed build, combined development hosting, and standalone game map selection. Preserve existing routes and message-origin checks.
5. Verify clean release unit tests, both standalone builds, composed build, combined development, intro, 4K media, both game modes, name/color synchronization and mobile controls. Confirm all pre-existing working-tree tests still pass.
6. Review, stage only the clean migration versions, publish and verify the public routes. Keep pending physics and mobile changes uncommitted at their new locations.

No visual redesign and no new runtime dependencies. The already committed 4K media upgrade remains part of the published source.
