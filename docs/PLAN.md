# Unit Cell Designer Plan

## Purpose

Build an interactive browser application for designing colored periodic two-dimensional cell structures, recording their CW-complex decomposition, and computing the symmetry remaining after geometry and colors are considered.

## Release 0.1: Functional Editor Foundation

Status: implemented, browser-verified, committed and synchronized to the private GitHub repository `nasqret/symm` on 2026-05-24.

1. Establish a React/Vite/TypeScript app and durable project documentation.
2. Represent a motif in fractional lattice coordinates with periodic edge shifts.
3. Render the central unit cell together with translated copies so edges and faces crossing the boundary are visible.
4. Implement vertex insertion, periodic edge creation, face coloring and clearing, merge-colored
   vertex/edge deletion, palette selection, history, JSON save/load, and autosave.
   The editor now uses foldable construction sections and grays preset motifs outside the
   selected canonical lattice family; paint swatches support numeric keys and vertical swipe
   cycling while painting.
5. Extract face cycles from the periodic graph for colored symmetry computation; keep the
   CW-complex diagnostic inventory hidden from the current editor surface.
6. Test lattice-compatible symmetry operations against geometry and colors; display accepted generators and the classified plane group.
7. Supply editable starting motives and notes for all 17 plane groups, using nonempty minimal
   visible decorations so every starter demonstrates face coloring.
8. Provide a first-open guide and an About page to introduce the construction and analysis
   workflow. Implemented on 2026-05-25.
9. Verify builds and core browser workflows, commit locally, and sync to a private GitHub repository. Completed on `main` with the private `origin` remote `nasqret/symm`.

## Release 0.2: Mathematical Validation

1. Validate each preset against standard-setting generator data from the Bilbao Crystallographic Server / International Tables.
2. Introduce conventional versus primitive unit-cell conversion, especially centered rectangular groups.
3. Add explicit mirror, glide, rotation-center and fundamental-domain overlays. Initial
   selectable generator overlays implemented on 2026-05-25; conventional-setting validation
   remains.
4. Provide symmetry-preserving editing by applying motif and color edits over a locked
   generator closure. Implemented on 2026-05-25; exact-group validation now blocks a propagated
   edit that would accidentally enlarge or reduce the locked symmetry type, and the editor now
   enables this lock by default for the initially loaded group.
5. Add automated regression fixtures: each standard preset must classify as its target group before and after JSON round-trip.
6. Record saved user motives in group-specific knowledge-base manifests.

## Release 0.3: Design and Export

1. Support free lattice-parameter editing and constraint-aware snapping.
2. Add robust face editing, vertex dragging, edge splitting and color legend management.
3. Export SVG/PNG tiles and a structured CW-complex/symmetry report. Standalone preview SVG
   export and low/medium/high PNG output implemented on 2026-05-25, together with persistent
   edge/vertex layer hiding for face-only editor and export views; structured report remains.
4. Package sharable examples and a teaching tour of all groups. Ambient preview and animated
   subgroup exploration implemented on 2026-05-25; the explorer now reconstructs the supplied
   17-node standard-label hierarchy, highlights the live group, and performs the featured
   `p6mm -> p1 -> p4mm -> p4gm -> p1` exploration with restrained fixed-lattice color
   transitions that flicker only minimal nonblank verified accent witnesses before
   settling, plus an affine SVG `p1` homotopy when changing lattice family.

## Release 0.4: Public Touch Presentation

1. Publish the Vite application through GitHub Pages from `main`, with the project-path build
   base and an Actions deployment workflow. Implemented on 2026-05-25.
2. Provide a phone-sized touch interface using translucent foldable icon tabs and enlarged
   palette targets. Implemented on 2026-05-25.
3. Restrict mobile interaction to selecting prepared motifs, recoloring faces, visibility,
   symmetry inspection, state/preview and export operations; remove topology editing paths and
   disable the subgroup explorer at phone widths. Implemented on 2026-05-25.
4. Support direct touch recoloring on a selected tile with a press-and-hold color roller that
   coexists with tap clearing, vertical palette swipe and pinch zoom. Implemented on 2026-05-26.
5. Keep the active unit-cell frame visible in mobile face-only editing and expose in-canvas
   lattice/group selectors plus tap-to-show current symmetry generators when all outer panels
   are hidden. Implemented on 2026-05-26.
6. Keep core mobile navigation reachable from the drawing surface with a bottom icon dock for
   tiling preview, undo and redo. Implemented on 2026-05-26.
7. Add a reversible mobile clean-view cog that suppresses every menu and dock action except
   its pale restore affordance while retaining the prior fold state. Implemented on 2026-05-26.

## Architecture Decisions

- Fractional coordinates make translation periodicity explicit and keep saved motifs independent of display zoom.
- An edge stores an integer shift to its endpoint, so geometry extending outside the selected cell is first-class data rather than clipped artwork.
- Symmetry is computed from the decorated complex: an operation is accepted only when it maps
  vertices, edges and face colors correctly, including faces with nested holes.
- Symmetry-preserving editing closes only the displayed group generators when enabled; periodic
  translations are already encoded by the motif, and incidental accepted subcell translations
  must not over-propagate a user's edit. The loaded group's lock is enabled when an editor
  session starts and remains explicitly switchable for unconstrained work.
- Export and animated presentation operate on the clean repeated-tiling view, without the
  editor's unit-cell outlines or highlight; skewed lattice previews render a wider periodic
  neighborhood so the rectangular output viewport remains completely filled.
- Edge and vertex visibility is presentation state stored independently from motif JSON and
  shared by editor, preview/export and animated presentation windows; omitted SVG groups stay
  omitted when the preview is serialized or rasterized.
- Explorer-only fields retain the editor's paper-colored background and color the minimum
  nonempty complete witness orbits needed for each selected stage while retaining one lattice
  family's vertices and edges; the resulting colored symbol is checked before it is described
  in the presentation.
- The subgroup display is a reconstruction of the supplied standard-symbol hierarchy for all
  17 wallpaper-group types. It is not the infinite subgroup poset: finite-index translation
  copies of a type are intentionally collapsed to one node.
- A cross-family selection first descends to `p1` through recoloring on the unchanged lattice,
  then applies an SVG affine basis homotopy while contracting the old edge layer and expanding
  the new one before applying the target colors.
- Presets are editable starting points, while the knowledge base tracks mathematical validation status separately.
- Mobile mode deliberately treats motifs as fixed geometry: it forces the color tool in the
  canvas and removes topology/editing navigation rather than relying on hidden controls alone.
- Mobile face gestures are disambiguated before an edit commits: tap applies the existing
  toggle behavior, vertical movement cycles the current swatch, a sustained single touch opens
  the tile-local color roller, and a second touch transfers control to pinch zoom.
- Hiding motif edges removes repeated construction boundaries and face seams, but the editor
  retains one active unit-cell outline so lattice changes remain legible in face-only mode.
- Fully collapsed mobile editing keeps lattice and starter-group selection inside the canvas,
  with the live detected group acting as a toggle for its visual generators.
- The mobile canvas footer repeats the preview and history actions as icon buttons so users do
  not need to restore the document menu during direct recoloring.
- The mobile cog clean view suppresses chrome without overwriting menu/panel fold state; its
  lone pale restore cog must remain reachable over the drawing surface.
- GitHub Pages publishes the repository application under `/symm/`, so the Vite production
  base path is part of deployment correctness.

## Acceptance Checks For Every Cycle

Use [TASKS.md](TASKS.md) before ending an implementation cycle. Update [JOURNAL.md](JOURNAL.md) with concrete work and validation evidence.
