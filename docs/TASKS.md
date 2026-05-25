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

## Cycle Record: 2026-05-25 Supplied Hierarchy And Featured Walk

- [x] Reconstructed the supplied `sources/hierarchy.png` hierarchy using standard group labels.
- [x] Authored the `p6mm -> p1 -> p4mm -> p4gm -> p1` teaching walk with the `p1`
  lattice-family homotopy.
- [x] Added a live colored group box and restrained highlighted route within the full graph.
- [x] Cancelled queued animation phases when manual graph exploration or walk restart takes over.
- [x] Ran `npm run typecheck`, `npm run build`, desktop hierarchy/motion checks and a mobile
  17-node no-overflow check without browser page errors.

## Cycle Record: 2026-05-25 Accelerating Color Threshold

- [x] Replaced color-only crossfades with a staged transition that keeps the source group
  selected until the incoming coloring is committed.
- [x] Limited flicker and transient outlining to face signatures whose colors change, with
  frequency accelerating toward settlement.
- [x] Preserved lattice homotopy as a distinct cross-family transition and bypassed repeated
  flicker for reduced-motion users.
- [x] Ran `npm run typecheck`, `npm run build`, normal-motion threshold sampling,
  reduced-motion settlement and `p1` lattice-homotopy browser checks without page errors.

## Cycle Record: 2026-05-25 Exact Preserve-Symmetry Lock

- [x] Identified that orbit propagation can accidentally restore extra symmetries and move a
  locked state to a supergroup.
- [x] Added a shared exact-symbol guard for locked face, vertex and edge edits.
- [x] Display a blocked-edit reason naming both the locked type and the would-be detected type.
- [x] Ran `npm run typecheck`, `npm run build` and rendered `pgg` locked-edit regression checks
  for both blocked and accepted face-orbit recolorings without browser page errors.

## Cycle Record: 2026-05-25 Minimal Witness Explorer Motion

- [x] Replaced dense explorer color fields with minimal classifier-verified accent witness
  orbits over a shared dark field.
- [x] Moved accelerating threshold blinking to CSS keyframes so terminal pulses remain visible
  without repeated React SVG reconstruction.
- [x] Replaced per-frame lattice path generation with an affine SVG `p1` homotopy and grouped
  edge contraction on a bounded bridge field.
- [x] Ran `git diff --check`, `npm run typecheck`, `npm run build`, all-stage classification
  checks, threshold cadence sampling and cross-family bridge browser checks.

## Cycle Record: 2026-05-25 Hidden CW Diagnostic Panel

- [x] Removed the CW-complex inventory section from the rendered mathematical inspector.
- [x] Removed editor-only face extraction passed solely to that hidden view while preserving
  face-based symmetry and canvas behavior.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [ ] Complete rendered inspector verification when the browser validation interface is
  available in the session.

## Cycle Record: 2026-05-25 Compact Editor Controls

- [x] Made every left-panel construction section foldable with its state retained during edits.
- [x] Grayed and disabled plane-group presets outside the selected canonical lattice family.
- [x] Removed the unexplained fractional-cursor readout and its unused tracking path.
- [x] Ran `git diff --check`, cursor-path source checks, `npm run typecheck` and `npm run build`.
- [ ] Complete rendered folding/preset-button interaction verification when the browser
  validation interface is available in the session.

## Cycle Record: 2026-05-25 Palette Keyboard And Swipe Selection

- [x] Assigned keys `1`-`7` to the seven palette swatches and switched into Color face mode
  when a keyboard color is selected.
- [x] Added vertical swipe cycling on the editor canvas in Color face mode, with tap painting
  deferred to release so a recognized swipe does not paint or clear a face.
- [x] Kept swipe cycling inactive in topology modes to avoid modifying vertex or edge actions.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [ ] Complete rendered keyboard/touch interaction verification when the browser validation
  interface is available in the session.

## Cycle Record: 2026-05-25 Contrasting Symmetry Visuals

- [x] Replaced tile-palette colors in selectable symmetry overlays with one dedicated
  high-contrast annotation accent.
- [x] Added a light separation halo and outlined translation labels for readability over
  saturated and dark colored faces.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [ ] Complete rendered selection checks for translation, rotation, mirror and glide overlays
  when the browser validation interface is available in the session.

## Cycle Record: 2026-05-25 Symmetry List Spacing

- [x] Widened the transformation-type column and added explicit separation before each
  transformation name in the right-panel symmetry list.
- [x] Allowed unusually long transformation names to wrap inside their assigned column rather
  than crowding their caption.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [ ] Complete rendered inspector spacing checks when the browser validation interface is
  available in the session.

## Cycle Record: 2026-05-25 Seamless Face-Only Rendering

- [x] Added a narrow same-fill overlap stroke to face paths only while the edge layer is
  hidden, suppressing paper-colored anti-alias breaks between neighboring regions.
- [x] Kept the seam suppression inline on SVG face elements so preview SVG/PNG export and
  animated presentation rendering inherit the same visual correction.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [x] Confirmed the export serializer clones inline face styling used for the overlap stroke.
- [ ] Complete rendered face-only editor/preview/export checks when the browser validation
  interface is available in the session.

## Cycle Record: 2026-05-25 Introduction And Default Symmetry Editing

- [x] Initialized Preserve symmetry as enabled for the detected group of the document loaded
  at editor startup, while retaining the manual off switch for unrestricted edits.
