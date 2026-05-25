# Unit Cell Designer

A browser editor for constructing periodic colored tilings and inspecting symmetry operations against the current coloring. CW-complex data remains part of the internal computation, but its diagnostic panel is currently hidden.

## Published App

The public GitHub Pages deployment is configured for `https://nasqret.github.io/symm/`.
Pushes to `main` build and publish the Vite application through GitHub Actions.

## Run

```bash
npm install
npm run dev
```

The editor supports:

- oblique/generic, rectangular, square, and hexagonal translation lattices;
- foldable construction controls and lattice-specific enabled preset choices;
- a mobile touch mode with translucent foldable icon controls, prepared-motif recoloring,
  symmetry inspection and export; it begins in face-only display with edges and vertices
  hidden, and topology editing and subgroup exploration are disabled on small screens;
- grid-constrained periodic vertices and edges, including edges whose endpoint is in a
  neighboring cell;
- detected bounded face cycles including nested interior regions, palette coloring/clearing,
  double-click vertex/edge deletion with merge coloring, undo/redo, JSON export/import, and
  autosave; the editor begins in Color face mode, and palette colors can be selected with keys
  `1`-`7` or cycled by swiping vertically on the canvas in Color face mode;
- a separate repeated-tiling preview window;
- persistent display switches for hiding edges and vertices in the editor, preview, animated
  presentation and exported images, including a face-only output mode;
- preview export as standalone SVG or PNG at low (`900 x 690`), medium (`1800 x 1380`) and
  high (`3600 x 2760`) resolution, with an ambient display mode;
- an animated subgroup-exploration presentation reconstructing the supplied 17-group hierarchy
  with standard labels (`p6mm`, `p4mm`, `p4gm`, etc.), a highlighted live node and a featured
  walk from `p6mm` through `p1` to `p4mm` and back through `p4gm`; within a lattice family its
  minimal nonblank accent witnesses appear on a quiet paper field and pulse only the changing
  tiles at accelerating frequency until the new group settles, while cross-family ascents pass
  through a smoothly transformed, edge-contracting `p1` lattice homotopy;
- a colored-symmetry report with selectable visual generators: translation arrows, rotation
  arcs, mirror loci and glide axes;
- Preserve symmetry editing enabled on entry, propagating color and topology edits through the
  currently locked generator closure and blocking edits that would change the exact locked
  wallpaper group; it can be disabled for free symmetry-breaking edits;
- a first-open guide overlay and an About page describing the editor and its mathematical
  purpose; and
- nonblank minimally decorated editable starter motifs for the 17 plane groups.

## Documentation

- [Project plan](docs/PLAN.md)
- [Journal](docs/JOURNAL.md)
- [Cycle checklist](docs/TASKS.md)
- [Reusable project memory](docs/PROJECT_MEMORY.md)
- [Plane-group knowledge base](knowledge-base/README.md)

## Mathematical Scope

This first release computes symmetries by testing lattice-compatible affine isometries against vertices, periodic edges, and face colors. The 17 presets are editable generating motifs and documentation anchors. The subgroup explorer presents the supplied finite hierarchy of wallpaper-group types; finite-index translation copies within a type are not expanded as separate nodes. The knowledge base records which parts are computationally checked and which require future crystallographic certification against standard settings.
