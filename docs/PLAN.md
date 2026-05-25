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
7. Supply editable starting motives and notes for all 17 plane groups.
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
   `p6mm -> p1 -> p4mm -> p4gm -> p1` exploration with fixed-lattice chromatic transitions
   that flicker only minimal verified accent witnesses with accelerating frequency before
   settling, plus an affine SVG `p1` homotopy when changing lattice family.

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
- Explorer-only fields retain a common background and color the minimum complete witness orbits
  needed for each selected stage while retaining one lattice family's vertices and edges; the
  resulting colored symbol is checked before it is described in the presentation.
- The subgroup display is a reconstruction of the supplied standard-symbol hierarchy for all
  17 wallpaper-group types. It is not the infinite subgroup poset: finite-index translation
  copies of a type are intentionally collapsed to one node.
- A cross-family selection first descends to `p1` through recoloring on the unchanged lattice,
  then applies an SVG affine basis homotopy while contracting the old edge layer and expanding
  the new one before applying the target colors.
- Presets are editable starting points, while the knowledge base tracks mathematical validation status separately.

## Acceptance Checks For Every Cycle

Use [TASKS.md](TASKS.md) before ending an implementation cycle. Update [JOURNAL.md](JOURNAL.md) with concrete work and validation evidence.
