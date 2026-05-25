# Project Journal

## 2026-05-24: Project Start

- Received the brief for an interactive colored unit-cell editor, symmetry computation, 17 wallpaper-group presets, persistent state, preview, history, and durable documentation.
- Confirmed the working directory was initially empty and not a Git repository.
- Initialized a local Git repository on branch `main`.
- Adopted React, Vite and TypeScript for the multi-panel browser editor.
- Generated a complete primary-screen design concept for an open, geometry-studio interface with central periodic canvas, left editing toolbar and right mathematical inspector.
- Consulted IUCr material for the list and standard notation of the 17 plane groups and Bilbao Crystallographic Server availability of generator/general-position data.
- Started release 0.1 implementation and the group-organized knowledge base.

## 2026-05-24: Release 0.1 Implementation And Verification

- Built a React/Vite/TypeScript editor with lattice selection, periodic vertex/edge construction, face coloring, JSON export/import, local autosave, undo/redo and a synchronized preview window.
- Implemented a periodic lifted-graph face extractor, CW-complex counts with torus Euler warning, and a symmetry tester that evaluates face colors as part of the decorated complex.
- Added generated editable motives for all 17 plane groups, a group-organized knowledge base, and a saved `p4m` JSON standard example.
- Corrected accidental preset supergroups by refining mesh/color orbits; corrected `pg` classification of a single glide family; cached face extraction during symmetry testing.
- Corrected UI defects found by rendered QA: active cell outline visibility, responsive overflow, and stale duplicated generator rows after switching presets.

### Validation Evidence

- `npm run typecheck`: passed.
- `npm run build`: passed; Vite production output generated successfully.
- Browser QA fallback at `1536 x 1024`: final `p4m` screen reports generators `T(a), T(b), C4, m` and `V - E + F = 0`.
- Preset sweep: `p1, p2, pm, pg, cm, pmm, pmg, pgg, cmm, p4, p4m, p4g, p3, p3m1, p31m, p6, p6m` each computed as the selected symbol with Euler-zero CW complex.
- Interaction path: painting one `p4m` face reduced colored symmetry to `p1`; Undo restored `p4m`; Redo restored the edit; loading `knowledge-base/motifs/p4m/standard-generated-v0.1.json` restored `p4m`.
- Periodic construction path: adding a short edge to a neighboring translated vertex changed `32/64/32` to `32/65/33` while retaining Euler value zero; a long crossing edge correctly surfaced a non-cellular warning.
- Preview path: an already-open `#preview` window updated from an edited generic document to loaded `p4m` through local storage synchronization.
- Responsive QA at `390 x 844`: vertically stacked layout renders without horizontal overflow.
- Repository path: initialized local `main` history and created the initial application commit after validating the complete staged diff.

### Open Items

- Standard-setting generator certification against crystallographic reference data remains release 0.2 work.
- User-drawn intersecting segments are detected through the Euler warning but are not automatically split at intersections.
- Private repository creation/synchronization was deferred at the end of the implementation pass while GitHub CLI authentication required renewal.

## 2026-05-24: Private Repository Sync

- Confirmed renewed GitHub CLI authentication for account `nasqret`.
- Confirmed no existing target repository or configured local remote before publishing.
- Created private repository `nasqret/symm`, configured SSH `origin`, and pushed `main`.
- Verified through the GitHub connector that `nasqret/symm` is private and that the local branch tracks `origin/main`.

## 2026-05-24: Face Clearing And Topology Deletion

- Added click-to-clear behavior for an already filled region in Color face mode; a background
  region can still be painted with the selected non-background swatch.
- Added double-click vertex and edge removal in Select / delete mode.
- On removal, any newly merged face is assigned the currently selected swatch; stale color records
  for faces removed by the topology change are dropped.
- Updated the tool guidance so the deletion mode and selected-swatch merge behavior are visible in
  the editor.

### Validation Evidence

- `npm run typecheck`: passed.
- `npm run build`: passed.
- Rendered `p4m` face-clear path: clicking a coral face changed it to the paper background,
  reduced stored colored faces from 32 to 31, and recomputed colored symmetry to `p1`.
- Rendered edge-removal path with dark swatch selected: double-click changed the CW counts from
  `32/64/32` to `32/63/31`, kept Euler value zero, and filled the merged face dark.
- Rendered vertex-removal path with dark swatch selected: double-click changed the CW counts from
  `32/64/32` to `31/60/29`, kept Euler value zero, and filled the merged face dark.
- Undo after vertex removal restored the original `p4m` `32/64/32` document; browser console and
  page-error checks reported no errors.

## 2026-05-24: Nested Face Independence Fix

- Inspected the local reproduction state in ignored `sources/problem_inside_color.json`; it
  contains a 4-sided inner parallelogram surrounded by a 12-sided enclosing region.
- Reproduced the defect: before the fix, a click at the inner parallelogram center hit the
  enclosing 12-sided face because both cycles were rendered as overlapping solid polygons.
- Extended extracted faces with hole boundaries and a hole-aware in-region sample point.
- Switched face rendering to even-odd SVG paths, made point-based face lookup exclude holes, and
  used the in-region sample for symmetry/color-orbit matching.

### Validation Evidence

- `npm run typecheck`: passed.
- `npm run build`: passed.
- Supplied reproduction state: after the fix the enclosing region renders with two SVG subpaths
  and center hit-testing resolves to the 4-sided inner face.
- Independent painting path: the inner parallelogram retained coral `#d66853` while the enclosing
  ring was separately painted yellow `#e0ab45`; the document stored 34 separate face colors.
- Preset regression sweep: all 17 built-in motifs still computed as their selected group with
  Euler value zero.
- Browser console and page-error checks reported no application errors during the reproduction.

## 2026-05-24: Grid-Only Vertex Editing

