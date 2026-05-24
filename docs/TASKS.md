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
