# Reusable Cycle Checklist

Run this checklist on every implementation cycle.

## Begin

- [ ] Read `docs/PLAN.md`, recent `docs/JOURNAL.md` entries and relevant group notes.
- [ ] Inspect `git status --short --branch` and do not overwrite unrelated work.
- [ ] Pull or reconcile the private remote once it exists and authentication is valid.
- [ ] Identify the bounded feature or validation objective for this cycle.

## Implement

- [ ] Keep periodic geometry encoded through fractional coordinates and edge shifts.
- [ ] Update symmetry behavior when editing geometry or color semantics.
- [ ] Add or update preset/group knowledge notes when a standard motif changes.
- [ ] Keep exported state backward-compatible or record a schema migration.

## Verify

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Exercise add vertex, connect periodic edge, color face, undo/redo, save/load and preview workflows in the browser when affected.
- [ ] Confirm symmetry changes when an intentionally asymmetric face color is applied.

## Close

- [ ] Append concrete evidence and remaining risks to `docs/JOURNAL.md`.
- [ ] Update `docs/PROJECT_MEMORY.md` only with reusable project lessons.
- [ ] Review the diff and commit intended files.
- [ ] Push to the private GitHub remote when configured and authenticated.

## Cycle Record: 2026-05-24 Release 0.1

- [x] Read project requirements and established the plan/journal/knowledge-base scaffold.
- [x] Implemented periodic geometry, colored symmetry, persistence, history, preview and all 17 presets.
- [x] Ran `npm run typecheck` and `npm run build`.
- [x] Exercised editing, symmetry-breaking color, undo/redo, JSON round-trip, boundary-crossing edge and preview synchronization workflows.
- [x] Verified all 17 preset classifications and mobile horizontal-overflow check.
- [x] Updated the journal, design ledger, group notes and project memory.
- [x] Reviewed the diff and created the initial local commit on `main`.
- [x] Created and pushed the private GitHub repository `nasqret/symm`; `main` tracks `origin/main`.

## Cycle Record: 2026-05-24 Face Clearing And Topology Deletion

- [x] Implemented painted-face clearing in Color face mode.
- [x] Implemented selected-color edge and vertex removal in Select / delete mode.
- [x] Preserved topology-aware face coloring and removed stale deleted-face color entries.
- [x] Ran `npm run typecheck` and `npm run build`.
- [x] Browser-verified clearing, edge deletion, vertex deletion, undo restoration and error-free rendering.

## Cycle Record: 2026-05-24 Nested Face Independence

- [x] Added local reproduction data directory to `.gitignore` and inspected the supplied JSON state.
- [x] Reproduced the overlapping nested-face hit-target defect.
- [x] Implemented hole-aware face regions, rendering and symmetry sampling.
- [x] Verified independent painting of the inner parallelogram and its enclosing ring.
- [x] Ran `npm run typecheck`, `npm run build` and a full 17-preset classification regression sweep.

## Cycle Record: 2026-05-24 Grid-Only Vertex Editing

- [x] Replaced implicit free-canvas vertex placement with visible permitted grid points.
- [x] Enabled double-click vertex removal directly in Add / remove vertex mode.
- [x] Ran `npm run typecheck`, `npm run build` and browser interaction verification.

## Cycle Record: 2026-05-25 Minimal Preset Decorations

- [x] Replaced all-orbit coloring with minimal target-symmetry witness decorations.
- [x] Recorded per-group painted-region counts and clarified the archived `p4m` JSON fixture.
- [x] Ran `npm run typecheck`, `npm run build` and rendered full-preset regression checks.

## Cycle Record: 2026-05-25 Symmetry Visualization And Preserving Edits

- [x] Made reported symmetry generators selectable and rendered translation, rotation, mirror
  and glide overlays in the working tiling.
- [x] Added opt-in locked-group propagation for face, vertex and edge mutations.
- [x] Kept persisted document state backward-compatible and recorded the generator-closure rule.
- [x] Ran `npm run typecheck`, `npm run build` and rendered checks for translation, centering,
  mirror, rotation, glide, coloring, vertex insertion/removal and edge removal paths.

## Cycle Record: 2026-05-25 Export, Ambient Preview And Animated Exploration

- [x] Converted preview rendering into a clean, uniformly repeated tiling output surface.
- [x] Added standalone SVG and three-resolution PNG export from the preview.
- [x] Added ambient preview display and animated subgroup-exploration presentation controls.
- [x] Corrected hash navigation and skew-lattice coverage found during rendered QA.
- [x] Ran `npm run typecheck`, `npm run build`, artifact dimension checks, desktop interaction
  checks and mobile no-overflow checks.

## Cycle Record: 2026-05-25 Face-Only Display And Export

- [x] Added persisted edge and vertex layer controls shared by editor, preview/export and demo.
- [x] Suppressed hidden motif groups, and the vertex editing grid, directly in SVG rendering.
- [x] Verified live preview synchronization and downloaded face-only SVG/PNG output.
- [x] Ran `npm run typecheck`, `npm run build`, rendered desktop checks and mobile no-overflow
  checks without browser page errors.

## Cycle Record: 2026-05-25 Immersive Guided Subgroup Explorer

- [x] Added a navigable guided-route graph with current-node and traversed-inclusion states.
- [x] Added cached, group-invariant chromatic presentation fields with classification fallback.
- [x] Added immersive styling, source/chromatic switching, ambient integration and corrected
  reduced-motion behavior.
- [x] Verified all displayed graph nodes, playback and mode controls, desktop/mobile layout,
  reduced-motion rendering, `npm run typecheck` and `npm run build`.

## Cycle Record: 2026-05-25 Complete Type Graph And Fixed-Lattice Descent

- [x] Replaced guided branches with the 17-type indexed subgroup-relation graph.
- [x] Preserved vertices, edges and lattice parameters during within-family color descent.
- [x] Routed cross-family moves through `p1` with basis interpolation and contracting/expanding
  motif edges.
- [x] Clarified in the UI and documentation that finite-index translation copies are suppressed.
- [x] Ran `npm run build` and rendered browser checks across hexagonal, square, rectangular and
  generic states, including a `390 x 844` no-overflow check, without page errors.
