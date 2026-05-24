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
5. Extract face cycles from the periodic graph and show the resulting CW-complex inventory.
6. Test lattice-compatible symmetry operations against geometry and colors; display accepted generators and the classified plane group.
7. Supply editable starting motives and notes for all 17 plane groups.
8. Verify builds and core browser workflows, commit locally, and sync to a private GitHub repository. Completed on `main` with the private `origin` remote `nasqret/symm`.

## Release 0.2: Mathematical Validation

1. Validate each preset against standard-setting generator data from the Bilbao Crystallographic Server / International Tables.
2. Introduce conventional versus primitive unit-cell conversion, especially centered rectangular groups.
3. Add explicit mirror, glide, rotation-center and fundamental-domain overlays.
4. Add automated regression fixtures: each standard preset must classify as its target group before and after JSON round-trip.
5. Record saved user motives in group-specific knowledge-base manifests.

## Release 0.3: Design and Export

1. Support free lattice-parameter editing and constraint-aware snapping.
2. Add robust face editing, vertex dragging, edge splitting and color legend management.
3. Export SVG/PNG tiles and a structured CW-complex/symmetry report.
4. Package sharable examples and a teaching tour of all groups.

## Architecture Decisions

- Fractional coordinates make translation periodicity explicit and keep saved motifs independent of display zoom.
- An edge stores an integer shift to its endpoint, so geometry extending outside the selected cell is first-class data rather than clipped artwork.
- Symmetry is computed from the decorated complex: an operation is accepted only when it maps vertices, edges and face colors correctly.
- Presets are editable starting points, while the knowledge base tracks mathematical validation status separately.

## Acceptance Checks For Every Cycle

Use [TASKS.md](TASKS.md) before ending an implementation cycle. Update [JOURNAL.md](JOURNAL.md) with concrete work and validation evidence.