- Replaced unrestricted canvas clicking for vertex construction with visible permitted grid
  points in Add / remove vertex mode.
- Added a shared vertex-grid rule: generic, rectangular and square cells use sixteenths; the
  hexagonal cell uses tenths so the existing generated mesh remains aligned to visible points.
- Kept grid snapping in the mutation layer and enabled double-click vertex removal without
  switching away from Add / remove vertex mode.

### Validation Evidence

- `npm run typecheck`: passed.
- `npm run build`: passed.
- Rendered QA through the local `agent-browser` fallback: the generic editor displayed 289
  permitted grid points; a pointer event on the canvas outside a grid target left 288 displayed
  periodic vertex copies unchanged.
- Clicking an unoccupied grid point increased displayed periodic vertex copies from `288` to
  `297`; double-clicking that new vertex while Add / remove vertex remained active restored
  `288`.
- Switching to a hexagonal working cell while keeping the vertex tool active displayed its
  121-point tenth-step grid.
- Browser page-error checks reported no application errors.

## 2026-05-25: Minimal Preset Decorations

- Replaced the generated all-orbits color assignment with minimal non-background witness seeds
  expanded by each target group's required operations.
- Reduced the built-in presentation examples from 32 or 50 filled regions to between 0 and 8:
  `p2`, `cmm`, `p4m` and `p6m` need no fill; only `p1`, `pm` and `cm` require two colors for
  their minimal witnesses.
- Recorded the painted-region count for every group in the knowledge base and marked the saved
  release 0.1 `p4m` JSON as an archived fully decorated fixture.

### Validation Evidence

- `npm run typecheck`: passed.
- `npm run build`: passed.
- Rendered full-preset sweep through the local `agent-browser` fallback: selecting each of the
  17 group presets reported its requested computed symbol and `V - E + F = 0`.
- Rendered examples: `p1` showed two filled faces in the fundamental cell and reported `p1`;
  `p4m` showed zero filled faces and still reported `p4m`.
- Browser page-error checks reported no application errors.

## 2026-05-25: Symmetry Visualization And Preserving Edits

- Replaced the passive generator report with selectable symmetry elements in the inspector.
  Selecting a translation, rotation, mirror or glide renders its arrow, center arc, dashed
  locus or dashed axis/arrow directly on the repeated-cell canvas.
- Added `Preserve symmetry`, which locks the currently computed wallpaper-group generators and
  propagates face painting/clearing, vertex insertion/removal and edge insertion/removal over
  their operation closure.
- Used generator closure rather than every accepted operation: cell translations are already
  implicit in periodic motif storage, and incidental subcell translations in an undecorated
  mesh would otherwise duplicate an edit more aggressively than the selected group requires.
- Kept JSON state backward-compatible because the selected overlay and editing lock are
  interface state, not exported motif data.

### Validation Evidence

- `npm run typecheck`: passed.
- `npm run build`: passed, including TypeScript project compilation.
- Rendered translation/centering overlay checks: selecting `T(a)` and the `cm` centering
  generator each displayed a direction arrow in the canvas.
- Rendered `p4m` overlay checks through the local `agent-browser` fallback: selecting `m`
  displayed dashed mirror loci, and selecting `C4` displayed curved rotation arrows and marked
  centers.
- Rendered `pg` overlay check: selecting `g` displayed dashed glide axes with direction arrows.
- With `Preserve symmetry` locked to `p4m`, painting one face colored a four-face orbit and the
  computed group remained `p4m`.
- With the same lock, adding one unoccupied grid vertex changed `32` to `36` vertices and
  double-click removal returned it to `32`, retaining `p4m` after both actions.
- Locked edge removal changed the `p4m` counts from `32/64/32` to `32/60/29` and retained
  `p4m`; browser page-error checks reported no application errors.

## 2026-05-25: Tiling Export, Ambient Preview And Animated Exploration

- Converted the repeated-tiling preview into a clean output surface: it now displays translated
  tiles uniformly without central or repeated unit-cell construction outlines.
- Added standalone SVG export and PNG export at low (`900 x 690`), medium (`1800 x 1380`) and
  high (`3600 x 2760`) resolutions from the preview surface.
- Added ambient preview mode with subdued overlay controls and slow drifting presentation.
- Added the interactive `#demo` route, with hexagonal, square and rectangular subgroup-descent
  branches, play/pause, playback speeds, manual stage selection and an ambient mode. Stages
  cross-fade so changing coloring and changing motifs evolve smoothly between verified presets.
- Fixed hash routing so transitions between editor, preview and demo update an already-open app
  tab, and widened preview repetition coverage so slanted hexagonal tilings fill the export and
  animation viewport without an empty wedge.

### Validation Evidence

- `npm run typecheck`: passed.
- `npm run build`: passed.
- Rendered preview through the local `agent-browser` fallback: the output canvas contained no
  unit-cell construction outlines or active-face emphasis and ambient mode enabled its drift
  animation.
- Download verification: SVG exported as an SVG image; low, medium and high PNG exports were
  verified as `900 x 690`, `1800 x 1380` and `3600 x 2760` images respectively.
- Rendered demo transition: fast hexagonal playback advanced `p6m` to `p6` with simultaneous
  departing and arriving layers during the cross-fade, with full skew-lattice canvas coverage.
- Interactive demo controls: pause, square-branch selection, manual `p2` selection, ambient
  mode and Return to editor all produced the corresponding rendered state.
- Mobile QA at `390 x 844`: preview and non-ambient demo controls rendered without horizontal
  overflow; browser page-error checks reported no application errors.

## Journal Protocol

For each working cycle append:

1. Date and objective.
2. Changed files or functional behaviors.
3. Validation actually run and its result.
4. Open mathematical or engineering risks.
5. Next bounded task.
