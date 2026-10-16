# Manta Ray lab implementation plan

**Goal:** Restructure the existing site into a lab with four data-driven projects, retaining the established design and the Speedster HUD on its play page only.

**Architecture:** Keep Vite and vanilla JavaScript. Share pure render functions between the browser and a Vite static-page generator for real per-route HTML and SEO. Keep all project records in `src/data/projects.ts` and all missing values tied to one `PLACEHOLDER` constant. Isolate game rendering in a same-origin iframe, with a separate HUD-free preview mode. Preserve pending unrelated mobile and physics edits.

**Tech stack:** Existing CSS tokens, Inter / Barlow Condensed, local JetBrains Mono for metadata, Phosphor SVGs, Lenis and GSAP. Build-time resvg generates a common PNG OG template.

## Design decisions

- Home follows the supplied eight-section order; Projects, About and each project get direct routes.
- Headline 1: Build what comes next. Alternatives: From an idea to something real. A place for the next idea.
- No status, stage, year, external URL, media or contact detail is inferred. Unassigned projects appear in a separate TBD lane beneath Idea / Prototype / Beta / Live.
- Speedster has its own display title. The lab manta stays on lab pages; the game radar uses a neutral heading marker. HUD geometry, values, controls and behavior stay unchanged.
- Project body sections and missing media visibly show TBD. No fabricated case study, team, results or log dates.

## Implementation and validation

1. Write tests for the single data source, placeholder preservation, filtering, stage grouping, automatic routes, project SEO and escaped rendering. Observe missing-module failures.
2. Add shared pure brand/icon markup, tokens extension, ProjectRow, StatusChip, StageTrack, SpecimenFrame, FilterSegmented, LogEntry and ProjectPage.
3. Build Home, Projects, About, project and Speedster play pages. Add restrained particle and scroll motion, contact ring composition, native navigation/maps dialogs and clipboard behavior with a disabled missing-email state.
4. Generate static route HTML, canonical/OG metadata, PNGs, Organization JSON-LD, sitemap and 404. Keep the game shell separate from lab HTML.
5. Test source and the exact staged production build. Check direct route refreshes, SEO without JavaScript, filters, all projects, reduced motion, responsive layouts, preview without HUD, and the complete existing game HUD. Verify physics/network/HUD model and CSS hashes stay unchanged.
6. Package full source files with a wiring checklist in the requested order. Publish the verified UI through the existing GitHub/Vercel workflow.