- [x] Added a dismissible first-open Guide overlay with a header action for reopening it.
- [x] Added a `#about` page describing construction, symmetry analysis and presentation,
  including `Copyright Bartosz Naskrecki 2026`.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [x] Confirmed by source inspection that the lock initializes from the loaded document and
  that the About route contains the requested copyright notice.
- [ ] Complete rendered checks for guide dismissal/reopening, About navigation and the
  initially active symmetry lock when the browser validation interface is available.

## Cycle Record: 2026-05-25 Compact Face Color Guidance

- [x] Removed the boundary-crossing edge and vertex/edge deletion instruction paragraphs from
  the Face Color foldout.
- [x] Retained the palette keyboard and swipe guidance in that section.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [x] Confirmed by source inspection that the removed instructional strings are no longer
  rendered by the Face Color foldout.
- [ ] Complete rendered foldout-content verification when the browser validation interface is
  available in the session.

## Cycle Record: 2026-05-25 Default Color Face Tool

- [x] Set the initial Construct selection to Color face so new editor sessions start directly
  in the recoloring workflow.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [x] Confirmed by source inspection that the editor's initial `EditorTool` state is `color`.
- [ ] Complete rendered initial-tool verification when the browser validation interface is
  available in the session.

## Cycle Record: 2026-05-25 Nonblank Minimal Presets

- [x] Identified blank built-in preset decorations for `p2`, `cmm`, `p4m` and `p6m`.
- [x] Found smallest nonempty one-color target-group orbits: `2`, `4`, `4` and `2`
  painted faces respectively, each classifying to its requested group.
- [x] Added an invariant rejecting future zero-face built-in preset decorations.
- [x] Ran the full 17-preset classifier sweep: every generated starter is nonblank and
  classifies to its requested group.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [ ] Complete rendered preset sampling when the browser validation interface is available
  in the session.

## Cycle Record: 2026-05-25 Restrained Continuous Walk

- [x] Removed the explorer's dark field, neon branch palette, animated aura/ripple and
  spectrum-shifting canvas treatment.
- [x] Retained subgroup threshold blinking and the cross-lattice `p1` homotopy as the
  informative transition mechanisms.
- [x] Added nonblank minimal witness orbits for the explorer's formerly undecorated
  `p2`, `cmm`, `p4m` and `p6m` stages.
- [x] Ran all 23 supported explorer-stage classifications: every stage has a visible accent
  witness and retains its requested wallpaper-group symbol.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [ ] Complete rendered walk verification when the browser validation interface is available
  in the session.

## Cycle Record: 2026-05-25 Stroke-Free Face-Only Rendering

- [x] Diagnosed the hidden-edge bezel as the same-fill overlap stroke previously applied to
  each face to mask anti-aliased seams.
- [x] Removed per-face overlap strokes and marked the hidden-edge SVG face group with
  serialized `shape-rendering="crispEdges"`.
- [x] Suppressed temporary threshold outlines when the animated explorer is also in
  hidden-edge mode.
- [x] Verified generated hidden-edge SVG markup contains the serialized crisp-edge face group
  with no overlap-stroke style and no `canvas-edges` group; visible-edge SVG still contains
  the motif-edge group.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [ ] Complete rendered editor/preview/export verification when the browser validation
  interface is available in the session.

## Cycle Record: 2026-05-25 Expanded Face Color Panel

- [x] Set the Face Color construction foldout to open by default alongside the initial
  Color face tool.
- [x] Verified server-rendered initial panel markup includes
  `<details class="tool-fold" open="">` for Face Color.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [ ] Complete interactive screenshot verification when the browser validation interface is
  available in the session.

## Cycle Record: 2026-05-25 Public Pages And Mobile Recoloring Mode

- [x] Added a mobile-only recoloring workflow with no vertex or edge creation/removal controls
  and guards preventing topology handlers from acting at phone widths.
- [x] Replaced the phone layout with translucent foldable icon tabs and larger touch targets.
- [x] Disabled subgroup exploration on mobile from editor navigation, preview navigation and
  direct `#demo` entry.
- [x] Added the Vite GitHub Pages base path and a Pages deployment workflow for pushes to
  `main`.
- [x] Repaired initial Pages provisioning by setting `configure-pages` enablement after the
  first public-repository run reported that no Pages site was configured.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`; verified production
  asset references are emitted below `/symm/assets/`.
- [x] Verified rendered responsive markup: mobile hides topology and explorer actions and
  blocks the `#demo` route, while desktop retains construction and explorer controls.
- [ ] Verify the responsive rendered surface interactively when the Browser interface is
  exposed in the session.
- [x] Made `nasqret/symm` public, enabled workflow-backed GitHub Pages through administrator
  configuration after the Actions token could not provision it, reran the deployment
  successfully and confirmed that the published app responds with HTTP `200`.

## Cycle Record: 2026-05-26 Stable Paint Hover Rendering

- [x] Removed the SVG brightness filter from paintable-face hover rendering.
- [x] Kept the hover opacity cue only where visible motif edges cover face boundaries; hidden
  edge mode leaves face opacity stable while hovering.
- [x] Preserved stroke-free crisp-edge rendering for face-only editor, preview and export use.
- [x] Ran `git diff --check`, `npm run typecheck` and `npm run build`.
- [ ] Complete interactive hover screenshot verification when the Browser interface is exposed
  in the session.
