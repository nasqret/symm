# Unit Cell Designer

A browser editor for constructing periodic colored tilings, viewing their CW-complex data, and inspecting symmetry operations against the current coloring.

## Run

```bash
npm install
npm run dev
```

The editor supports:

- oblique/generic, rectangular, square, and hexagonal translation lattices;
- periodic vertices and edges, including edges whose endpoint is in a neighboring cell;
- detected bounded face cycles, palette coloring/clearing, merge-colored vertex and edge deletion,
  undo/redo, JSON export/import, and autosave;
- a separate repeated-tiling preview window;
- a colored-symmetry report and editable starter motifs for the 17 plane groups.

## Documentation

- [Project plan](docs/PLAN.md)
- [Journal](docs/JOURNAL.md)
- [Cycle checklist](docs/TASKS.md)
- [Reusable project memory](docs/PROJECT_MEMORY.md)
- [Plane-group knowledge base](knowledge-base/README.md)

## Mathematical Scope

This first release computes symmetries by testing lattice-compatible affine isometries against vertices, periodic edges, and face colors. The 17 presets are editable generating motifs and documentation anchors. The knowledge base records which parts are computationally checked and which require future crystallographic certification against standard settings.
